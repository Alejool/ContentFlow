<?php

use App\Http\Controllers\Profile\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Analytics\AnalyticsController;
use App\Http\Controllers\AIChatController;
use Inertia\Inertia;
use App\Http\Controllers\ManageContent\ManageContentController;
use App\Http\Controllers\Posts\PostsController;
use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\SocialAccount\SocialAccountController;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Locale\LocaleController;

// Public routes
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->middleware('guest')->name('welcome');

// Dashboard
Route::get('/dashboard', [AnalyticsController::class, 'dashboard'])
    ->middleware(['auth'])
    ->name('dashboard');

// Protected routes
Route::middleware(['auth'])->group(function () {

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::put('/profile', [ProfileController::class, 'changePassword'])->name('profile.changePassword');

    // User preferences
    Route::patch('/locale', [LocaleController::class, 'update'])->name('locale.update');
    Route::patch('/theme', [ThemeController::class, 'update'])->name('theme.update');

    // Manage Content
    Route::get('/manage-content', [ManageContentController::class, 'index'])->name('manage-content.index');

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Posts
    Route::get('/posts', [PostsController::class, 'index'])->name('posts.index');

    // AI Chat
    Route::get('/ai-chat', [AIChatController::class, 'index'])->name('ai-chat.index');
    Route::post('/ai-chat/process', [AIChatController::class, 'processMessage'])->name('ai-chat.process');

    // Campaigns
    Route::prefix('campaigns')->group(function () {
        Route::get('/', [CampaignController::class, 'index'])->name('campaigns.index');
        Route::post('/', [CampaignController::class, 'store'])->name('campaigns.store');
        Route::put('/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
        Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->name('campaigns.destroy');
    });

    // Social Media Accounts Management
    Route::prefix('social-accounts')->group(function () {
        // Get connected accounts
        Route::get('/', [SocialAccountController::class, 'index'])->name('social-accounts.index');

        // Get OAuth URL for connecting new account
        Route::get('/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('social-accounts.auth-url');

        // Disconnect account
        Route::delete('/{id}', [SocialAccountController::class, 'destroy'])->name('social-accounts.destroy');
    });

    // Social Media Accounts API (with /api prefix for frontend axios calls)
    Route::prefix('api/social-accounts')->group(function () {
        Route::get('/', [SocialAccountController::class, 'index']);
        Route::post('/', [SocialAccountController::class, 'store']);
        Route::get('/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl']);
        Route::delete('/{id}', [SocialAccountController::class, 'destroy']);
    });

    // Scheduled Posts API
    Route::delete('/api/scheduled-posts/{id}', [\App\Http\Controllers\Campaigns\ScheduledPostController::class, 'destroy']);
});

// OAuth Callbacks (public - no auth required for callbacks)
Route::prefix('auth')->group(function () {
    Route::get('/facebook/callback', [SocialAccountController::class, 'handleFacebookCallback'])->name('auth.facebook.callback');
    Route::get('/instagram/callback', [SocialAccountController::class, 'handleInstagramCallback'])->name('auth.instagram.callback');
    Route::get('/twitter/callback', [SocialAccountController::class, 'handleTwitterCallback'])->name('auth.twitter.callback');
    Route::get('/youtube/callback', [SocialAccountController::class, 'handleYoutubeCallback'])->name('auth.youtube.callback');
    Route::get('/tiktok/callback', [SocialAccountController::class, 'handleTiktokCallback'])->name('auth.tiktok.callback');

    // Google Login Routes
    Route::get('/google/redirect', [\App\Http\Controllers\Auth\AuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
    Route::get('/google/callback', [\App\Http\Controllers\Auth\AuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

require __DIR__ . '/auth.php';
