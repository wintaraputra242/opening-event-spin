<?php

namespace App\Http\Controllers;

use App\Models\FixedWinner;
use App\Models\Guest;
use App\Models\Prize;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FixedWinnerController extends Controller
{
  public function index()
  {
    $fixedWinners = FixedWinner::with(['guest', 'prize'])
      ->latest()
      ->get();

    return Inertia::render('FixedWinners/Index', [
      'fixedWinners' => $fixedWinners,
    ]);
  }

  public function create()
  {
    return Inertia::render('FixedWinners/Create', [
      'prizes' => Prize::orderBy('name')->get(['id', 'name', 'stock']),
    ]);
  }

  /**
   * Cari tamu berdasarkan nomor telepon (dipanggil dari form via fetch/axios)
   */
  public function findGuestByPhone(Request $request)
  {
    $request->validate([
      'phone' => 'required|string',
    ]);

    $guest = Guest::where('phone', $request->phone)->first();

    if (!$guest) {
      return response()->json([
        'success' => false,
        'message' => 'Nomor telepon tidak ditemukan di data tamu.',
      ], 404);
    }

    // Cek apakah tamu ini sudah terdaftar sebagai kupon fix sebelumnya
    $alreadyFixed = FixedWinner::where('guest_id', $guest->id)->with('prize')->first();

    if ($alreadyFixed) {
      return response()->json([
        'success' => false,
        'message' => "Tamu ini sudah terdaftar sebagai kupon fix untuk hadiah \"{$alreadyFixed->prize->name}\".",
      ], 422);
    }

    return response()->json([
      'success' => true,
      'guest'   => $guest,
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'phone'    => 'required|string',
      'prize_id' => 'required|exists:prizes,id',
    ]);

    $guest = Guest::where('phone', $request->phone)->first();

    if (!$guest) {
      return back()
        ->withErrors(['phone' => 'Nomor telepon tidak ditemukan di data tamu.'])
        ->withInput();
    }

    if (FixedWinner::where('guest_id', $guest->id)->exists()) {
      return back()
        ->withErrors(['phone' => 'Tamu ini sudah terdaftar sebagai kupon fix untuk hadiah lain.'])
        ->withInput();
    }

    FixedWinner::create([
      'guest_id' => $guest->id,
      'prize_id' => $request->prize_id,
    ]);

    return redirect()->route('fixed-winners.index')->with('success', 'Kupon fix berhasil ditambahkan.');
  }

  public function destroy(FixedWinner $fixedWinner)
  {
    $fixedWinner->delete();

    return redirect()->route('fixed-winners.index')->with('success', 'Kupon fix berhasil dihapus.');
  }
}
