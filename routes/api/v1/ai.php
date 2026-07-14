<?php

use App\Http\Controllers\Ai\AIChatController;
use App\Http\Controllers\Ai\ComposerAssistantController;
use Illuminate\Support\Facades\Route;


Route::middleware(['auth:sanctum', 'token.ability:ai:use'])->prefix('ai')->name('ai.')->group(function () {
  Route::post('/chat', [AIChatController::class, 'processMessage'])->name('chat')->middleware('rate.limit');
  Route::post('/suggest-fields', [AIChatController::class, 'suggestFields'])->name('suggest-fields')->middleware('rate.limit');
  Route::post('/composer-assistant', [ComposerAssistantController::class, 'suggest'])->name('composer-assistant')->middleware('rate.limit');
});
