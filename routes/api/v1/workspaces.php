<?php

use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('workspaces')->name('workspaces.')->group(function () {
  Route::get('/', [WorkspaceController::class, 'index'])->name('index');
  Route::post('/', [WorkspaceController::class, 'store'])->name('store');
  Route::post('/{workspace}/switch', [WorkspaceController::class, 'switch'])->name('switch');
  Route::get('/{workspace}/settings', [WorkspaceController::class, 'settings'])->name('settings');
  Route::put('/{workspace}', [WorkspaceController::class, 'update'])->name('update');

  // Member management
  Route::get('/{workspace}/members', [WorkspaceController::class, 'members'])->name('members');
  Route::post('/{workspace}/invite', [WorkspaceController::class, 'invite'])->name('invite');
  Route::put('/{workspace}/members/{user}/role', [WorkspaceController::class, 'updateMemberRole'])->name('members.update-role');
  Route::delete('/{workspace}/members/{user}', [WorkspaceController::class, 'removeMember'])->name('members.remove');

  // Enterprise: Webhook testing & Activity
  Route::post('/{workspace}/webhooks/test', [WorkspaceController::class, 'testWebhook'])->name('webhooks.test');
  Route::get('/{workspace}/activity', [WorkspaceController::class, 'activity'])->name('activity');
});
