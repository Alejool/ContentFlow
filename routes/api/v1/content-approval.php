<?php

use App\Http\Controllers\Content\ContentApprovalController;
use Illuminate\Support\Facades\Route;

/**
 * Content Approval Workflow Routes
 * 
 * These routes implement the simplified roles and approval workflow system.
 * Content refers to publications in this context.
 * 
 * Note: {content} parameter will be resolved to Publication model via implicit binding
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('content')->name('content.')->group(function () {
        // Submit content for approval
        Route::post('/{content}/submit-for-approval', [ContentApprovalController::class, 'submitForApproval'])
            ->name('submit-for-approval')
            ->whereNumber('content');

        // Approve content at current level
        Route::post('/{content}/approve', [ContentApprovalController::class, 'approve'])
            ->name('approve')
            ->whereNumber('content');

        // Reject content and return to creator
        Route::post('/{content}/reject', [ContentApprovalController::class, 'reject'])
            ->name('reject')
            ->whereNumber('content');

        // Get current approval status
        Route::get('/{content}/approval-status', [ContentApprovalController::class, 'approvalStatus'])
            ->name('approval-status')
            ->whereNumber('content');

        // Get approval history
        Route::get('/{content}/approval-history', [ContentApprovalController::class, 'approvalHistory'])
            ->name('approval-history')
            ->whereNumber('content');

        // Publish approved content
        Route::post('/{content}/publish', [ContentApprovalController::class, 'publish'])
            ->name('publish')
            ->whereNumber('content');

        // Manually resolve approval state (Admin only)
        Route::post('/{content}/manual-resolve', [ContentApprovalController::class, 'manualResolve'])
            ->name('manual-resolve')
            ->whereNumber('content');
    });
});
