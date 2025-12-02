<?php
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\CollectionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalyticsController; 
use App\Http\Controllers\AIChatController;
use Inertia\Inertia;
use App\Http\Controllers\ManageContentController;
use App\Http\Controllers\PostsController;
use App\Http\Controllers\Campaigns\CampaignController;
use App\Http\Controllers\SocialAccountController;
 
  
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);     
})->middleware('guest')->name('welcome');
      
      
Route::get('/dashboard', [AnalyticsController::class, 'dashboard'])->middleware(['auth'])->name('dashboard');  
  
      
                   
// Protected routes     
Route::middleware(['auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::put('/profile', [ProfileController::class, 'changePassword'])->name('profile.changePassword');
    Route::patch('/locale', [App\Http\Controllers\LocaleController::class, 'update'])->name('locale.update');

                
    // ManageContent
    Route::get('/manage-content', [ManageContentController::class, 'index'])->name('manage-content.index');

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    Route::get('/api/statistics/dashboard', [AnalyticsController::class, 'getDashboardStats'])->name('statistics.dashboard');
    Route::get('/api/statistics/campaigns/{id}', [AnalyticsController::class, 'getCampaignAnalytics'])->name('statistics.campaign');
    Route::get('/api/statistics/social-media', [AnalyticsController::class, 'getSocialMediaMetrics'])->name('statistics.social');
    Route::get('/api/statistics/engagement', [AnalyticsController::class, 'getEngagementData'])->name('statistics.engagement');
    Route::get('/api/statistics/platform-comparison', [AnalyticsController::class, 'getPlatformComparison'])->name('statistics.platforms');
    Route::get('/api/statistics/export', [AnalyticsController::class, 'exportData'])->name('statistics.export');
    Route::post('/analytics', [AnalyticsController::class, 'store'])->name('analytics.store');

    // POST Controller
    Route::get('/posts', [PostsController::class, 'index'])->name('posts.index');

    // AI Chat
    Route::get('/ai-chat', [AIChatController::class, 'index'])->name('ai-chat.index');
    Route::post('/ai-chat/process', [AIChatController::class, 'processMessage'])->name('ai-chat.process');
   
});



// routes for campaigns      
Route::middleware(['auth'])->group(function () {
    Route::prefix('campaigns')->group(function () { 
        Route::get('/', [CampaignController::class, 'index'])->name('campaigns.index');
        Route::post('/', [CampaignController::class, 'store'])->name('campaigns.store');
        Route::put('/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
        Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->name('campaigns.destroy');
    });
});

// Routes for OAuth callbacks
Route::middleware(['web'])->group(function () {
    Route::get('/auth/facebook/callback', [SocialAccountController::class, 'handleFacebookCallback']);
    Route::get('/auth/instagram/callback', [SocialAccountController::class, 'handleInstagramCallback']);
    Route::get('/auth/twitter/callback', [SocialAccountController::class, 'handleTwitterCallback']);
    Route::get('/auth/youtube/callback', [SocialAccountController::class, 'handleYoutubeCallback']);
    Route::get('/auth/tiktok/callback', [SocialAccountController::class, 'handleTiktokCallback']);
});

// TEMPORARY: Test route to send verification email
Route::get('/test-verification-email', function () {
    $user = auth()->user();
    
    if (!$user) {
        return response()->json(['error' => 'Not authenticated'], 401);
    }
    
    // Send the verification email
    $user->sendEmailVerificationNotification();
    
    return response()->json([
        'success' => true,
        'message' => 'Verification email sent to: ' . $user->email,
        'user' => [
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
        ]
    ]);
})->middleware('auth');
   
require __DIR__ . '/auth.php';
