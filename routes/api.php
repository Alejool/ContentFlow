<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Webhooks\YouTubeWebhookController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\Api\ApiAuthController;

Route::get('/health', [HealthController::class, 'check']);

Route::post('/auth/google', [AuthController::class, 'handleGoogleAuth']);

// ============================================================
// Enterprise API Authentication — Token Generation & Refresh
// These routes are public (no prior auth needed) so external
// systems can obtain their first access token via credentials.
// ============================================================
Route::prefix('auth/token')->name('api.auth.token.')->group(function () {
  // Generate access + refresh tokens (requires email, password, workspace slug/id)
  Route::post('/', [ApiAuthController::class, 'generateToken'])->name('generate');
  // Refresh access token using a valid refresh token (token rotation)
  Route::post('/refresh', [ApiAuthController::class, 'refreshToken'])->name('refresh');
});

Route::post('/webhooks/youtube', [YouTubeWebhookController::class, 'handle']);
Route::get('/webhooks/youtube', [YouTubeWebhookController::class, 'handle']);

// Stripe webhook for addon purchases
Route::post('/webhooks/stripe/addons', [\App\Http\Controllers\Webhooks\StripeAddonWebhookController::class, 'handle'])
    ->name('webhooks.stripe.addons');

// Simulador de webhook para addons (temporal)
Route::post('/webhooks/simulate-addon', [\App\Http\Controllers\Api\AddonWebhookSimulator::class, 'simulateWebhook'])
    ->middleware('auth:sanctum')
    ->name('webhooks.simulate.addon');

// ============================================================
// Multi-Gateway Payment System
// ============================================================
require __DIR__ . '/payment.php';


Route::prefix('v1')->name('api.v1.')->group(function () {
  require __DIR__ . '/api/v1/portal.php';

  // Ruta pública para obtener planes
  Route::get('/plans', [\App\Http\Controllers\Subscription\PricingController::class, 'getPlans'])->name('plans');
});

Route::middleware(['auth:sanctum'])->group(function () {

  // Enterprise API token management (protected — requires valid access token)
  Route::prefix('auth/token')->name('api.auth.token.')->middleware('api.plan:enterprise')->group(function () {
    // Validate current token and check plan status
    Route::get('/validate', [ApiAuthController::class, 'validateToken'])->name('validate');
    // Revoke all API tokens (logout). Optional ?workspace=slug to scope.
    Route::post('/revoke', [ApiAuthController::class, 'revokeToken'])->name('revoke');
  });

  Route::prefix('v1')->name('api.v1.')->middleware('api.plan:basic')->group(function () {
    require __DIR__ . '/api/v1/auth.php';
    require __DIR__ . '/api/v1/social.php';
    require __DIR__ . '/api/v1/ai.php';
    require __DIR__ . '/api/v1/workspaces.php';
    require __DIR__ . '/api/v1/approvals.php';
    require __DIR__ . '/api/v1/publications.php';
    require __DIR__ . '/api/v1/content-approval.php';
    require __DIR__ . '/api/v1/campaigns.php';
    require __DIR__ . '/api/v1/analytics.php';
    require __DIR__ . '/api/v1/notifications.php';
    require __DIR__ . '/api/v1/profile.php';
    require __DIR__ . '/api/v1/calendar.php';
    require __DIR__ . '/api/v1/localization.php';
    require __DIR__ . '/api/v1/onboarding.php';
    require __DIR__ . '/api/v1/hashtags.php';
    require __DIR__ . '/api/v1/reports.php';
    Route::prefix('uploads')->name('uploads.')->group(function () {
      require __DIR__ . '/api/v1/uploads.php';
    });
    Route::prefix('progress')->name('progress.')->group(function () {
      require __DIR__ . '/api/v1/progress.php';
    });
    require __DIR__ . '/api/v1/reels.php';
    require __DIR__ . '/api/v1/excel-import.php';
  });

  // Rutas que NO requieren un plan específico para ser accedidas (Upgrade/Check active)
  Route::prefix('v1')->name('api.v1.')->group(function () {
    require __DIR__ . '/api/v1/subscription.php';
    require __DIR__ . '/api/v1/addons.php';
  });
});
