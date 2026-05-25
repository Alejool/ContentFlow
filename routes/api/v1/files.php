<?php

use App\Http\Controllers\Api\FilesController;
use Illuminate\Support\Facades\Route;

/**
 * File Management Routes
 * Signed URL generation para uploads y acceso a archivos privados
 * 
 * Autenticación: Requiere auth:sanctum
 */

Route::prefix('files')->name('files.')->group(function () {
    // Generar signed PUT URL para upload directo a S3
    Route::post('/upload-url', [FilesController::class, 'generateUploadUrl'])
        ->name('generate-upload-url');

    // Confirmar que archivo fue subido a S3 (crear registro en DB)
    Route::post('/confirm-upload', [FilesController::class, 'confirmUpload'])
        ->name('confirm-upload');

    // Generar signed GET URL para acceso a archivo privado
    Route::get('/{id}/access', [FilesController::class, 'getAccessUrl'])
        ->name('access');

    // Eliminar archivo (de S3 y DB)
    Route::delete('/{id}', [FilesController::class, 'delete'])
        ->name('delete');
});
