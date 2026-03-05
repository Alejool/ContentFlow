<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Subscription\SubscriptionController;
use App\Http\Controllers\Subscription\PricingController;
use App\Http\Controllers\Subscription\UsageMetricsController;
use App\Http\Controllers\Subscription\SubscriptionLimitController;
use App\Http\Controllers\Api\SubscriptionHistoryController;

// Rutas de suscripción
Route::prefix('subscription')->name('subscription.')->group(function () {
    Route::get('/usage', [SubscriptionController::class, 'getUsage'])->name('usage');
    Route::get('/check-active', [SubscriptionController::class, 'checkActiveSubscription'])->name('check-active');
    Route::post('/checkout', [SubscriptionController::class, 'createCheckoutSession'])->name('checkout');
    Route::post('/cancel', [SubscriptionController::class, 'cancelSubscription'])->name('cancel');
    Route::post('/resume', [SubscriptionController::class, 'resumeSubscription'])->name('resume');
    Route::post('/change-plan', [SubscriptionController::class, 'changePlan'])->name('change-plan');
    Route::post('/activate-free-plan', [SubscriptionController::class, 'activateFreePlan'])->name('activate-free-plan');
    
    // Subscription history and tracking routes
    Route::get('/history', [SubscriptionHistoryController::class, 'index'])->name('history');
    Route::get('/current-usage', [SubscriptionHistoryController::class, 'currentUsage'])->name('current-usage');
    Route::get('/usage-summary', [SubscriptionHistoryController::class, 'usageSummary'])->name('usage-summary');
    Route::get('/total-stats', [SubscriptionHistoryController::class, 'totalStats'])->name('total-stats');
    
    // Subscription limits routes
    Route::get('/limits/usage', [SubscriptionLimitController::class, 'getUsage'])->name('limits.usage');
    Route::get('/limits/check/{limitType}', [SubscriptionLimitController::class, 'checkLimit'])->name('limits.check');
    Route::post('/limits/check-downgrade', [SubscriptionLimitController::class, 'checkDowngrade'])->name('limits.check-downgrade');
    Route::get('/limits/features', [SubscriptionLimitController::class, 'getFeatures'])->name('limits.features');
});
