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
use App\Http\Controllers\NotificationsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Inertia;
use App\Http\Controllers\SocialPostLogController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Calendar\CalendarViewController;
use \Laravel\Sanctum\Sanctum;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Broadcast::routes();

Route::get('/', function () {
  return Inertia::render('Welcome', [
    'canLogin' => Route::has('login'),
    'canRegister' => Route::has('register'),
  ]);
})->middleware('guest')->name('welcome');


Route::get('/fix-db', function () {
  try {
    \Illuminate\Support\Facades\DB::statement("ALTER TABLE publications DROP CONSTRAINT IF EXISTS publications_status_check");
    \Illuminate\Support\Facades\Schema::table('publications', function (\Illuminate\Database\Schema\Blueprint $table) {
      $table->string('status', 50)->change();
    });

    // 1. Create Permissions
    $permissions = [
      ['name' => 'Publish', 'slug' => 'publish', 'description' => 'Allow publishing content to social media'],
      ['name' => 'Approve', 'slug' => 'approve', 'description' => 'Allow approving content for publication'],
      ['name' => 'View Analytics', 'slug' => 'view-analytics', 'description' => 'Allow viewing workspace analytics'],
      ['name' => 'Manage Accounts', 'slug' => 'manage-accounts', 'description' => 'Allow adding/removing social accounts'],
      ['name' => 'Manage Team', 'slug' => 'manage-team', 'description' => 'Allow inviting/removing members'],
      ['name' => 'Manage Content', 'slug' => 'manage-content', 'description' => 'Allow creating and editing publications'],
      ['name' => 'Manage Campaigns', 'slug' => 'manage-campaigns', 'description' => 'Allow creating and editing campaigns'],
    ];

    foreach ($permissions as $p) {
      \App\Models\Permission::firstOrCreate(['slug' => $p['slug']], $p);
    }

    // 2. Create Roles and Sync
    $roles = [
      'Owner' => ['publish', 'approve', 'view-analytics', 'manage-accounts', 'manage-team', 'manage-content', 'manage-campaigns'],
      'Admin' => ['publish', 'approve', 'view-analytics', 'manage-accounts', 'manage-content', 'manage-campaigns'],
      'Editor' => ['view-analytics', 'manage-content', 'manage-campaigns'],
      'Viewer' => ['view-analytics'],
    ];

    foreach ($roles as $name => $permSlugs) {
      $role = \App\Models\Role::firstOrCreate(
        ['slug' => \Illuminate\Support\Str::slug($name)],
        ['name' => $name, 'description' => "Default $name role"]
      );

      $ids = \App\Models\Permission::whereIn('slug', $permSlugs)->pluck('id');
      $role->permissions()->sync($ids);
    }

    $ownerRole = \App\Models\Role::where('slug', 'owner')->first();
    $ownerPerms = $ownerRole ? $ownerRole->permissions->pluck('slug')->toArray() : [];

    return "Database fixed! Owner Permissions: " . implode(', ', $ownerPerms);
  } catch (\Exception $e) {
    return "Error: " . $e->getMessage();
  }
});

Route::get('/privacy', function () {
  return Inertia::render('PrivacyPolicy');
})->name('privacy');

Route::get('/terms', function () {
  return Inertia::render('TermsOfService');
})->name('terms');

Route::get('/contact', function () {
  return Inertia::render('Contact');
})->name('contact');



Route::get('/debug-auth', function () {
  return [
    'host' => request()->getHost(),
    'stateful_config' => config('sanctum.stateful'),
    'session_id' => session()->getId(),
    'cookies' => request()->cookies->all(),
    'user' => auth()->user(),
    'is_sanctum_stateful' => Sanctum::currentRequestHost(),
  ];
});

