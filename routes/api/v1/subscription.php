<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Subscription\SubscriptionController;
use App\Http\Controllers\Subscription\PricingController;
use App\Http\Controllers\Subscription\UsageMetricsController;
use App\Http\Controllers\Subscription\SubscriptionLimitController;
use App\Http\Controllers\Subscription\GranularLimitsController;
use App\Http\Controllers\Api\SubscriptionHistoryController;

// Rutas de suscripción
Route::prefix('subscription')->name('subscription.')->group(function () {
    // Todos pueden ver uso, permisos y verificar suscripción activa
    Route::get('/usage', [SubscriptionController::class, 'getUsage'])->name('usage');
    Route::get('/permissions', [SubscriptionController::class, 'getPermissions'])->name('permissions');
    Route::get('/check-active', [SubscriptionController::class, 'checkActiveSubscription'])->name('check-active');
    
    // Solo owner puede gestionar suscripción
    Route::middleware('workspace.owner')->group(function () {
        Route::post('/checkout', [SubscriptionController::class, 'createCheckoutSession'])->name('checkout');
        Route::post('/cancel', [SubscriptionController::class, 'cancelSubscription'])->name('cancel');
        Route::post('/resume', [SubscriptionController::class, 'resumeSubscription'])->name('resume');
        Route::post('/change-plan', [SubscriptionController::class, 'changePlan'])->name('change-plan');
    });
    
    // Plan free puede ser activado por cualquiera
    Route::post('/activate-free-plan', [SubscriptionController::class, 'activateFreePlan'])->name('activate-free-plan');
    
    // Subscription history and tracking routes (todos pueden ver)
    Route::get('/history', [SubscriptionHistoryController::class, 'index'])->name('history');
    Route::get('/current-usage', [SubscriptionHistoryController::class, 'currentUsage'])->name('current-usage');
    Route::get('/usage-summary', [SubscriptionHistoryController::class, 'usageSummary'])->name('usage-summary');
    Route::get('/total-stats', [SubscriptionHistoryController::class, 'totalStats'])->name('total-stats');
    
    // Subscription limits routes (todos pueden ver)
    Route::get('/limits/usage', [SubscriptionLimitController::class, 'getUsage'])->name('limits.usage');
    Route::get('/limits/check/{limitType}', [SubscriptionLimitController::class, 'checkLimit'])->name('limits.check');
    Route::get('/limits/features', [SubscriptionLimitController::class, 'getFeatures'])->name('limits.features');
    
    // Granular limits routes (todos pueden ver)
    Route::prefix('limits/granular')->name('limits.granular.')->group(function () {
        Route::get('/', [GranularLimitsController::class, 'index'])->name('index');
        Route::get('/check/{limitType}', [GranularLimitsController::class, 'checkLimit'])->name('check');
        Route::get('/workspace-limit', [GranularLimitsController::class, 'checkWorkspaceLimit'])->name('workspace');
        Route::post('/check-file-upload', [GranularLimitsController::class, 'checkFileUpload'])->name('file-upload');
        Route::post('/clear-cache', [GranularLimitsController::class, 'clearCache'])->name('clear-cache');
    });
    
    // Solo owner puede verificar downgrade
    Route::middleware('workspace.owner')->group(function () {
        Route::post('/limits/check-downgrade', [SubscriptionLimitController::class, 'checkDowngrade'])->name('limits.check-downgrade');
    });
});
