<?php

use App\Http\Controllers\Social\SocialAccountController;
use App\Http\Controllers\Logs\SocialPostLogController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {

  // ── Read ───────────────────────────────────────────────────────────────────
  Route::middleware('token.ability:social:read')->group(function () {
    Route::get('/social-accounts/token-health', [SocialAccountController::class, 'tokenHealth'])->name('social-accounts.token-health');
    Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('social-accounts.auth-url');
    Route::get('/social-accounts/{id}/publishing-status', [SocialAccountController::class, 'getPublishingStatus'])->name('social-accounts.publishing-status');
    Route::apiResource('social-accounts', SocialAccountController::class)->only(['index'])->names(['index' => 'index']);
    Route::prefix('social-accounts/capabilities')->name('social-accounts.capabilities.')->group(function () {
      Route::get('/', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'index'])->name('index');
      Route::get('/{account}', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'show'])->name('show');
    });
    Route::prefix('logs')->name('social-logs.')->group(function () {
      Route::get('/', [SocialPostLogController::class, 'index'])->name('index');
      Route::get('/export', [SocialPostLogController::class, 'export'])->name('export');
    });
  });

  // ── Manage ─────────────────────────────────────────────────────────────────
  Route::middleware('token.ability:social:manage')->group(function () {
    Route::apiResource('social-accounts', SocialAccountController::class)->only(['store', 'destroy'])->names(['store' => 'store', 'destroy' => 'destroy']);
    Route::prefix('social-accounts/capabilities')->name('social-accounts.capabilities.')->group(function () {
      Route::post('/{account}/refresh', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'refresh'])->name('refresh');
      Route::post('/validate-video', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'validateVideo'])->name('validate-video');
    });
  });

});
