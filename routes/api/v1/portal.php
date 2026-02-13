<?php

use App\Http\Controllers\Publications\ClientPortalController;
use Illuminate\Support\Facades\Route;

Route::prefix('portal')->name('portal.')->group(function () {
  Route::get('/{token}', [ClientPortalController::class, 'show'])->name('show');
  Route::post('/{token}/approve', [ClientPortalController::class, 'approve'])->name('approve');
  Route::post('/{token}/reject', [ClientPortalController::class, 'reject'])->name('reject');
});
