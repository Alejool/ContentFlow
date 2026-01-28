<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/verify-firebase-token', [AuthController::class, 'verifyFirebaseToken']);
Route::post('/google', [AuthController::class, 'handleGoogleAuth']);
