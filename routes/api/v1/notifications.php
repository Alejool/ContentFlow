<?php

use App\Http\Controllers\Notifications\NotificationsController;

use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('notifications')->name('notifications.')->group(function () {
  Route::get('/', [NotificationsController::class, 'index'])->name('index');
  Route::post('/{id}/read', [NotificationsController::class, 'markAsRead'])->name('read');
  Route::post('/read-all', [NotificationsController::class, 'markAllAsRead'])->name('read-all');
  Route::delete('/{id}', [NotificationsController::class, 'destroy'])->name('destroy');
  Route::delete('/read', [NotificationsController::class, 'destroyRead'])->name('destroy-read');
  Route::get('/stats', [NotificationsController::class, 'stats'])->name('stats');
});
