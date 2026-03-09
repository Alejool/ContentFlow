<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\SystemSettingsController;
use App\Http\Controllers\Admin\SystemNotificationController;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Rutas exclusivas para super administradores
| Protegidas por middleware: auth, verified, super-admin
|
*/

Route::middleware(['auth', 'verified', 'super-admin'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [SystemSettingsController::class, 'dashboard'])->name('dashboard');
    
    // System Settings
    Route::get('/system-settings', [SystemSettingsController::class, 'index'])->name('system-settings');
    Route::post('/system-settings/bulk-update', [SystemSettingsController::class, 'bulkUpdate'])->name('system-settings.bulk-update');
    Route::patch('/system-settings/{setting}', [SystemSettingsController::class, 'update'])->name('system-settings.update');
    Route::get('/system-settings/status', [SystemSettingsController::class, 'status'])->name('system-settings.status');
    
    // System Notifications
    Route::get('/system-notifications', [SystemNotificationController::class, 'index'])->name('system-notifications');
    Route::post('/system-notifications/send', [SystemNotificationController::class, 'send'])->name('system-notifications.send');
});
