<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Reports\ScheduledReportController;

Route::prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ScheduledReportController::class, 'index'])->name('index');
    Route::post('/', [ScheduledReportController::class, 'store'])->name('store');
    Route::put('/{report}', [ScheduledReportController::class, 'update'])->name('update');
    Route::delete('/{report}', [ScheduledReportController::class, 'destroy'])->name('destroy');
    Route::get('/{report}/preview', [ScheduledReportController::class, 'preview'])->name('preview');
});
