<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\VideoController;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;

use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

});
    Route::get('/videos', [VideoController::class, 'edit'])->name('video.edit');
    Route::resource('posts', PostController::class)->only('index', 'store');
    Route::resource('posts', PostController::class)->only('index', 'store');


require __DIR__.'/auth.php';


