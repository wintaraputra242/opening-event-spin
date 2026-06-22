<?php

namespace App\Http\Controllers;

use App\Models\FixedWinner;
use App\Models\Guest;
use App\Models\Prize;
use App\Models\LotteryResult;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Session;

class LotteryController extends Controller
{
    public function index()
    {
        $results = LotteryResult::with(['guest', 'prize'])->latest()->get();
        $guests  = Guest::all();
        $prizes  = Prize::all();

        return Inertia::render('Lottery/Index', [
            'results' => $results,
            'guests'  => $guests,
            'prizes'  => $prizes,
        ]);
    }

    /**
     * Ambil daftar guest_id kupon fix untuk 1 hadiah tertentu,
     * yang masih valid dipakai: belum is_used, tamunya hadir,
     * dan belum pernah menang di hasil undian manapun.
     */
    private function getAvailableFixedGuestIdsForPrize(int $prizeId): array
    {
        $alreadyWonGuestIds = LotteryResult::pluck('guest_id')->toArray();

        return FixedWinner::where('prize_id', $prizeId)
            ->where('is_used', false)
            ->whereNotIn('guest_id', $alreadyWonGuestIds)
            ->whereHas('guest', function ($q) {
                $q->where('is_present', true)->whereNotNull('code');
            })
            ->pluck('guest_id')
            ->toArray();
    }

    /**
     * Ambil daftar guest_id yang terdaftar sebagai fixed winner untuk HADIAH LAIN
     * (selain $exceptPrizeId) dan masih berlaku (belum is_used, belum pernah menang).
     *
     * Tamu-tamu ini harus "dilindungi"/dikecualikan dari pool random di hadiah
     * manapun selain hadiah yang sudah dijatahkan untuknya. Kalau tidak,
     * mereka bisa "ke-random" duluan di hadiah lain sebelum gilirannya sendiri tiba.
     */
    private function getReservedGuestIdsForOtherPrizes(int $exceptPrizeId): array
    {
        $alreadyWonGuestIds = LotteryResult::pluck('guest_id')->toArray();

        return FixedWinner::where('prize_id', '!=', $exceptPrizeId)
            ->where('is_used', false)
            ->whereNotIn('guest_id', $alreadyWonGuestIds)
            ->pluck('guest_id')
            ->toArray();
    }

    /**
     * Tentukan apakah pick KALI INI harus pakai kupon fix, atau random biasa.
     *
     * Stateless (tidak pakai session) supaya tidak pernah out-of-sync
     * walau admin pindah-pindah pilihan hadiah atau refresh halaman.
     *
     * Caranya: hitung peluang = sisaKuponFix / sisaStok.
     * - Kalau sisaKuponFix == sisaStok -> pasti pakai fix (peluang 100%), supaya
     *   kupon fix dijamin tidak pernah kelewat sebelum stok habis.
     * - Kalau sisaKuponFix < sisaStok -> peluang proporsional, jadi posisi
     *   munculnya tetap acak (bisa di awal, tengah, atau akhir).
     */
    private function resolveFixedGuestId(Prize $prize): ?int
    {
        $availableFixedIds = $this->getAvailableFixedGuestIdsForPrize($prize->id);

        if (empty($availableFixedIds) || $prize->stock <= 0) {
            return null;
        }

        $remainingFixed = count($availableFixedIds);
        $remainingStock = $prize->stock;

        $chance = $remainingFixed / $remainingStock;

        if ((mt_rand() / mt_getrandmax()) <= $chance) {
            return $availableFixedIds[array_rand($availableFixedIds)];
        }

        return null;
    }

    /**
     * Tandai fixed_winners sebagai sudah dipakai setelah guest tsb menang.
     * Aman dipanggil walau guest tidak terdaftar sebagai kupon fix (tidak ngapa-ngapain).
     */
    private function markFixedWinnerUsed(int $guestId, int $prizeId): void
    {
        FixedWinner::where('guest_id', $guestId)
            ->where('prize_id', $prizeId)
            ->update(['is_used' => true]);
    }

