<?php

use App\Http\Controllers\Social\SocialAccountController;
use App\Http\Controllers\Logs\SocialPostLogController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::get('/social-accounts/token-health', [SocialAccountController::class, 'tokenHealth'])->name('social-accounts.token-health');
  Route::apiResource('social-accounts', SocialAccountController::class)->names([
    'index' => 'index',
    'store' => 'store',
    'show' => 'show',
    'update' => 'update',
    'destroy' => 'destroy',
  ]);

  Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('social-accounts.auth-url');
  Route::get('/social-accounts/{id}/publishing-status', [SocialAccountController::class, 'getPublishingStatus'])->name('social-accounts.publishing-status');
  
  // Platform Capabilities Routes
  Route::prefix('social-accounts/capabilities')->name('social-accounts.capabilities.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'index'])->name('index');
    Route::get('/{account}', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'show'])->name('show');
    Route::post('/{account}/refresh', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'refresh'])->name('refresh');
    Route::post('/validate-video', [\App\Http\Controllers\Api\SocialAccountCapabilitiesController::class, 'validateVideo'])->name('validate-video');
  });

  Route::prefix('logs')->name('social-logs.')->group(function () {
    Route::get('/', [SocialPostLogController::class, 'index'])->name('index');
    Route::get('/export', [SocialPostLogController::class, 'export'])->name('export');
  });
});
