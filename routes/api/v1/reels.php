<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReelGeneratorController;

Route::prefix('reels')->name('reels.')->group(function () {
  Route::get('/', [ReelGeneratorController::class, 'index'])->name('index');
  Route::post('/generate', [ReelGeneratorController::class, 'generate'])->name('generate');
});
