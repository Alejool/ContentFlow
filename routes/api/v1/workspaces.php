<?php

use App\Http\Controllers\Workspace\WorkspaceController;
use App\Http\Controllers\Workspace\WorkspaceApprovalWorkflowController;
use App\Http\Controllers\Workspace\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('workspaces')->name('workspaces.')->group(function () {
  Route::get('/', [WorkspaceController::class, 'index'])->name('index');
  Route::post('/', [WorkspaceController::class, 'store'])->name('store');
  Route::post('/{idOrSlug}/switch', [WorkspaceController::class, 'switch'])->name('switch');
  Route::get('/{idOrSlug}/settings', [WorkspaceController::class, 'settings'])->name('settings');
  Route::put('/{idOrSlug}', [WorkspaceController::class, 'update'])->name('update');

  // Member management
  Route::get('/{idOrSlug}/members', [WorkspaceController::class, 'members'])->name('members');
  Route::post('/{idOrSlug}/invite', [WorkspaceController::class, 'invite'])->name('invite');
  Route::put('/{idOrSlug}/members/{user}/role', [WorkspaceController::class, 'updateMemberRole'])->name('members.update-role');
  Route::delete('/{idOrSlug}/members/{user}', [WorkspaceController::class, 'removeMember'])->name('members.remove');
  Route::post('/{idOrSlug}/roles', [WorkspaceController::class, 'storeRole'])->name('roles.store');
  Route::get('/{idOrSlug}/permissions', [WorkspaceController::class, 'permissions'])->name('permissions');

  // Role management
  Route::post('/{idOrSlug}/roles/assign', [RoleController::class, 'assign'])->name('roles.assign');
  Route::put('/{idOrSlug}/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
  Route::delete('/{idOrSlug}/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
  Route::delete('/{idOrSlug}/roles/revoke', [RoleController::class, 'revoke'])->name('roles.revoke');
  Route::get('/{idOrSlug}/roles', [RoleController::class, 'index'])->name('roles.index');
  Route::get('/{idOrSlug}/users/{user}/permissions', [RoleController::class, 'permissions'])->name('users.permissions');

  // Legacy approval workflows (old schema)
  Route::get('/{idOrSlug}/approval-workflows', [WorkspaceApprovalWorkflowController::class, 'index'])->name('approval-workflows.index');
  Route::post('/{idOrSlug}/approval-workflows', [WorkspaceApprovalWorkflowController::class, 'store'])->name('approval-workflows.store');
  Route::put('/{idOrSlug}/approval-workflows/{workflow}', [WorkspaceApprovalWorkflowController::class, 'update'])->name('approval-workflows.update');
  Route::delete('/{idOrSlug}/approval-workflows/{workflow}', [WorkspaceApprovalWorkflowController::class, 'destroy'])->name('approval-workflows.destroy');

  // New approval workflow system (simplified roles)
  Route::prefix('/{idOrSlug}/approval-workflow')->name('approval-workflow.')->group(function () {
    Route::post('/enable', [\App\Http\Controllers\Api\ApprovalWorkflowController::class, 'enable'])->name('enable');
    Route::post('/disable', [\App\Http\Controllers\Api\ApprovalWorkflowController::class, 'disable'])->name('disable');
    Route::put('/configure', [\App\Http\Controllers\Api\ApprovalWorkflowController::class, 'configure'])->name('configure');
    Route::get('/', [\App\Http\Controllers\Api\ApprovalWorkflowController::class, 'show'])->name('show');
    Route::post('/levels', [\App\Http\Controllers\Api\ApprovalWorkflowController::class, 'addLevel'])->name('levels.add');
    Route::put('/levels/{level}', [\App\Http\Controllers\Api\ApprovalWorkflowController::class, 'updateLevel'])->name('levels.update');
    Route::delete('/levels/{level}', [\App\Http\Controllers\Api\ApprovalWorkflowController::class, 'removeLevel'])->name('levels.remove');
  });

  // Approval analytics
  Route::get('/{idOrSlug}/approval-analytics', [\App\Http\Controllers\Api\ApprovalAnalyticsController::class, 'index'])->name('approval-analytics.index');
  Route::get('/{idOrSlug}/approval-analytics/export', [\App\Http\Controllers\Api\ApprovalAnalyticsController::class, 'export'])->name('approval-analytics.export');

  // Enterprise: Webhook testing & Activity
  Route::post('/{idOrSlug}/webhooks/test', [WorkspaceController::class, 'testWebhook'])->name('webhooks.test');
  Route::get('/{idOrSlug}/activity', [WorkspaceController::class, 'activity'])->name('activity');
});
