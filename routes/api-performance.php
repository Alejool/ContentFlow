<?php

use App\Http\Controllers\Api\MediaDerivativeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Performance Optimization API Routes
|--------------------------------------------------------------------------
|
| API endpoints for performance-optimized media delivery
| These routes should be added to routes/api.php
|
*/

Route::middleware('auth:sanctum')->group(function () {
    
    // Media derivatives endpoints
    Route::prefix('media/{id}')->group(function () {
        // Get all derivatives for a media file
        Route::get('/derivatives', [MediaDerivativeController::class, 'index'])
            ->name('api.media.derivatives');
        
        // Get best derivative for specific viewport
        Route::get('/best', [MediaDerivativeController::class, 'best'])
            ->name('api.media.best');
        
        // Get responsive srcset
        Route::get('/srcset', [MediaDerivativeController::class, 'srcset'])
            ->name('api.media.srcset');
    });
    
});

/*
|--------------------------------------------------------------------------
| Usage Instructions
|--------------------------------------------------------------------------
|
| Add these routes to your main routes/api.php file:
|
| require __DIR__.'/api-performance.php';
|
| Or copy the route definitions directly into routes/api.php
|
*/
