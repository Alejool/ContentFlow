<?php

use App\Http\Controllers\Api\MediaDownloadController;
use Illuminate\Support\Facades\Route;

// Media download and preview endpoints
Route::middleware('auth:sanctum')->group(function () {
    // Preview a media file by S3 key (for files without MediaFile record)
    Route::get('/by-key/preview', [MediaDownloadController::class, 'previewByKey'])
        ->name('by-key.preview');

    // Download a media file by ID
    Route::get('/{mediaFileId}/download', [MediaDownloadController::class, 'download'])
        ->name('download');

    // Preview a media file by ID
    Route::get('/{mediaFileId}/preview', [MediaDownloadController::class, 'preview'])
        ->name('preview');
});
