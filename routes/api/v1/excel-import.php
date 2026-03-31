<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ExcelImportController;

// Excel Import/Export Routes
Route::prefix('excel')->name('excel.')->group(function () {
    
    // Download templates
    Route::get('/templates/publications', [ExcelImportController::class, 'downloadPublicationsTemplate'])
        ->name('templates.publications');
    
    Route::get('/templates/campaigns', [ExcelImportController::class, 'downloadCampaignsTemplate'])
        ->name('templates.campaigns');
    
    // Import data
    Route::post('/import/publications', [ExcelImportController::class, 'importPublications'])
        ->name('import.publications');
    
    Route::post('/import/campaigns', [ExcelImportController::class, 'importCampaigns'])
        ->name('import.campaigns');
    
    // Get instructions
    Route::get('/instructions', [ExcelImportController::class, 'getInstructions'])
        ->name('instructions');
});
