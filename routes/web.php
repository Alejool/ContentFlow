<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Analytics\AnalyticsController;
use App\Http\Controllers\ManageContent\ManageContentController;
use App\Http\Controllers\Posts\PostsController;
use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\Publications\PublicationController;
use App\Http\Controllers\SocialAccount\SocialAccountController;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Locale\LocaleController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\Calendar\CalendarViewController;
use App\Http\Controllers\SocialPostLogController;
use App\Http\Controllers\Api\UploadController;

/*
|--------------------------------------------------------------------------
| Models / Utils
|--------------------------------------------------------------------------
*/
use App\Models\Role;
use App\Models\Workspace;

/*
|--------------------------------------------------------------------------
| Broadcast
|--------------------------------------------------------------------------
*/

Broadcast::routes();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| OAuth Callbacks (Public)
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
| ⚠️ Debug / Maintenance Routes (RECOMENDADO SOLO LOCAL)
|--------------------------------------------------------------------------
*/
Route::get('/fix-db', function () {
  try {
    \DB::statement("ALTER TABLE publications DROP CONSTRAINT IF EXISTS publications_status_check");

    \Schema::table('publications', function ($table) {
      $table->string('status', 50)->change();
    });

    \Artisan::call('db:seed', [
      '--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder',
      '--force' => true
    ]);

    $roles = Role::with('permissions')->get();

    return response()->json([
      'success' => true,
      'roles' => $roles->map(fn($r) => [
        'slug' => $r->slug,
        'permissions' => $r->permissions->pluck('slug'),
      ]),
    ]);
  } catch (\Exception $e) {
    return response()->json(['error' => $e->getMessage()], 500);
  }
});

