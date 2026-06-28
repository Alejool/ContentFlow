<?php

use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\Campaigns\ScheduledPostController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::prefix('campaigns')->name('campaigns.')->group(function () {
    Route::middleware('token.ability:campaigns:read')->group(function () {
      Route::get('/', [CampaignController::class, 'index'])->name('index');
      Route::get('/export', [CampaignController::class, 'export'])->name('export');
      Route::get('/{campaign}', [CampaignController::class, 'show'])->name('show');
    });
    Route::middleware('token.ability:campaigns:create')->group(function () {
      Route::post('/', [CampaignController::class, 'store'])->name('store');
      Route::post('/{campaign}/duplicate', [CampaignController::class, 'duplicate'])->name('duplicate');
    });
    Route::middleware('token.ability:campaigns:update')->group(function () {
      Route::put('/{campaign}', [CampaignController::class, 'update'])->name('update');
    });
    Route::middleware('token.ability:campaigns:delete')->group(function () {
      Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->name('destroy');
    });
  });

  Route::prefix('scheduled-posts')->name('scheduled-posts.')->group(function () {
    Route::delete('/{id}', [ScheduledPostController::class, 'destroy'])->name('destroy');
  });
});
