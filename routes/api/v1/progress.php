<?php

use App\Http\Controllers\Api\ProgressController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/', [ProgressController::class, 'index'])->name('index');
});
