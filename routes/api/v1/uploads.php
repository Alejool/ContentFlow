<?php

use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\MultipartUploadController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::post('/sign', [UploadController::class, 'sign'])->name('sign');
  Route::post('/progress', [UploadController::class, 'updateProgress'])->name('progress');
  Route::delete('/{uploadId}', [UploadController::class, 'cancelUpload'])->name('cancel');
  Route::post('/{uploadId}/pause', [UploadController::class, 'pauseUpload'])->name('pause');
  Route::get('/{uploadId}/resume', [UploadController::class, 'resumeUpload'])->name('resume');

  Route::prefix('multipart')->name('multipart.')->group(function () {
    Route::post('/init', [MultipartUploadController::class, 'initiate'])->name('init');
    Route::post('/sign-part', [MultipartUploadController::class, 'signPart'])->name('sign-part');
    Route::post('/complete', [MultipartUploadController::class, 'complete'])->name('complete');
  });
});
