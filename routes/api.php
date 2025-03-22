<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// routes/api.php
Route::post('/verify-firebase-token', [AuthController::class, 'verifyFirebaseToken']);
