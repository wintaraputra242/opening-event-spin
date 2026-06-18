<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\PrizeController;
use App\Http\Controllers\LotteryController;
use Illuminate\Support\Facades\Route;

// Login
Route::get('/login', [AuthController::class, 'index'])->name('login');
Route::post('/login', [AuthController::class, 'store'])->name('login.store');
Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

// Admin (protected)
Route::middleware('token.auth')->group(function () {
    Route::get('/', fn() => redirect()->route('guests.index'));

    // Tamu
    Route::post('/guests/import', [GuestController::class, 'import'])->name('guests.import');
    Route::get('/guests/export-template', [GuestController::class, 'exportTemplate'])->name('guests.export-template');
    Route::resource('guests', GuestController::class);

    // Hadiah
    Route::resource('prizes', PrizeController::class);

    // Undian
    Route::get('/lottery', [LotteryController::class, 'index'])->name('lottery.index');
    Route::post('/lottery/spin', [LotteryController::class, 'spin'])->name('lottery.spin');
    Route::post('/lottery/pick', [LotteryController::class, 'pick'])->name('lottery.pick');
    Route::post('/lottery/bulk-pick', [LotteryController::class, 'bulkPick'])->name('lottery.bulk-pick');
    Route::delete('/lottery/reset', [LotteryController::class, 'reset'])->name('lottery.reset');
});
