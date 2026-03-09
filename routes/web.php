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
use App\Http\Controllers\Workspace\ApiTokenController;
use App\Http\Controllers\Workspace\InvitationController;
use App\Http\Controllers\Calendar\CalendarViewController;
use App\Http\Controllers\Api\ExternalCalendarController;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use App\Models\Role\Role;
use App\Models\Workspace\Workspace;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Admin\SystemNotificationController;
use App\Http\Controllers\Publications\ClientPortalController;
use App\Http\Controllers\StripeCheckoutController;
use App\Http\Controllers\Subscription\PricingController;
use App\Http\Controllers\Subscription\UsageMetricsController;
use App\Http\Controllers\Subscription\AddonsController;

Broadcast::routes();

Route::get('/portal/{token}', [ClientPortalController::class, 'renderPortal'])->name('portal.view');

// Stripe Checkout Routes
Route::prefix('checkout')->name('checkout.')->group(function () {
  Route::post('/create-session', [StripeCheckoutController::class, 'createCheckoutSession'])->name('create-session');
  Route::get('/success', [StripeCheckoutController::class, 'success'])->name('success');
  Route::get('/cancel', [StripeCheckoutController::class, 'cancel'])->name('cancel');
});

Route::middleware('guest')->group(function () {
  Route::get('/up', fn() => response('OK'));

  Route::get(
    '/',
    function () {
      $systemConfig = app(\App\Services\SystemConfigService::class);
      $availablePlans = $systemConfig->getAvailablePlans();
      
      // Formatear planes para el frontend
      $plans = collect($availablePlans)
        ->map(function ($plan, $key) {
          return [
            'id' => $key,
            'name' => $plan['name'],
            'price' => $plan['price'],
            'description' => $plan['description'] ?? '',
            'limits' => $plan['limits'],
            'features' => $plan['features'] ?? [],
            'popular' => $plan['popular'] ?? ($key === 'professional'),
          ];
        })
        ->values()
        ->toArray();
      
      return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'plans' => $plans,
      ]);
    }
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
  Route::get('/x/callback', [SocialAccountController::class, 'handleTwitterCallback'])->name('x.callback');
  Route::get('/x/callback-v1', [SocialAccountController::class, 'handleTwitterV1Callback'])->name('x.callback.v1');
  Route::get('/youtube/callback', [SocialAccountController::class, 'handleYoutubeCallback'])->name('youtube.callback');
  Route::get('/tiktok/callback', [SocialAccountController::class, 'handleTiktokCallback'])->name('tiktok.callback');

  // External calendar callbacks
  Route::get('/google-calendar/callback', [ExternalCalendarController::class, 'handleGoogleCalendarCallback'])->name('google-calendar.callback');
  Route::get('/outlook-calendar/callback', [ExternalCalendarController::class, 'handleOutlookCalendarCallback'])->name('outlook-calendar.callback');

  Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('google.redirect');
  Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('google.callback');
});

// Ruta de pricing (pública, accesible sin autenticación)
Route::get('/pricing', [PricingController::class, 'index'])->name('pricing');

Route::middleware('auth')->group(function () {

  Route::get('/dashboard', [AnalyticsController::class, 'dashboard'])->name('dashboard');
  Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

  Route::prefix('profile')->name('profile.')->group(function () {
    Route::get('/', [ProfileController::class, 'edit'])->name('edit');
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
  });

  Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/social', [ProfileController::class, 'socialSettings'])->name('social');
    Route::patch('/social', [ProfileController::class, 'updateSocialSettings'])->name('social.update');
    Route::patch('/locale', [LocaleController::class, 'update'])->name('locale');
  });

  // Rutas de suscripción (autenticadas)
  Route::prefix('subscription')->name('subscription.')->group(function () {
    Route::get('/usage', fn() => redirect()->route('profile.edit'))->name('usage');
    Route::get('/billing', [UsageMetricsController::class, 'billing'])->name('billing');
    Route::post('/billing-portal', [UsageMetricsController::class, 'billingPortal'])->name('billing-portal');
    Route::post('/cancel-subscription', [UsageMetricsController::class, 'cancelSubscription'])->name('cancel-subscription');
    Route::get('/billing/export', [UsageMetricsController::class, 'exportInvoices'])->name('billing.export');
    Route::get('/success', [PricingController::class, 'success'])->name('success');
    Route::get('/cancel', [PricingController::class, 'cancel'])->name('cancel');
    
    // Add-ons routes
    Route::get('/addons', [AddonsController::class, 'index'])->name('addons');
    Route::post('/addons/purchase', [AddonsController::class, 'purchase'])->name('addons.purchase');
    Route::get('/addons/success', fn() => Inertia::render('Subscription/AddonSuccess'))->name('addons.success');
  });


  Route::prefix('workspaces')->name('workspaces.')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index'])->name('index');
    Route::post('/', [WorkspaceController::class, 'store'])->name('store');
    Route::post('{workspace}/switch', [WorkspaceController::class, 'switch'])->name('switch');
    Route::get('{workspace}/settings', [WorkspaceController::class, 'settings'])->name('settings');
    Route::get('{workspace}', [WorkspaceController::class, 'show'])->name('show');
    Route::put('{workspace}', [WorkspaceController::class, 'update'])->name('update');
    Route::delete('{workspace}', [WorkspaceController::class, 'destroy'])->name('destroy');

    // Enterprise Only Routes
    Route::post('{workspace}/white-label', [WorkspaceController::class, 'updateWhiteLabel'])->name('white-label.update');
    Route::get('{workspace}/api-tokens', [ApiTokenController::class, 'index'])->name('api-tokens.index');
    Route::post('{workspace}/api-tokens', [ApiTokenController::class, 'store'])->name('api-tokens.store');
    Route::delete('{workspace}/api-tokens/{token}', [ApiTokenController::class, 'destroy'])->name('api-tokens.destroy');
    // Enterprise API Documentation Downloads
    Route::get('{workspace}/api-docs/download', [ApiTokenController::class, 'downloadDocs'])->name('api-docs.download');
  });

  Route::prefix('content')->name('content.')->group(function () {
    Route::get('/', [ContentController::class, 'index'])->name('index');
  });

  Route::get('/reels', function () {
    return inertia('Reels/AiReelsGallery');
  })->name('reels.gallery');

  Route::get('/calendar', [CalendarViewController::class, 'index'])->name('calendar.index');
  Route::get('/calendar/settings', [CalendarViewController::class, 'settings'])->name('calendar.settings');

  Route::prefix('social-accounts')->name('social-accounts.')->group(function () {
    Route::get('/', [SocialAccountController::class, 'index'])->name('index');
    Route::get('auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('auth-url');
  });

  // Admin Routes
  Route::prefix('admin')->name('admin.')->middleware(['super-admin'])->group(function () {
    Route::get('/notifications', [SystemNotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/send', [SystemNotificationController::class, 'send'])->name('notifications.send');
  });
});

require __DIR__ . '/auth.php';
require __DIR__ . '/admin.php';
