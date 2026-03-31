<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Publications\HashtagLibraryController;

Route::prefix('hashtags')->name('hashtags.')->group(function () {
    Route::get('/', [HashtagLibraryController::class, 'index'])->name('index');
    Route::post('/', [HashtagLibraryController::class, 'store'])->name('store');
    Route::put('/{hashtagLibrary}', [HashtagLibraryController::class, 'update'])->name('update');
    Route::delete('/{hashtagLibrary}', [HashtagLibraryController::class, 'destroy'])->name('destroy');
    Route::post('/{hashtagLibrary}/use', [HashtagLibraryController::class, 'use'])->name('use');
});
