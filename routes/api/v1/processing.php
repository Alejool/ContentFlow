<?php

use App\Http\Controllers\Api\ProgressController;
use Illuminate\Support\Facades\Route;

// Processing progress endpoints
Route::middleware('auth:sanctum')->group(function () {
  Route::get('/progress', [ProgressController::class, 'getProcessingProgress'])->name('progress.get');
  Route::post('/progress/update', [ProgressController::class, 'updateProcessingProgress'])->name('progress.update');
});