    /**
     * Pick — dipanggil frontend setelah spin selesai (mode satu-satu)
     * Menerima prize_id, sistem yang menentukan pemenang (random / kupon fix)
     */
    public function pick(Request $request)
    {
        $request->validate([
            'prize_id' => 'required|exists:prizes,id',
        ]);

        $prize = Prize::findOrFail($request->prize_id);

        if ($prize->stock <= 0 || $prize->is_claimed) {
            return response()->json([
                'success' => false,
                'message' => 'Stok hadiah sudah habis.',
            ], 422);
        }

        $alreadyWonIds = LotteryResult::pluck('guest_id')->toArray();

        // Cek apakah slot pick kali ini "dijatahkan" untuk kupon fix hadiah ini
        $fixedGuestId = $this->resolveFixedGuestId($prize);

        $guest = null;

        if ($fixedGuestId) {
            $guest = Guest::where('id', $fixedGuestId)
                ->where('is_present', true)
                ->whereNotIn('id', $alreadyWonIds)
                ->first();
        }

        // Kalau tidak ada slot fix di pick ini, atau ternyata tidak valid -> random biasa
        if (!$guest) {
            // PENTING: kecualikan tamu yang "dijatahkan" sebagai kupon fix
            // untuk hadiah LAIN, supaya tidak ke-random duluan di sini.
            $reservedForOtherPrizes = $this->getReservedGuestIdsForOtherPrizes($prize->id);
            $excludedIds = array_unique(array_merge($alreadyWonIds, $reservedForOtherPrizes));

            $guest = Guest::where('is_present', true)
                ->whereNotNull('code')
                ->whereNotIn('id', $excludedIds)
                ->inRandomOrder()
                ->first();

            // Fallback darurat: kalau ternyata SEMUA tamu sisa adalah kupon fix
            // hadiah lain (tidak ada lagi tamu "bebas"), baru izinkan ambil dari
            // tamu yang reserved tsb, supaya undian tidak buntu/gagal total.
            if (!$guest) {
                $guest = Guest::where('is_present', true)
                    ->whereNotNull('code')
                    ->whereNotIn('id', $alreadyWonIds)
                    ->inRandomOrder()
                    ->first();
            }
        }

        if (!$guest) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada tamu eligible tersisa.',
            ], 422);
        }

        // Simpan hasil
        $result = LotteryResult::create([
            'guest_id' => $guest->id,
            'prize_id' => $prize->id,
        ]);

        // Tandai kupon fix sudah dipakai (no-op kalau guest bukan kupon fix)
        $this->markFixedWinnerUsed($guest->id, $prize->id);

        // Kurangi stok
        $prize->decrement('stock');
        $prize->refresh();

        if ($prize->stock <= 0) {
            $prize->update(['is_claimed' => true]);
        }

        return response()->json([
            'success'   => true,
            'guest'     => $guest,
            'prize'     => $prize,
            'result_id' => $result->id,
        ]);
    }

    /**
     * Bulk pick — untuk mode sekaligus
     * Menerima prize_id, lakukan spin sebanyak stok hadiah tersisa
     * Kupon fix ditempatkan di posisi acak di antara hasil yang dikembalikan
     * Return array pemenang
     */
    public function bulkPick(Request $request)
    {
        $request->validate([
            'prize_id' => 'required|exists:prizes,id',
        ]);

        $prize = Prize::findOrFail($request->prize_id);

        if ($prize->stock <= 0 || $prize->is_claimed) {
            return response()->json([
                'success' => false,
                'message' => 'Stok hadiah sudah habis.',
            ], 422);
        }

        $totalSlots = $prize->stock;

        $alreadyWonIds = LotteryResult::pluck('guest_id')->toArray();

        // ── Tentukan pemenang dari kupon fix hadiah ini dulu ──
        $availableFixedIds = $this->getAvailableFixedGuestIdsForPrize($prize->id);
        $fixedCount = min(count($availableFixedIds), $totalSlots);
        $fixedIds = array_slice($availableFixedIds, 0, $fixedCount);

        $fixedGuests = Guest::whereIn('id', $fixedIds)
            ->where('is_present', true)
            ->whereNotIn('id', $alreadyWonIds)
            ->get()
            ->values();

        $fixedGuestIds = $fixedGuests->pluck('id')->toArray();

        // ── Sisa slot diisi tamu random, KECUALI tamu yang sudah menang
        //    DAN tamu yang dijatahkan sebagai kupon fix untuk hadiah lain ──
        $reservedForOtherPrizes = $this->getReservedGuestIdsForOtherPrizes($prize->id);
        $remainingSlots = $totalSlots - $fixedGuests->count();

        $excludedIds = array_unique(array_merge($alreadyWonIds, $fixedGuestIds, $reservedForOtherPrizes));

        $randomGuests = Guest::where('is_present', true)
            ->whereNotNull('code')
            ->whereNotIn('id', $excludedIds)
            ->inRandomOrder()
            ->take($remainingSlots)
            ->get();

        // Fallback darurat: kalau tamu "bebas" tidak cukup untuk mengisi sisa slot
        // (karena kebanyakan tamu sisa adalah kupon fix hadiah lain), ambil
        // tambahan dari tamu reserved tsb supaya undian tetap bisa jalan.
        if ($randomGuests->count() < $remainingSlots) {
            $stillNeeded = $remainingSlots - $randomGuests->count();
            $excludedIdsSoFar = array_unique(array_merge(
                $alreadyWonIds,
                $fixedGuestIds,
                $randomGuests->pluck('id')->toArray()
            ));

            $extraGuests = Guest::where('is_present', true)
                ->whereNotNull('code')
                ->whereNotIn('id', $excludedIdsSoFar)
                ->inRandomOrder()
                ->take($stillNeeded)
                ->get();

            $randomGuests = $randomGuests->concat($extraGuests);
        }

        if ($fixedGuests->isEmpty() && $randomGuests->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada tamu eligible tersisa.',
            ], 422);
        }

        // ── Gabungkan & ACAK posisi kemunculannya ──
        // supaya kupon fix tidak selalu muncul di pemenang pertama
        $allWinningGuests = $fixedGuests->concat($randomGuests)->values()->all();
        shuffle($allWinningGuests);

        $winners = [];

        foreach ($allWinningGuests as $guest) {
            $lotteryResult = LotteryResult::create([
                'guest_id' => $guest->id,
                'prize_id' => $prize->id,
            ]);

            $this->markFixedWinnerUsed($guest->id, $prize->id);

            $prize->decrement('stock');

            $winners[] = [
                'guest'     => $guest,
                'prize'     => $prize->fresh(),
                'result_id' => $lotteryResult->id,
            ];
        }

        // Tandai hadiah habis jika stok 0
        if ($prize->fresh()->stock <= 0) {
            $prize->update(['is_claimed' => true]);
        }

        return response()->json([
            'success' => true,
            'winners' => $winners,
            'prize'   => $prize->fresh(),
        ]);
    }

    /**
     * Respin — ganti pemenang pada row tertentu
     * Hapus hasil lama, pilih tamu baru untuk hadiah yang sama
     */
    public function respin(Request $request)
    {
        $request->validate([
            'lottery_result_id' => 'required|exists:lottery_results,id',
        ]);

        $result = LotteryResult::findOrFail($request->lottery_result_id);
        $prize  = Prize::findOrFail($result->prize_id);
        $oldGuestId = $result->guest_id;

        // Kembalikan stok dulu sebelum cari pemenang baru
        $prize->increment('stock');
        if ($prize->is_claimed) {
            $prize->update(['is_claimed' => false]);
        }

        // Hapus hasil undian lama
        $result->delete();

        // Kembalikan fixed winner jika ada
        \App\Models\FixedWinner::where('guest_id', $oldGuestId)
            ->where('prize_id', $prize->id)
            ->update(['is_used' => false]);

        // Ambil tamu yang sudah menang (termasuk yang baru saja dihapus tidak termasuk)
        $alreadyWonIds = LotteryResult::pluck('guest_id')->toArray();

        // Cek fixed guest untuk hadiah ini
        $fixedGuestId = $this->resolveFixedGuestId($prize);
        $guest = null;

        if ($fixedGuestId && $fixedGuestId !== $oldGuestId) {
            $guest = Guest::where('id', $fixedGuestId)
                ->where('is_present', true)
                ->whereNotIn('id', $alreadyWonIds)
                ->first();
        }

        // Kalau tidak ada fixed, atau fixed sudah habis -> random biasa
        if (!$guest) {
            $reservedForOtherPrizes = $this->getReservedGuestIdsForOtherPrizes($prize->id);
            $excludedIds = array_unique(array_merge(
                $alreadyWonIds,
                $reservedForOtherPrizes,
                [$oldGuestId]
            ));

            $guest = Guest::where('is_present', true)
                ->whereNotNull('code')
                ->whereNotIn('id', $excludedIds)
                ->inRandomOrder()
                ->first();

            // Fallback terakhir: abaikan reserved, tetap kecualikan tamu lama & yang sudah menang
            if (!$guest) {
                $guest = Guest::where('is_present', true)
                    ->whereNotNull('code')
                    ->whereNotIn('id', array_merge($alreadyWonIds, [$oldGuestId]))
                    ->inRandomOrder()
                    ->first();
            }
        }

        if (!$guest) {
            // Rollback stok kalau tidak ada tamu tersisa
            $prize->decrement('stock');
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada tamu eligible tersisa untuk respin.',
            ], 422);
        }

        // Simpan hasil baru
        $newResult = LotteryResult::create([
            'guest_id' => $guest->id,
            'prize_id' => $prize->id,
        ]);

        $this->markFixedWinnerUsed($guest->id, $prize->id);

        $prize->decrement('stock');
        $prize->refresh();

        if ($prize->stock <= 0) {
            $prize->update(['is_claimed' => true]);
        }

        return response()->json([
            'success'      => true,
            'guest'        => $guest,
            'prize'        => $prize,
            'result_id'    => $newResult->id,
            'old_guest_id' => $oldGuestId,
        ]);
    }

    public function reset()
    {
        LotteryResult::truncate();

        // Kembalikan stok ke nilai awal
        Prize::query()->each(function ($prize) {
            $prize->update([
                'stock'      => $prize->initial_stock,
                'is_claimed' => false,
            ]);
        });

        // Reset status kupon fix supaya bisa dipakai lagi di undian berikutnya
        FixedWinner::query()->update(['is_used' => false]);

        return response()->json(['success' => true]);
    }
}
