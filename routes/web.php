<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Inertia;


use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Analytics\AnalyticsController;
use App\Http\Controllers\Content\ContentController;
use App\Http\Controllers\Social\SocialAccountController;
use App\Http\Controllers\Locale\LocaleController;
use App\Http\Controllers\Workspace\WorkspaceController;
use App\Http\Controllers\Calendar\CalendarViewController;

Broadcast::routes();

Route::middleware('guest')->group(function () {
  Route::get('/up', fn() => response('OK'));

  Route::get(
    '/',
    fn() =>
    Inertia::render('Welcome', [
      'canLogin' => Route::has('login'),
      'canRegister' => Route::has('register'),
    ])
  )->name('welcome');

  Route::get('/privacy', fn() => Inertia::render('PrivacyPolicy'))->name('privacy');
  Route::get('/terms', fn() => Inertia::render('TermsOfService'))->name('terms');
  Route::get('/contact', fn() => Inertia::render('Contact'))->name('contact');
  Route::get('/approvals/history-test', fn() => response()->json(['message' => 'History route is reachable outside middleware']));
});

Route::prefix('auth')->name('auth.')->group(function () {
  Route::get('/facebook/callback', [SocialAccountController::class, 'handleFacebookCallback'])->name('facebook.callback');
  Route::get('/instagram/callback', [SocialAccountController::class, 'handleInstagramCallback'])->name('instagram.callback');
  Route::get('/twitter/callback', [SocialAccountController::class, 'handleTwitterCallback'])->name('twitter.callback');
  Route::get('/twitter/callback-v1', [SocialAccountController::class, 'handleTwitterV1Callback'])->name('twitter.callback.v1');
  Route::get('/youtube/callback', [SocialAccountController::class, 'handleYoutubeCallback'])->name('youtube.callback');
  Route::get('/tiktok/callback', [SocialAccountController::class, 'handleTiktokCallback'])->name('tiktok.callback');

  Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('google.redirect');
  Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('google.callback');
});

Route::middleware('auth')->group(function () {

  Route::get('/dashboard', [AnalyticsController::class, 'dashboard'])->name('dashboard');
  Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

  Route::prefix('profile')->name('profile.')->group(function () {
    Route::get('/', [ProfileController::class, 'edit'])->name('edit');
  });

  Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/social', [ProfileController::class, 'socialSettings'])->name('social');
    Route::patch('/locale', [LocaleController::class, 'update'])->name('locale');
  });


  Route::prefix('workspaces')->name('workspaces.')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index'])->name('index');
    Route::post('/', [WorkspaceController::class, 'store'])->name('store');
    Route::post('/{workspace}/switch', [WorkspaceController::class, 'switch'])->name('switch');
    Route::get('{workspace}/settings', [WorkspaceController::class, 'settings'])->name('settings');
    Route::get('{workspace}', [WorkspaceController::class, 'show'])->name('show');
    Route::put('{workspace}', [WorkspaceController::class, 'update'])->name('update');
    Route::delete('{workspace}', [WorkspaceController::class, 'destroy'])->name('destroy');
  });

  Route::prefix('content')->name('content.')->group(function () {
    Route::get('/', [ContentController::class, 'index'])->name('index');
  });

  Route::get('/calendar', [CalendarViewController::class, 'index'])->name('calendar.index');

  Route::prefix('social-accounts')->name('social-accounts.')->group(function () {
    Route::get('/', [SocialAccountController::class, 'index'])->name('index');
    Route::get('auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('auth-url');
  });
});

require __DIR__ . '/auth.php';
