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
      
Route::get('/dashboard', function () {    
    return Inertia::render('Dashboard');   
})->middleware(['auth', 'verified'])->name('dashboard') ;  
      
                   
// Protected routes     
Route::middleware(['auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');


    // ManageContent
    Route::get('/manage-content', [ManageContentController::class, 'index'])->name('manage-content.index');

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    Route::resource('analytics', AnalyticsController::class)->only('index', 'store');

    // POST Controller
    Route::get('/posts', [PostsController::class, 'index'])->name('posts.index');

    // AI Chat
    Route::get('/ai-chat', [AIChatController::class, 'index'])->name('ai-chat.index');
   
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
});
   
require __DIR__ . '/auth.php';
