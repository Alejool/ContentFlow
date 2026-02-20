<?php

use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\CalendarExportController;
use App\Http\Controllers\Api\UserCalendarEventController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('calendar')->name('calendar.')->group(function () {
  Route::get('user-events', [UserCalendarEventController::class, 'index'])->name('user-events.index');
  Route::post('user-events', [UserCalendarEventController::class, 'store'])->name('user-events.store');
  Route::put('user-events/{id}', [UserCalendarEventController::class, 'update'])->name('user-events.update');
  Route::delete('user-events/{id}', [UserCalendarEventController::class, 'destroy'])->name('user-events.destroy');

  Route::get('events', [CalendarController::class, 'index'])->name('events');
  Route::patch('events/{id}', [CalendarController::class, 'update'])->name('update');
  
  // Bulk operations
  Route::post('bulk-update', [CalendarController::class, 'bulkUpdate'])->name('bulk-update');
  Route::post('bulk-undo', [CalendarController::class, 'undoBulkOperation'])->name('bulk-undo');
  
  // Export functionality
  Route::post('export/google', [CalendarExportController::class, 'exportToGoogle'])->name('export.google');
  Route::post('export/outlook', [CalendarExportController::class, 'exportToOutlook'])->name('export.outlook');
  Route::get('download/{filename}', [CalendarExportController::class, 'download'])->name('download');
});
