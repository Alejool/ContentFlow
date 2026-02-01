<?php

use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\Campaigns\ScheduledPostController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::prefix('campaigns')->name('campaigns.')->group(function () {
    Route::get('/', [CampaignController::class, 'index'])->name('index');
    Route::post('/', [CampaignController::class, 'store'])->name('store');
    Route::get('/{campaign}', [CampaignController::class, 'show'])->name('show');
    Route::put('/{campaign}', [CampaignController::class, 'update'])->name('update');
    Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->name('destroy');
    Route::post('/{campaign}/duplicate', [CampaignController::class, 'duplicate'])->name('duplicate');
  });

  Route::prefix('scheduled-posts')->name('scheduled-posts.')->group(function () {
    Route::delete('/{id}', [ScheduledPostController::class, 'destroy'])->name('destroy');
  });
});
