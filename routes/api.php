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
| API v1 Routes
|----------------------------------------------------------------------
*/
  Route::prefix('v1')->name('api.v1.')->group(function () {
    require __DIR__ . '/api/v1/auth.php';
    require __DIR__ . '/api/v1/social.php';
    require __DIR__ . '/api/v1/ai.php';
    require __DIR__ . '/api/v1/workspaces.php';
    require __DIR__ . '/api/v1/approvals.php';
    require __DIR__ . '/api/v1/publications.php';
    require __DIR__ . '/api/v1/campaigns.php';
    require __DIR__ . '/api/v1/analytics.php';
    require __DIR__ . '/api/v1/notifications.php';
    require __DIR__ . '/api/v1/profile.php';
    require __DIR__ . '/api/v1/calendar.php';
    Route::prefix('uploads')->name('uploads.')->group(function () {
      require __DIR__ . '/api/v1/uploads.php';
    });
  });
});
