<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SocialAccountController;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use App\Http\Controllers\AIChatController;

// routes/api.php
Route::post('/verify-firebase-token', [AuthController::class, 'verifyFirebaseToken']);

// Ensures frontend requests are treated as stateful
Route::middleware(EnsureFrontendRequestsAreStateful::class)->group(function () {
    // Routes for social accounts that require authentication
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/social-accounts', [SocialAccountController::class, 'index']);
        Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl']);
        Route::post('/social-accounts', [SocialAccountController::class, 'store']);
        Route::delete('/social-accounts/{id}', [SocialAccountController::class, 'destroy']);
        
        // Move AI chat route inside authentication middleware
        Route::post('/ai-chat/message', [AIChatController::class, 'processMessage']);
    });

    Route::get('/test-curl', function() {
    return [
        'curl.cainfo' => ini_get('curl.cainfo'),
        'openssl.cafile' => ini_get('openssl.cafile'),
    ];
});

});

// // Routes for social accounts
// Route::middleware(['auth:web', 'sanctum'])->group(function () {
//     Route::get('/social-accounts', [SocialAccountController::class, 'index']);
//     Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl']);
//     Route::post('/social-accounts', [SocialAccountController::class, 'store']);
//     Route::delete('/social-accounts/{id}', [SocialAccountController::class, 'destroy']);
// });
