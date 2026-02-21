<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;         
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\Auth\VerifyEmailController;     
use Illuminate\Support\Facades\Route;  
                    
Route::middleware('guest')->group(function () {  
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register'); 
                                     
    Route::post('register', [RegisteredUserController::class, 'store']);           
    Route::get('login', [AuthenticatedSessionController::class, 'create'])  
        ->name('login');          
                   
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::post('check-user', [AuthenticatedSessionController::class, 'checkUser']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');  

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');
     
    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);
  
    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    // Two-Factor Authentication Routes
    Route::get('2fa/setup', [TwoFactorController::class, 'setupForm'])
        ->name('2fa.setup');
    
    Route::post('2fa/setup', [TwoFactorController::class, 'setupStore'])
        ->name('2fa.setup.store');
    
    Route::get('2fa/verify', [TwoFactorController::class, 'verifyForm'])
        ->name('2fa.verify');
    
    Route::post('2fa/verify', [TwoFactorController::class, 'verifyStore'])
        ->name('2fa.verify.store');
    
    Route::post('2fa/disable', [TwoFactorController::class, 'disable'])
        ->name('2fa.disable');
    
    Route::post('2fa/regenerate-backup-codes', [TwoFactorController::class, 'regenerateBackupCodes'])
        ->name('2fa.regenerate-backup-codes');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
