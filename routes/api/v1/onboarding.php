<?php

use App\Http\Controllers\Api\OnboardingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('onboarding')->name('onboarding.')->group(function () {
    Route::post('/start', [OnboardingController::class, 'start'])->name('start');
    Route::post('/tour/step', [OnboardingController::class, 'updateTourStep'])->name('tour.step');
    Route::post('/tour/complete', [OnboardingController::class, 'completeTourStep'])->name('tour.complete');
    Route::post('/tour/skip', [OnboardingController::class, 'skipTour'])->name('tour.skip');
    Route::post('/tooltip/dismiss', [OnboardingController::class, 'dismissTooltip'])->name('tooltip.dismiss');
    Route::post('/wizard/complete', [OnboardingController::class, 'completeWizardStep'])->name('wizard.complete');
    Route::post('/wizard/skip', [OnboardingController::class, 'skipWizard'])->name('wizard.skip');
    Route::post('/template/select', [OnboardingController::class, 'selectTemplate'])->name('template.select');
    Route::post('/restart', [OnboardingController::class, 'restart'])->name('restart');
    Route::get('/state', [OnboardingController::class, 'getState'])->name('state');
    Route::get('/analytics', [OnboardingController::class, 'getAnalytics'])->name('analytics');
});
