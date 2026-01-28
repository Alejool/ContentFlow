<?php

use App\Http\Controllers\Analytics\AnalyticsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('analytics')->name('analytics.')->group(function () {
  Route::get('/dashboard', [AnalyticsController::class, 'getDashboardStats'])->name('dashboard');
  Route::get('/campaigns/{id}', [AnalyticsController::class, 'getCampaignAnalytics'])->name('campaigns.show');
  Route::get('/social-media', [AnalyticsController::class, 'getSocialMediaMetrics'])->name('social-media');
  Route::get('/engagement', [AnalyticsController::class, 'getEngagementData'])->name('engagement');
  Route::get('/platform-comparison', [AnalyticsController::class, 'getPlatformComparison'])->name('platform-comparison');
  Route::get('/export', [AnalyticsController::class, 'exportData'])->name('export');
  Route::post('/', [AnalyticsController::class, 'store'])->name('store');
});
