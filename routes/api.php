<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SocialAccountController;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use App\Http\Controllers\AIChatController;

// routes/api.php
Route::post('/verify-firebase-token', [AuthController::class, 'verifyFirebaseToken']);

// Asegura que las solicitudes del frontend sean tratadas como con estado
Route::middleware(EnsureFrontendRequestsAreStateful::class)->group(function () {
    // Rutas para cuentas sociales que requieren autenticación
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/social-accounts', [SocialAccountController::class, 'index']);
        Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl']);
        Route::post('/social-accounts', [SocialAccountController::class, 'store']);
        Route::delete('/social-accounts/{id}', [SocialAccountController::class, 'destroy']);
        
        // Mover la ruta de AI chat dentro del middleware de autenticación
        Route::post('/ai-chat/message', [AIChatController::class, 'processMessage']);
    });
});

// // Rutas para cuentas sociales   
// Route::middleware(['auth:web', 'sanctum'])->group(function () {
//     Route::get('/social-accounts', [SocialAccountController::class, 'index']);
//     Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl']);
//     Route::post('/social-accounts', [SocialAccountController::class, 'store']);
//     Route::delete('/social-accounts/{id}', [SocialAccountController::class, 'destroy']);
// });
