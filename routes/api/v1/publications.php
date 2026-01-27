<?php

use App\Http\Controllers\Publications\PublicationController;
use App\Http\Controllers\Publications\PublicationLockController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
  Route::get('/publication-locks', [PublicationLockController::class, 'index'])->name('publication-locks.index');

  Route::prefix('publications')->name('publications.')->group(function () {
    Route::get('/', [PublicationController::class, 'index'])->name('index');
    Route::get('/stats', [PublicationController::class, 'stats'])->name('stats');
    Route::post('/', [PublicationController::class, 'store'])->name('store');
    Route::get('/{publication}', [PublicationController::class, 'show'])->name('show')->whereNumber('publication');
    Route::put('/{publication}', [PublicationController::class, 'update'])->name('update')->whereNumber('publication');
    Route::delete('/{publication}', [PublicationController::class, 'destroy'])->name('destroy')->whereNumber('publication');
    Route::post('/{publication}/duplicate', [PublicationController::class, 'duplicate'])->name('duplicate')->whereNumber('publication');
    Route::post('/{publication}/request-review', [PublicationController::class, 'requestReview'])->name('request-review')->whereNumber('publication');
    Route::post('/{publication}/approve', [PublicationController::class, 'approve'])->name('approve')->whereNumber('publication');
    Route::get('/{publication}/published-platforms', [PublicationController::class, 'getPublishedPlatforms'])->name('published-platforms')->whereNumber('publication');
    Route::post('/{publication}/publish', [PublicationController::class, 'publish'])->name('publish');
    Route::post('/{publication}/unpublish', [PublicationController::class, 'unpublish'])->name('unpublish');
    Route::post('/{publication}/reject', [PublicationController::class, 'reject'])->name('reject');
    Route::post('/{publication}/cancel', [PublicationController::class, 'cancel'])->name('cancel')->whereNumber('publication');
    Route::post('/{publication}/attach-media', [PublicationController::class, 'attachMedia'])->name('attach-media');
    Route::post('/{publication}/lock-media', [PublicationController::class, 'lockMedia'])->name('lock-media');
    Route::get('/stats/all', [PublicationController::class, 'stats'])->name('stats_all');

    // Locking API
    Route::post('/{publication}/lock', [PublicationLockController::class, 'lock'])->name('lock')->whereNumber('publication');
    Route::post('/{publication}/unlock', [PublicationLockController::class, 'unlock'])->name('unlock')->whereNumber('publication');
    Route::get('/{publication}/lock', [PublicationLockController::class, 'status'])->name('status')->whereNumber('publication');
  });
});
