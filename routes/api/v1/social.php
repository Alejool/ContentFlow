<?php

use App\Http\Controllers\Social\SocialAccountController;
use App\Http\Controllers\Logs\SocialPostLogController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::apiResource('social-accounts', SocialAccountController::class)->names([
    'index' => 'index',
    'store' => 'store',
    'show' => 'show',
    'update' => 'update',
    'destroy' => 'destroy',
  ]);

  Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('social-accounts.auth-url');

  Route::prefix('logs')->name('social-logs.')->group(function () {
    Route::get('/', [SocialPostLogController::class, 'index'])->name('index');
    Route::get('/export', [SocialPostLogController::class, 'export'])->name('export');
  });
});
