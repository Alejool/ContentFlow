<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\Analytics\AnalyticsController;
use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\Campaigns\ScheduledPostController;
use App\Http\Controllers\SocialAccount\SocialAccountController;
use App\Http\Controllers\SocialLogs\SocialPostLogController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// Google Authentication (receives user data from frontend)
Route::post('/auth/google', [AuthController::class, 'handleGoogleAuth']);

/*
|--------------------------------------------------------------------------
| Protected API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {

    /*
    |----------------------------------------------------------------------
    | AI Chat API
    |----------------------------------------------------------------------
    */
    Route::prefix('ai')->name('api.ai.')->group(function () {
        Route::post('/chat', [AIChatController::class, 'processMessage'])->name('chat');
    });

    /*
    |----------------------------------------------------------------------
    | Analytics API
    |----------------------------------------------------------------------
    */
    Route::prefix('analytics')->name('api.analytics.')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'getDashboardStats'])->name('dashboard');
        Route::get('/campaigns/{id}', [AnalyticsController::class, 'getCampaignAnalytics'])->name('campaigns.show');
        Route::get('/social-media', [AnalyticsController::class, 'getSocialMediaMetrics'])->name('social-media');
        Route::get('/engagement', [AnalyticsController::class, 'getEngagementData'])->name('engagement');
        Route::get('/platform-comparison', [AnalyticsController::class, 'getPlatformComparison'])->name('platform-comparison');
        Route::get('/export', [AnalyticsController::class, 'exportData'])->name('export');
        Route::post('/', [AnalyticsController::class, 'store'])->name('store');
    });

   

    /*
    |----------------------------------------------------------------------
    | Scheduled Posts API
    |----------------------------------------------------------------------
    */
    Route::prefix('scheduled-posts')->name('api.scheduled-posts.')->group(function () {
        Route::delete('/{id}', [ScheduledPostController::class, 'destroy'])->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Social Post Logs API
    |----------------------------------------------------------------------
    */
    // Route::prefix('social-post-logs')->name('api.social-post-logs.')->group(function () {
    //     Route::get('/campaign/{campaignId}', [SocialPostLogController::class, 'index'])->name('campaign.index');
    //     Route::get('/failed/all', [SocialPostLogController::class, 'failed'])->name('failed.all');
    //     Route::get('/{id}', [SocialPostLogController::class, 'show'])->name('show');
    //     Route::post('/{id}/retry', [SocialPostLogController::class, 'retry'])->name('retry');
    //     Route::post('/campaign/{campaignId}/retry-all', [SocialPostLogController::class, 'retryAllFailed'])->name('campaign.retry-all');
    //     Route::delete('/{id}', [SocialPostLogController::class, 'destroy'])->name('destroy');
    // });

    /*
    |----------------------------------------------------------------------
    | Social Accounts API
    |----------------------------------------------------------------------
    */
    // Route::prefix('social-accounts')->name('api.social-accounts.')->group(function () {
    //     Route::get('/', [SocialAccountController::class, 'index'])->name('index');
    //     Route::post('/', [SocialAccountController::class, 'store'])->name('store');
    //     Route::get('/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('auth-url');
    //     Route::delete('/{id}', [SocialAccountController::class, 'destroy'])->name('destroy');
    // });
});
