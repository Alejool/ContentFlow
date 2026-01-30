<?php

use App\Http\Controllers\Api\V1\VideoProcessingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
  Route::post('/process', [VideoProcessingController::class, 'process']);
  Route::get('/process/{jobId}', [VideoProcessingController::class, 'status']);
  Route::delete('/process/{jobId}', [VideoProcessingController::class, 'cancel']);
  Route::get('/jobs', [VideoProcessingController::class, 'index']);
});
