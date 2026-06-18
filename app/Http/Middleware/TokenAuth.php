<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TokenAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->session()->get('admin_token');
        $validToken = config('app.admin_token');

        if ($token !== $validToken) {
            $request->session()->put('url.intended', $request->fullUrl());
            return redirect()->route('login');
        }

        return $next($request);
    }
}
