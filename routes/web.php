<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
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
    DB::statement("ALTER TABLE publications DROP CONSTRAINT IF EXISTS publications_status_check");

    Schema::table('publications', function ($table) {
      $table->string('status', 50)->change();
    });

    Artisan::call('db:seed', [
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
  $user = Auth::user()?->fresh();

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
Route::middleware('auth')->group(function () {

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
  });

  Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/social', [ProfileController::class, 'socialSettings'])->name('social');
    Route::patch('/locale', [LocaleController::class, 'update'])->name('locale');
  });

  /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

  /*
    |--------------------------------------------------------------------------
    | Workspaces
    |--------------------------------------------------------------------------
    |*/
  Route::prefix('workspaces')->name('workspaces.')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index'])->name('index');
    Route::post('/', [WorkspaceController::class, 'store'])->name('store');
    Route::get('{workspace}/settings', [WorkspaceController::class, 'settings'])->name('settings');
    Route::get('{workspace}', [WorkspaceController::class, 'show'])->name('show');
    Route::post('{workspace}/switch', [WorkspaceController::class, 'switch'])->name('switch');
    Route::put('{workspace}', [WorkspaceController::class, 'update'])->name('update');
    Route::delete('{workspace}', [WorkspaceController::class, 'destroy'])->name('destroy');
  });

  /*
    |--------------------------------------------------------------------------
    | Content Management
    |--------------------------------------------------------------------------
    */
  Route::prefix('ManageContent')->name('manage-content.')->group(function () {
    Route::get('/', [ManageContentController::class, 'index'])->name('index');
  });

  /*
    |--------------------------------------------------------------------------
    | Calendar
    |--------------------------------------------------------------------------
    */
  Route::get('/calendar', [CalendarViewController::class, 'index'])->name('calendar.index');

  /*
    |--------------------------------------------------------------------------
    | Approvals & Campaigns
    |--------------------------------------------------------------------------
    */

  /*
    |--------------------------------------------------------------------------
    | Social Accounts & Logs
    |--------------------------------------------------------------------------
    */
  Route::prefix('social-accounts')->name('social-accounts.')->group(function () {
    Route::get('/', [SocialAccountController::class, 'index'])->name('index');
    Route::get('auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl'])->name('auth-url');
  });
});

require __DIR__ . '/auth.php';
