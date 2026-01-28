<?php

use App\Http\Controllers\ApprovalController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::prefix('approvals')->name('approvals.')->group(function () {
    Route::get('/stats', [ApprovalController::class, 'stats'])->name('stats');
    Route::get('/history', [ApprovalController::class, 'history'])->name('history');
    Route::get('/', [ApprovalController::class, 'index'])->name('index');
  });
});
