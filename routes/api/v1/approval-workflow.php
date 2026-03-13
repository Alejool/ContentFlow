<?php

use App\Http\Controllers\Approval\ApprovalWorkflowController;
use Illuminate\Support\Facades\Route;

/**
 * Professional Approval Workflow Routes
 * 
 * These routes implement the professional approval workflow system
 * based on architectures used by Hootsuite, ContentStudio, and Buffer.
 * 
 * Features:
 * - Multi-level approval workflows
 * - Multiple approvers per level
 * - Individual approval tracking
 * - Complete audit trail
 */
Route::middleware('auth:sanctum')->prefix('approvals')->name('approvals.')->group(function () {
    // Submit publication for approval
    Route::post('/submit', [ApprovalWorkflowController::class, 'submit'])
        ->name('submit');

    // Get pending approvals for current user
    Route::get('/pending', [ApprovalWorkflowController::class, 'pending'])
        ->name('pending');

    // Approval request actions
    Route::prefix('{request}')->group(function () {
        // Approve at current step
        Route::post('/approve', [ApprovalWorkflowController::class, 'approve'])
            ->name('approve');

        // Reject at current step
        Route::post('/reject', [ApprovalWorkflowController::class, 'reject'])
            ->name('reject');

        // Get detailed approval status
        Route::get('/status', [ApprovalWorkflowController::class, 'status'])
            ->name('status');

        // Check if current user can approve
        Route::get('/can-approve', [ApprovalWorkflowController::class, 'canApprove'])
            ->name('can-approve');
    });

    // Get approval history for publication
    Route::get('/publication/{publication}/history', [ApprovalWorkflowController::class, 'history'])
        ->name('publication.history');
});
