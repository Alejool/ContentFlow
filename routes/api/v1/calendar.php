<?php

use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\UserCalendarEventController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('calendar')->name('calendar.')->group(function () {
  Route::get('user-events', [UserCalendarEventController::class, 'index'])->name('user-events.index');
  Route::post('user-events', [UserCalendarEventController::class, 'store'])->name('user-events.store');
  Route::put('user-events/{id}', [UserCalendarEventController::class, 'update'])->name('user-events.update');
  Route::delete('user-events/{id}', [UserCalendarEventController::class, 'destroy'])->name('user-events.destroy');

  Route::get('events', [CalendarController::class, 'index'])->name('events');
  Route::patch('events/{id}', [CalendarController::class, 'update'])->name('update');
});
