<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Webhooks\YouTubeWebhookController;
use App\Http\Controllers\HealthController;

Route::get('/health', [HealthController::class, 'check']);

Route::post('/auth/google', [AuthController::class, 'handleGoogleAuth']);

Route::post('/webhooks/youtube', [YouTubeWebhookController::class, 'handle']);
Route::get('/webhooks/youtube', [YouTubeWebhookController::class, 'handle']);


Route::prefix('v1')->name('api.v1.')->group(function () {
  require __DIR__ . '/api/v1/portal.php';
});

Route::middleware(['auth:sanctum'])->group(function () {

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
    require __DIR__ . '/api/v1/reels.php';
  });
});
