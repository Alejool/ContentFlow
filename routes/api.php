<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\Analytics\AnalyticsController;
use App\Http\Controllers\Campaigns\CampaignController;

// Google Authentication (receives user data from frontend)
Route::post('/auth/google', [AuthController::class, 'handleGoogleAuth']);

// AI Chat API
Route::middleware(['auth:sanctum'])->prefix('ai')->group(function () {
    Route::post('/chat', [AIChatController::class, 'processMessage']);
});

// Analytics API
Route::middleware(['auth:sanctum'])->prefix('analytics')->group(function () {
    Route::get('/dashboard', [AnalyticsController::class, 'getDashboardStats']);
    Route::get('/campaigns/{id}', [AnalyticsController::class, 'getCampaignAnalytics']);
    Route::get('/social-media', [AnalyticsController::class, 'getSocialMediaMetrics']);
    Route::get('/engagement', [AnalyticsController::class, 'getEngagementData']);
    Route::get('/platform-comparison', [AnalyticsController::class, 'getPlatformComparison']);
    Route::get('/export', [AnalyticsController::class, 'exportData']);
    Route::post('/', [AnalyticsController::class, 'store']);
});

// Campaigns API
Route::middleware(['auth:sanctum'])->prefix('campaigns')->group(function () {
    Route::get('/', [CampaignController::class, 'index']);
    Route::post('/', [CampaignController::class, 'store']);
    Route::get('/{campaign}', [CampaignController::class, 'show']);
    Route::put('/{campaign}', [CampaignController::class, 'update']);
    Route::delete('/{campaign}', [CampaignController::class, 'destroy']);
    Route::post('/{campaign}/duplicate', [CampaignController::class, 'duplicate']);
});
