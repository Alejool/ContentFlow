<?php

use Illuminate\Support\Facades\Route;


use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\Analytics\AnalyticsController;
use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\Campaigns\ScheduledPostController;
use App\Http\Controllers\SocialAccount\SocialAccountController;
use App\Http\Controllers\SocialPostLogController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\Publications\PublicationController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\Locale\LocaleController;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Publications\PublicationLockController;
use App\Http\Controllers\Webhooks\YouTubeWebhookController;
use App\Http\Controllers\Api\UserCalendarEventController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// Google Authentication (receives user data from frontend)
Route::post('/auth/google', [AuthController::class, 'handleGoogleAuth']);

// Webhooks
Route::post('/webhooks/youtube', [YouTubeWebhookController::class, 'handle']);
Route::get('/webhooks/youtube', [YouTubeWebhookController::class, 'handle']);

// Frontend Error Logging
Route::post('/log-error', function (\Illuminate\Http\Request $request) {
  \Illuminate\Support\Facades\Log::error('Frontend Error:', $request->all());
  return response()->json(['status' => 'logged']);
});

/*
|--------------------------------------------------------------------------
| Protected API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

  /*
|----------------------------------------------------------------------
| Workspaces API
|----------------------------------------------------------------------
*/
  Route::prefix('workspaces')->name('api.workspaces.')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index'])->name('index');
    Route::post('/', [WorkspaceController::class, 'store'])->name('store');
    Route::post('/{workspace}/switch', [WorkspaceController::class, 'switch'])->name('switch');
    Route::get('/{workspace}/settings', [WorkspaceController::class, 'settings'])->name('settings');
    Route::put('/{workspace}', [WorkspaceController::class, 'update'])->name('update');

    // Member management
    Route::get('/{workspace}/members', [WorkspaceController::class, 'members'])->name('members');
    Route::post('/{workspace}/invite', [WorkspaceController::class, 'invite'])->name('invite');
    Route::put('/{workspace}/members/{user}/role', [WorkspaceController::class, 'updateMemberRole'])->name('members.update-role');
    Route::delete('/{workspace}/members/{user}', [WorkspaceController::class, 'removeMember'])->name('members.remove');

    // Enterprise: Webhook testing & Activity
    Route::post('/{workspace}/webhooks/test', [WorkspaceController::class, 'testWebhook'])->name('webhooks.test');
    Route::get('/{workspace}/activity', [WorkspaceController::class, 'activity'])->name('activity');
  });

  /*
|----------------------------------------------------------------------
| Publications API
|----------------------------------------------------------------------
*/
  Route::prefix('publications')->name('api.publications.')->group(function () {
    Route::get('/', [PublicationController::class, 'index'])->name('index');
    Route::get('/stats', [PublicationController::class, 'stats'])->name('stats');
    Route::post('/', [PublicationController::class, 'store'])->name('store');
    Route::get('/{publication}', [PublicationController::class, 'show'])->name('show');
    Route::put('/{publication}', [PublicationController::class, 'update'])->name('update');
    Route::delete('/{publication}', [PublicationController::class, 'destroy'])->name('destroy');
    Route::post('/{publication}/duplicate', [PublicationController::class, 'duplicate'])->name('duplicate');
    Route::post('/{publication}/request-review', [PublicationController::class, 'requestReview'])->name('request-review');
    Route::post('/{publication}/approve', [PublicationController::class, 'approve'])->name('approve');
    Route::get('/{publication}/published-platforms', [PublicationController::class, 'getPublishedPlatforms'])->name('published-platforms');
    Route::post('/{publication}/publish', [PublicationController::class, 'publish'])->name('publish');
    Route::post('/{publication}/unpublish', [PublicationController::class, 'unpublish'])->name('unpublish');

    // Locking API
    Route::post('/{publication}/lock', [PublicationLockController::class, 'lock'])->name('lock');
    Route::post('/{publication}/unlock', [PublicationLockController::class, 'unlock'])->name('unlock');
    Route::get('/{publication}/lock', [PublicationLockController::class, 'status'])->name('status');
  });

  /*
|----------------------------------------------------------------------
| Campaigns API
|----------------------------------------------------------------------
*/
  Route::prefix('campaigns')->name('api.campaigns.')->group(function () {
    Route::get('/', [CampaignController::class, 'index'])->name('index');
    Route::post('/', [CampaignController::class, 'store'])->name('store');
    Route::get('/{campaign}', [CampaignController::class, 'show'])->name('show');
    Route::put('/{campaign}', [CampaignController::class, 'update'])->name('update');
    Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->name('destroy');
  });

  /*
|----------------------------------------------------------------------
| Social Accounts API
|----------------------------------------------------------------------
|*/
  Route::prefix('social-accounts')->name('api.social-accounts.')->group(function () {
    Route::get('/', [SocialAccountController::class, 'index'])->name('index');
    Route::post('/', [SocialAccountController::class, 'store'])->name('store');
    Route::get('/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('auth-url');
    Route::delete('/{id}', [SocialAccountController::class, 'destroy'])->name('destroy');
  });

  /*
|----------------------------------------------------------------------
| Social Post Logs API
|----------------------------------------------------------------------
|*/
  Route::prefix('logs')->name('api.social-logs.')->group(function () {
    Route::get('/', [SocialPostLogController::class, 'index'])->name('index');
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
| Notifications API
|----------------------------------------------------------------------
*/
  Route::prefix('notifications')->name('api.notifications.')->group(function () {
    Route::get('/', [NotificationsController::class, 'index'])->name('index');
    Route::post('/{id}/read', [NotificationsController::class, 'markAsRead'])->name('read');
    Route::post('/read-all', [NotificationsController::class, 'markAllAsRead'])->name('read-all');
    Route::delete('/{id}', [NotificationsController::class, 'destroy'])->name('destroy');
    Route::delete('/read', [NotificationsController::class, 'destroyRead'])->name('destroy-read');
    Route::get('/stats', [NotificationsController::class, 'stats'])->name('stats');
  });

  /*
|----------------------------------------------------------------------
| Profile API
|----------------------------------------------------------------------
*/
  Route::prefix('profile')->name('api.profile.')->group(function () {
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::put('/password', [ProfileController::class, 'changePassword'])->name('change-password');
    Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    Route::patch('/social-settings', [ProfileController::class, 'updateSocialSettings'])->name('social-settings.update');
  });

  /*
|----------------------------------------------------------------------
| Preferences API
|----------------------------------------------------------------------
*/
  Route::patch('/locale', [LocaleController::class, 'update'])->name('api.locale.update');
  Route::patch('/theme', [ThemeController::class, 'update'])->name('api.theme.update');

  /*
|----------------------------------------------------------------------
| Calendar API
|----------------------------------------------------------------------
|*/
  Route::group(['prefix' => 'calendar', 'as' => 'api.calendar.'], function () {
    Route::get('user-events', [UserCalendarEventController::class, 'index'])->name('user-events.index');
    Route::post('user-events', [UserCalendarEventController::class, 'store'])->name('user-events.store');
    Route::put('user-events/{id}', [UserCalendarEventController::class, 'update'])->name('user-events.update');
    Route::delete('user-events/{id}', [UserCalendarEventController::class, 'destroy'])->name('user-events.destroy');

    Route::get('events', [CalendarController::class, 'index'])->name('events');
    Route::patch('events/{id}', [CalendarController::class, 'update'])->name('update');
  });

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
| Scheduled Posts API
|----------------------------------------------------------------------
*/
  Route::prefix('scheduled-posts')->name('api.scheduled-posts.')->group(function () {
    Route::delete('/{id}', [ScheduledPostController::class, 'destroy'])->name('destroy');
  });
});
