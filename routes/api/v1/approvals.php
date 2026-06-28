<?php

use App\Http\Controllers\Content\ApprovalController;
use App\Http\Controllers\Approval\ApprovalWorkflowController;
use Illuminate\Support\Facades\Route;

/**
 * Rutas de Aprobaciones - Sistema Simplificado
 * 
 * Endpoints principales:
 * - Gestión de solicitudes de aprobación (submit, approve, reject)
 * - Consulta de pendientes y historial
 * - Estadísticas de aprobaciones
 */
Route::middleware('auth:sanctum')->group(function () {
  Route::prefix('approvals')->name('approvals.')->group(function () {

    // ── Read ─────────────────────────────────────────────────────────────────
    Route::middleware('token.ability:approvals:read')->group(function () {
      Route::get('/can-approve', [ApprovalController::class, 'canApprove'])->name('can-approve');
      Route::get('/stats', [ApprovalController::class, 'stats'])->name('stats');
      Route::get('/history', [ApprovalController::class, 'history'])->name('history');
      Route::get('/', [ApprovalController::class, 'index'])->name('index');
      Route::get('/pending', [ApprovalWorkflowController::class, 'pending'])->name('pending');
      Route::get('/publication/{publication}/history', [ApprovalWorkflowController::class, 'history'])->name('publication.history');
      Route::prefix('{request}')->group(function () {
        Route::get('/status', [ApprovalWorkflowController::class, 'status'])->name('status');
        Route::get('/can-approve', [ApprovalWorkflowController::class, 'canApprove'])->name('request.can-approve');
      });
    });

    // ── Manage ────────────────────────────────────────────────────────────────
    Route::middleware('token.ability:approvals:manage')->group(function () {
      Route::post('/submit', [ApprovalWorkflowController::class, 'submit'])->name('submit');
      Route::prefix('{request}')->group(function () {
        Route::post('/approve', [ApprovalWorkflowController::class, 'approve'])->name('approve');
        Route::post('/reject', [ApprovalWorkflowController::class, 'reject'])->name('reject');
      });
    });

  });
});
