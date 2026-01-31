<?php

use App\Http\Controllers\Ai\AIChatController;
use Illuminate\Support\Facades\Route;


Route::middleware('auth:sanctum')->prefix('ai')->name('ai.')->group(function () {
  Route::post('/chat', [AIChatController::class, 'processMessage'])->name('chat');
  Route::post('/suggest-fields', [AIChatController::class, 'suggestFields'])->name('suggest-fields');
});
