<?php

namespace App\Http\Controllers;

use App\Models\Guest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Imports\GuestsImport;
use App\Exports\GuestsExport;
use Maatwebsite\Excel\Facades\Excel;

class GuestController extends Controller
{
    public function index()
    {
        $guests = Guest::latest()->get();

        return Inertia::render('Guests/Index', [
            'guests' => $guests,
        ]);
    }

    public function create()
    {
        return Inertia::render('Guests/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'phone'  => 'nullable|string|max:20',
            'office' => 'nullable|string|max:255',
            'code'   => 'nullable|string|unique:guests,code|max:50',
        ]);

        Guest::create([
            'name'       => $request->name,
            'phone'      => $request->phone,
            'office'     => $request->office,
            'code'       => $request->code ? strtoupper($request->code) : null,
            'is_present' => false,
        ]);

        return redirect()->route('guests.index')->with('success', 'Tamu berhasil ditambahkan.');
    }

    public function show(Guest $guest)
    {
        return Inertia::render('Guests/Detail', [
            'guest' => $guest,
        ]);
    }

    public function edit(Guest $guest)
    {
        return Inertia::render('Guests/Edit', [
            'guest' => $guest,
        ]);
    }

    public function update(Request $request, Guest $guest)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'phone'      => 'nullable|string|max:20',
            'office'     => 'nullable|string|max:255',
            'code'       => 'nullable|string|max:50|unique:guests,code,' . $guest->id . '|required_if:is_present,true',
            'is_present' => 'boolean',
        ]);

        $guest->update([
            'name'       => $request->name,
            'phone'      => $request->phone,
            'office'     => $request->office,
            'code'       => $request->code && $request->is_present ? strtoupper($request->code) : null,
            'is_present' => $request->is_present,
        ]);

        return redirect()->route('guests.index')->with('success', 'Data tamu berhasil diperbarui.');
    }

    public function destroy(Guest $guest)
    {
        $guest->delete();

        return redirect()->route('guests.index')->with('success', 'Tamu berhasil dihapus.');
    }

    // Import dari Excel
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
        ]);

        Excel::import(new GuestsImport, $request->file('file'));

        return redirect()->route('guests.index')->with('success', 'Data tamu berhasil diimport.');
    }

    // Download template Excel
    public function exportTemplate()
    {
        return Excel::download(new GuestsExport, 'template-tamu.xlsx');
    }
}
