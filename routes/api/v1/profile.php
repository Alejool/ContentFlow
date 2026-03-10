<?php

use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Locale\LocaleController;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Api\UserTimezoneController;
use App\Http\Controllers\Api\WorkspaceTimezoneController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::prefix('profile')->name('profile.')->group(function () {
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::post('/avatar', [ProfileController::class, 'uploadAvatar'])->name('avatar.upload');
    Route::delete('/avatar', [ProfileController::class, 'deleteAvatar'])->name('avatar.delete');
    Route::put('/password', [ProfileController::class, 'changePassword'])->name('change-password');
    Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    Route::patch('/social-settings', [ProfileController::class, 'updateSocialSettings'])->name('social-settings.update');
    Route::get('/theme', [ThemeController::class, 'fetch'])->name('theme.fetch');
    Route::patch('/theme', [ThemeController::class, 'update'])->name('theme.update');
  });

  Route::patch('/locale', [LocaleController::class, 'update'])->name('locale.update');
  
  // User timezone routes
  Route::get('/timezone', [UserTimezoneController::class, 'show'])->name('timezone.show');
  Route::patch('/timezone', [UserTimezoneController::class, 'update'])->name('timezone.update');
  
  // Workspace timezone routes
  Route::get('/workspace/timezone', [WorkspaceTimezoneController::class, 'show'])->name('workspace.timezone.show');
  Route::patch('/workspace/timezone', [WorkspaceTimezoneController::class, 'update'])->name('workspace.timezone.update');
});