/*
|--------------------------------------------------------------------------
| OAuth Callback Routes (Public)
|--------------------------------------------------------------------------
*/

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

  Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/social', [ProfileController::class, 'socialSettings'])->name('social');
    Route::patch('/social', [ProfileController::class, 'updateSocialSettings'])->name('social.update');
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
    | Notifications
    |----------------------------------------------------------------------
    */
  Route::get('/notifications', [NotificationsController::class, 'index'])->name('notifications.index');
  Route::post('/notifications/{id}/read', [NotificationsController::class, 'markAsRead'])->name('notifications.read');
  Route::post('/notifications/read-all', [NotificationsController::class, 'markAllAsRead'])->name('notifications.read-all');
  Route::delete('/notifications/{id}', [NotificationsController::class, 'destroy'])->name('notifications.destroy');
  Route::delete('/notifications/read', [NotificationsController::class, 'destroyRead'])->name('notifications.destroy-read');
  Route::get('/notifications/stats', [NotificationsController::class, 'stats'])->name('notifications.stats');

  /*
    |----------------------------------------------------------------------
    | Workspaces
    |----------------------------------------------------------------------
    */
  Route::prefix('workspaces')->name('workspaces.')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index'])->name('index');
    Route::post('/', [WorkspaceController::class, 'store'])->name('store');
    Route::post('/{workspace}/switch', [WorkspaceController::class, 'switch'])->name('switch');
    Route::get('/{workspace}/settings', [WorkspaceController::class, 'settings'])->name('settings');
    Route::put('/{workspace}', [WorkspaceController::class, 'update'])->name('update');
    Route::get('/{workspace}/members', [WorkspaceController::class, 'members'])->name('members');
    Route::post('/{workspace}/invite', [WorkspaceController::class, 'invite'])->name('invite');
    Route::put('/{workspace}/members/{user}/role', [WorkspaceController::class, 'updateMemberRole'])->name('members.update-role');
    Route::delete('/{workspace}/members/{user}', [WorkspaceController::class, 'removeMember'])->name('members.remove');
    Route::get('/{workspace}', [WorkspaceController::class, 'show'])->name('show');
  });

  /*
    |----------------------------------------------------------------------
    | Content Management (Inertia Views)
    |----------------------------------------------------------------------
    */
  Route::get('/ManageContent', [ManageContentController::class, 'index'])->name('manage-content.index');
  Route::get('/posts', [PostsController::class, 'index'])->name('posts.index');

  /*
    |----------------------------------------------------------------------
    | Analytics (Inertia Views)
    |----------------------------------------------------------------------
    */
  Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

  /*
    |----------------------------------------------------------------------
    | AI Assistant API
    |----------------------------------------------------------------------
    */
  Route::post('/ai-chat/process', [AIChatController::class, 'processMessage'])->name('ai-chat.process');

  /*
    |----------------------------------------------------------------------
    | Calendar API
    |----------------------------------------------------------------------
    */
  /*
    |----------------------------------------------------------------------
    | Calendar
    |----------------------------------------------------------------------
    */
  Route::get('/calendar', [CalendarViewController::class, 'index'])->name('calendar.index');

  Route::prefix('api/calendar')->name('api.calendar.')->group(function () {
    Route::get('/events', [CalendarController::class, 'index'])->name('events');
    Route::patch('/events/{id}', [CalendarController::class, 'update'])->name('update');
  });

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
    Route::get('/{publication}/published-platforms', [PublicationController::class, 'getPublishedPlatforms'])->name('published-platforms');
    Route::post('/{publication}/publish', [PublicationController::class, 'publish'])->name('publish');
    Route::post('/{publication}/unpublish', [PublicationController::class, 'unpublish'])->name('unpublish');
    Route::post('/{publication}/request-review', [PublicationController::class, 'requestReview'])->name('request-review');
    Route::post('/{publication}/approve', [PublicationController::class, 'approve'])->name('approve');
    Route::post('/{publication}/reject', [PublicationController::class, 'reject'])->name('reject');
    Route::get('/stats/all', [PublicationController::class, 'stats'])->name('stats');
  });

  /*
    |----------------------------------------------------------------------
    | Approvals API
    |----------------------------------------------------------------------
    */
  Route::prefix('approvals')->name('approvals.')->group(function () {
    Route::get('/', [\App\Http\Controllers\ApprovalController::class, 'index'])->name('index');
    Route::get('/history', [\App\Http\Controllers\ApprovalController::class, 'history'])->name('history');
    Route::get('/stats', [\App\Http\Controllers\ApprovalController::class, 'stats'])->name('stats');
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
  Route::get('/social-logs', [SocialPostLogController::class, 'index'])->name('social-logs.index');
  Route::get('/logs', [SocialPostLogController::class, 'index'])->name('logs');

  Route::get('/test-notification', function () {
    $user = auth()->user();
    if ($user) {
      $user->notifyNow(new \App\Notifications\TestNotification());
      return 'Notification sent immediately to user ' . $user->id;
    }
    return 'No user logged in';
  });
});

require __DIR__ . '/auth.php';
