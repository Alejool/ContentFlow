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
    // Verificación de permisos
    Route::get('/can-approve', [ApprovalController::class, 'canApprove'])->name('can-approve');
    
    // Estadísticas
    Route::get('/stats', [ApprovalController::class, 'stats'])->name('stats');
    
    // Historial de aprobaciones
    Route::get('/history', [ApprovalController::class, 'history'])->name('history');
    
    // Lista de solicitudes pendientes para el usuario actual
    Route::get('/', [ApprovalController::class, 'index'])->name('index');
    
    // Enviar publicación a aprobación
    Route::post('/submit', [ApprovalWorkflowController::class, 'submit'])->name('submit');
    
    // Obtener solicitudes pendientes para el usuario actual
    Route::get('/pending', [ApprovalWorkflowController::class, 'pending'])->name('pending');
    
    // Acciones sobre una solicitud específica
    Route::prefix('{request}')->group(function () {
      // Aprobar en el nivel actual
      Route::post('/approve', [ApprovalWorkflowController::class, 'approve'])->name('approve');
      
      // Rechazar en el nivel actual
      Route::post('/reject', [ApprovalWorkflowController::class, 'reject'])->name('reject');
      
      // Obtener estado detallado de la solicitud
      Route::get('/status', [ApprovalWorkflowController::class, 'status'])->name('status');
      
      // Verificar si el usuario actual puede aprobar
      Route::get('/can-approve', [ApprovalWorkflowController::class, 'canApprove'])->name('request.can-approve');
    });
    
    // Historial de aprobaciones de una publicación específica
    Route::get('/publication/{publication}/history', [ApprovalWorkflowController::class, 'history'])->name('publication.history');
  });
});
