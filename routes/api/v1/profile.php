<?php

use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Locale\LocaleController;
use App\Http\Controllers\Theme\ThemeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::prefix('profile')->name('profile.')->group(function () {
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::put('/password', [ProfileController::class, 'changePassword'])->name('change-password');
    Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    Route::patch('/social-settings', [ProfileController::class, 'updateSocialSettings'])->name('social-settings.update');
    Route::get('/theme', [ThemeController::class, 'fetch'])->name('theme.fetch');
    Route::patch('/theme', [ThemeController::class, 'update'])->name('theme.update');
  });

  Route::patch('/locale', [LocaleController::class, 'update'])->name('locale.update');
});
