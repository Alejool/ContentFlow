<?php

use App\Http\Controllers\Api\TranslationController;
use App\Http\Controllers\Api\UserLocaleController;
use Illuminate\Support\Facades\Route;

// Preferencias de idioma del usuario
Route::get('/user/locale', [UserLocaleController::class, 'show']);
Route::patch('/user/locale', [UserLocaleController::class, 'update']);

// Traducciones con IA
Route::post('/ai/translate', [TranslationController::class, 'translate']);
Route::post('/ai/translate-batch', [TranslationController::class, 'translateBatch']);
Route::post('/ai/detect-language', [TranslationController::class, 'detectLanguage']);