Route::get('/debug-auth', function () {
  $user = auth()->user()?->fresh();

  if (!$user) {
    return response()->json(['authenticated' => false]);
  }

  $workspaceId = $user->current_workspace_id;
  $workspace = $workspaceId ? Workspace::find($workspaceId) : null;

  return response()->json([
    'authenticated' => true,
    'workspace' => $workspace?->name,
    'can_manage_team' => $user->hasPermission('manage-team', $workspaceId),
    'can_publish' => $user->hasPermission('publish', $workspaceId),
  ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

  /*
    |--------------------------------------------------------------------------
    | Dashboard & Analytics
    |--------------------------------------------------------------------------
    */
  Route::get('/dashboard', [AnalyticsController::class, 'dashboard'])->name('dashboard');
  Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

  /*
    |--------------------------------------------------------------------------
    | Profile & Settings
    |--------------------------------------------------------------------------
    */
  Route::prefix('profile')->name('profile.')->group(function () {
    Route::get('/', [ProfileController::class, 'edit'])->name('edit');
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::put('/', [ProfileController::class, 'changePassword'])->name('password');
    Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
  });

  Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/social', [ProfileController::class, 'socialSettings'])->name('social');
    Route::patch('/social', [ProfileController::class, 'updateSocialSettings'])->name('social.update');
    Route::patch('/locale', [LocaleController::class, 'update'])->name('locale');
    Route::patch('/theme', [ThemeController::class, 'update'])->name('theme');
  });

  /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */
  Route::prefix('notifications')->name('notifications.')->group(function () {
    Route::get('/', [NotificationsController::class, 'index'])->name('index');
    Route::post('{id}/read', [NotificationsController::class, 'markAsRead'])->name('read');
    Route::post('read-all', [NotificationsController::class, 'markAllAsRead'])->name('read-all');
    Route::delete('{id}', [NotificationsController::class, 'destroy'])->name('destroy');
    Route::delete('read', [NotificationsController::class, 'destroyRead'])->name('destroy-read');
    Route::get('stats', [NotificationsController::class, 'stats'])->name('stats');
  });

  /*
    |--------------------------------------------------------------------------
    | Workspaces
    |--------------------------------------------------------------------------
    */
  Route::prefix('workspaces')->name('workspaces.')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index'])->name('index');
    Route::post('/', [WorkspaceController::class, 'store'])->name('store');
    Route::post('{workspace}/switch', [WorkspaceController::class, 'switch'])->name('switch');
    Route::get('{workspace}/settings', [WorkspaceController::class, 'settings'])->name('settings');
    Route::put('{workspace}', [WorkspaceController::class, 'update'])->name('update');
    Route::get('{workspace}/members', [WorkspaceController::class, 'members'])->name('members');
    Route::post('{workspace}/invite', [WorkspaceController::class, 'invite'])->name('invite');
    Route::put('{workspace}/members/{user}/role', [WorkspaceController::class, 'updateMemberRole'])->name('members.role');
    Route::delete('{workspace}/members/{user}', [WorkspaceController::class, 'removeMember'])->name('members.remove');
    Route::get('{workspace}', [WorkspaceController::class, 'show'])->name('show');
  });

  /*
    |--------------------------------------------------------------------------
    | Content
    |--------------------------------------------------------------------------
    */
  Route::prefix('ManageContent')->name('manage-content.')->group(function () {
    Route::get('/', [ManageContentController::class, 'index'])->name('index');
    Route::get('/posts', [PostsController::class, 'index'])->name('posts');
  });

  Route::post('/upload/sign', [UploadController::class, 'sign'])->name('upload.sign');

  Route::prefix('upload/multipart')->name('upload.multipart.')->group(function () {
    Route::post('/init', [\App\Http\Controllers\Api\MultipartUploadController::class, 'initiate'])->name('init');
    Route::post('/sign-part', [\App\Http\Controllers\Api\MultipartUploadController::class, 'signPart'])->name('sign-part');
    Route::post('/complete', [\App\Http\Controllers\Api\MultipartUploadController::class, 'complete'])->name('complete');
  });

  /*
    |--------------------------------------------------------------------------
    | Calendar
    |--------------------------------------------------------------------------
    */
  Route::get('/calendar', [CalendarViewController::class, 'index'])->name('calendar.index');

  /*
    |--------------------------------------------------------------------------
    | AI Assistant
    |--------------------------------------------------------------------------
    */
  Route::post('/ai-chat/process', [AIChatController::class, 'processMessage'])->name('ai.process');
  Route::post('/ai-chat/suggest-fields', [AIChatController::class, 'suggestFields'])->name('ai.suggest-fields');

  /*
    |--------------------------------------------------------------------------
    | Publications
    |--------------------------------------------------------------------------
    */
  Route::prefix('publications')->name('publications.')->group(function () {
    Route::get('/', [PublicationController::class, 'index'])->name('index');
    Route::post('/', [PublicationController::class, 'store'])->name('store');
    Route::get('{publication}', [PublicationController::class, 'show'])->name('show');
    Route::put('{publication}', [PublicationController::class, 'update'])->name('update');
    Route::delete('{publication}', [PublicationController::class, 'destroy'])->name('destroy');

    Route::post('{publication}/publish', [PublicationController::class, 'publish'])->name('publish');
    Route::post('{publication}/unpublish', [PublicationController::class, 'unpublish'])->name('unpublish');
    Route::post('{publication}/request-review', [PublicationController::class, 'requestReview'])->name('request-review');
    Route::post('{publication}/approve', [PublicationController::class, 'approve'])->name('approve');
    Route::post('{publication}/reject', [PublicationController::class, 'reject'])->name('reject');
    Route::post('{publication}/attach-media', [PublicationController::class, 'attachMedia'])->name('attach-media');
    Route::post('{publication}/lock-media', [PublicationController::class, 'lockMedia'])->name('lock-media');
    Route::get('{publication}/published-platforms', [PublicationController::class, 'getPublishedPlatforms'])->name('published-platforms');
    Route::get('stats/all', [PublicationController::class, 'stats'])->name('stats');
  });

  /*
    |--------------------------------------------------------------------------
    | Approvals & Campaigns
    |--------------------------------------------------------------------------
    */
  Route::prefix('approvals')->name('approvals.')->group(function () {
    Route::get('/history', [ApprovalController::class, 'history'])->name('history');
    Route::get('/', [ApprovalController::class, 'index'])->name('index');
    Route::get('/stats', [ApprovalController::class, 'stats'])->name('stats');
  });

  Route::prefix('campaigns')->name('campaigns.')->group(function () {
    Route::get('/', [CampaignController::class, 'index'])->name('index');
    Route::post('/', [CampaignController::class, 'store'])->name('store');
    Route::get('{campaign}', [CampaignController::class, 'show'])->name('show');
    Route::put('{campaign}', [CampaignController::class, 'update'])->name('update');
    Route::delete('{campaign}', [CampaignController::class, 'destroy'])->name('destroy');
  });

  /*
    |--------------------------------------------------------------------------
    | Social Accounts & Logs
    |--------------------------------------------------------------------------
    */
  Route::prefix('social-accounts')->name('social-accounts.')->group(function () {
    Route::get('/', [SocialAccountController::class, 'index'])->name('index');
    Route::post('/', [SocialAccountController::class, 'store'])->name('store');
    Route::get('auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('auth-url');
    Route::delete('{id}', [SocialAccountController::class, 'destroy'])->name('destroy');
  });

  Route::get('/logs', [SocialPostLogController::class, 'index'])->name('social-logs.index');
});

require __DIR__ . '/auth.php';
