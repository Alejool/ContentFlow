<?php

use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Analytics\AnalyticsController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\ManageContent\ManageContentController;
use App\Http\Controllers\Posts\PostsController;
use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\Publications\PublicationController;
use App\Http\Controllers\SocialAccount\SocialAccountController;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Locale\LocaleController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->middleware('guest')->name('welcome');

/*
|--------------------------------------------------------------------------
| OAuth Callback Routes (Public)
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->name('auth.')->group(function () {
    // Social Media OAuth Callbacks
    Route::get('/facebook/callback', [SocialAccountController::class, 'handleFacebookCallback'])->name('facebook.callback');
    Route::get('/instagram/callback', [SocialAccountController::class, 'handleInstagramCallback'])->name('instagram.callback');
    Route::get('/twitter/callback', [SocialAccountController::class, 'handleTwitterCallback'])->name('twitter.callback');
    Route::get('/youtube/callback', [SocialAccountController::class, 'handleYoutubeCallback'])->name('youtube.callback');
    Route::get('/tiktok/callback', [SocialAccountController::class, 'handleTiktokCallback'])->name('tiktok.callback');

    // Google Authentication
    Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('google.redirect');
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('google.callback');
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Authenticated Users)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [AnalyticsController::class, 'dashboard'])->name('dashboard');

    /*
    |----------------------------------------------------------------------
    | Profile Management
    |----------------------------------------------------------------------
    */
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::put('/', [ProfileController::class, 'changePassword'])->name('changePassword');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | User Preferences
    |----------------------------------------------------------------------
    */
    Route::patch('/locale', [LocaleController::class, 'update'])->name('locale.update');
    Route::patch('/theme', [ThemeController::class, 'update'])->name('theme.update');

    /*
    |----------------------------------------------------------------------
    | Content Management (Inertia Views)
    |----------------------------------------------------------------------
    */
    Route::get('/manage-content', [ManageContentController::class, 'index'])->name('manage-content.index');
    Route::get('/posts', [PostsController::class, 'index'])->name('posts.index');

    /*
    |----------------------------------------------------------------------
    | Analytics (Inertia Views)
    |----------------------------------------------------------------------
    */
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    /*
    |----------------------------------------------------------------------
    | AI Chat (Inertia Views)
    |----------------------------------------------------------------------
    */
    Route::get('/ai-chat', [AIChatController::class, 'index'])->name('ai-chat.index');

    /*
    |----------------------------------------------------------------------
    | Publications API (formerly Campaigns)
    |----------------------------------------------------------------------
    */
    Route::prefix('publications')->name('publications.')->group(function () {
        Route::get('/', [PublicationController::class, 'index'])->name('index');
        Route::post('/', [PublicationController::class, 'store'])->name('store');
        Route::get('/{publication}', [PublicationController::class, 'show'])->name('show');
        Route::put('/{publication}', [PublicationController::class, 'update'])->name('update');
        Route::delete('/{publication}', [PublicationController::class, 'destroy'])->name('destroy');
        Route::post('/{publication}/duplicate', [PublicationController::class, 'duplicate'])->name('duplicate');
        Route::get('/{id}/published-platforms', [PublicationController::class, 'getPublishedPlatforms'])->name('published-platforms');
        Route::post('/{id}/publish', [PublicationController::class, 'publish'])->name('publish');
        Route::post('/{id}/unpublish', [PublicationController::class, 'unpublish'])->name('unpublish');
    });

    /*
    |----------------------------------------------------------------------
    | Campaigns API (NEW - for grouping publications)
    |----------------------------------------------------------------------
    */
    Route::prefix('campaigns')->name('campaigns.')->group(function () {
        Route::get('/', [CampaignController::class, 'index'])->name('index');
        Route::post('/', [CampaignController::class, 'store'])->name('store');
        Route::get('/{campaign}', [CampaignController::class, 'show'])->name('show');
        Route::put('/{campaign}', [CampaignController::class, 'update'])->name('update');
        Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Social Media Accounts (Inertia Views)
    |----------------------------------------------------------------------
    */
    // Route::get('/social-accounts', [SocialAccountController::class, 'index'])->name('social-accounts.index');

    Route::prefix('social-accounts')->name('social-accounts.')->group(function () {
        Route::get('/', [SocialAccountController::class, 'index'])->name('index');
        Route::post('/', [SocialAccountController::class, 'store'])->name('store');
        Route::get('/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('auth-url');
        Route::delete('/{id}', [SocialAccountController::class, 'destroy'])->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Social Post Logs
    |----------------------------------------------------------------------
    */
    Route::get('/social-logs', [\App\Http\Controllers\SocialPostLogController::class, 'index'])->name('social-logs.index');
});

require __DIR__ . '/auth.php';
