<?php

use App\Http\Controllers\Workspace\WorkspaceController;
use App\Http\Controllers\Workspace\WorkspaceApprovalWorkflowController;
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
  Route::post('/{idOrSlug}/roles', [WorkspaceController::class, 'storeRole'])->name('roles.store');
  Route::get('/{idOrSlug}/permissions', [WorkspaceController::class, 'permissions'])->name('permissions');

  // Enterprise: Webhook testing & Activity
  Route::get('/{idOrSlug}/approval-workflows', [WorkspaceApprovalWorkflowController::class, 'index'])->name('approval-workflows.index');
  Route::post('/{idOrSlug}/approval-workflows', [WorkspaceApprovalWorkflowController::class, 'store'])->name('approval-workflows.store');
  Route::put('/{idOrSlug}/approval-workflows/{workflow}', [WorkspaceApprovalWorkflowController::class, 'update'])->name('approval-workflows.update');
  Route::delete('/{idOrSlug}/approval-workflows/{workflow}', [WorkspaceApprovalWorkflowController::class, 'destroy'])->name('approval-workflows.destroy');

  // Enterprise: Webhook testing & Activity
  Route::post('/{idOrSlug}/webhooks/test', [WorkspaceController::class, 'testWebhook'])->name('webhooks.test');
  Route::get('/{idOrSlug}/activity', [WorkspaceController::class, 'activity'])->name('activity');
});
