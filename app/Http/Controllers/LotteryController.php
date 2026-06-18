<?php

namespace App\Http\Controllers;

use App\Models\Guest;
use App\Models\Prize;
use App\Models\LotteryResult;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
     * Pick — dipanggil frontend setelah spin selesai
     * Menerima guest_id + prize_id, simpan hasil undian
     */
    public function pick(Request $request)
    {
        $request->validate([
            'guest_id' => 'required|exists:guests,id',
            'prize_id' => 'required|exists:prizes,id',
        ]);

        $guest = Guest::findOrFail($request->guest_id);
        $prize = Prize::findOrFail($request->prize_id);

        // Cek tamu sudah pernah menang
        if (LotteryResult::where('guest_id', $guest->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Tamu ini sudah pernah menang.',
            ], 422);
        }

        // Cek stok hadiah
        if ($prize->stock <= 0 || $prize->is_claimed) {
            return response()->json([
                'success' => false,
                'message' => 'Stok hadiah sudah habis.',
            ], 422);
        }

        // Simpan hasil
        LotteryResult::create([
            'guest_id' => $guest->id,
            'prize_id' => $prize->id,
        ]);

        // Kurangi stok
        $prize->decrement('stock');
        $prize->refresh();

        if ($prize->stock <= 0) {
            $prize->update(['is_claimed' => true]);
        }

        return response()->json([
            'success' => true,
            'guest'   => $guest,
            'prize'   => $prize,
        ]);
    }

    /**
     * Bulk pick — untuk mode sekaligus
     * Menerima prize_id, lakukan spin sebanyak stok hadiah tersisa
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

        // Ambil tamu eligible yang belum pernah menang
        $alreadyWonIds = LotteryResult::pluck('guest_id')->toArray();

        $eligibleGuests = Guest::where('is_present', true)
            ->whereNotNull('code')
            ->whereNotIn('id', $alreadyWonIds)
            ->inRandomOrder()
            ->take($prize->stock)
            ->get();

        if ($eligibleGuests->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada tamu eligible tersisa.',
            ], 422);
        }

        $winners = [];

        foreach ($eligibleGuests as $guest) {
            LotteryResult::create([
                'guest_id' => $guest->id,
                'prize_id' => $prize->id,
            ]);

            $prize->decrement('stock');

            $winners[] = [
                'guest' => $guest,
                'prize' => $prize->fresh(),
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

        return response()->json(['success' => true]);
    }
}
