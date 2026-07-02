<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\JsonImportController;

// JSON Import Routes (bulk publications / campaigns)
Route::prefix('json')->name('json.')->group(function () {

    // Download example template
    Route::get('/template', [JsonImportController::class, 'downloadTemplate'])
        ->name('template');

    // Import data (file upload or raw payload)
    Route::post('/import', [JsonImportController::class, 'import'])
        ->name('import');

    // Get import instructions
    Route::get('/instructions', [JsonImportController::class, 'getInstructions'])
        ->name('instructions');
});
