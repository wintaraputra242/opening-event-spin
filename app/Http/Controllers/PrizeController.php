<?php

namespace App\Http\Controllers;

use App\Models\LotteryResult;
use App\Models\Prize;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrizeController extends Controller
{
    public function index()
    {
        $prizes = Prize::latest()->get();

        // dd($prizes);

        return Inertia::render('Prizes/Index', [
            'prizes' => $prizes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Prizes/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'stock'       => 'required|integer|min:1',
        ]);

        Prize::create([
            'name'          => $request->name,
            'description'   => $request->description,
            'stock'         => $request->stock,
            'initial_stock' => $request->stock, // sama dengan stock awal
            'is_claimed'    => false,
        ]);

        return redirect()->route('prizes.index')->with('success', 'Hadiah berhasil ditambahkan.');
    }

    public function edit(Prize $prize)
    {
        return Inertia::render('Prizes/Edit', [
            'prize' => $prize,
        ]);
    }

    public function update(Request $request, Prize $prize)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'stock'       => 'required|integer|min:0',
            'is_claimed'  => 'nullable|boolean',
        ]);

        $prize->update([
            'name'          => $request->name,
            'description'   => $request->description,
            'stock'         => $request->stock,
            // 'initial_stock' => $prize->initial_stock === 0 ? $request->stock : $prize->initial_stock,
            'initial_stock' => $request->stock,
            'is_claimed'    => $request->stock <= 0,
        ]);

        return redirect()->route('prizes.index')->with('success', 'Hadiah berhasil diperbarui.');
    }

    public function destroy(Prize $prize)
    {
        // Hapus hasil undian yang berelasi dulu
        LotteryResult::where('prize_id', $prize->id)->delete();

        $prize->delete();

        return redirect()->route('prizes.index')->with('success', 'Hadiah berhasil dihapus.');
    }

    public function show(Prize $prize)
    {
        return Inertia::render('Prizes/Detail', [
            'prize' => $prize,
        ]);
    }
}
