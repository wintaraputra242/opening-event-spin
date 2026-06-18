<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function index(Request $request)
    {
        if ($request->session()->get('admin_token') === config('app.admin_token')) {
            return redirect()->route('guests.index');
        }

        return Inertia::render('Login');
    }

    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        if ($request->token !== config('app.admin_token')) {
            return back()->withErrors(['token' => 'Token salah, coba lagi.']);
        }

        $request->session()->put('admin_token', $request->token);

        $intended = $request->session()->pull('url.intended', route('guests.index'));

        return redirect($intended);
    }

    public function destroy(Request $request)
    {
        $request->session()->forget('admin_token');

        return redirect()->route('login');
    }
}
