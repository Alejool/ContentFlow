<?php

use App\Models\Role;
use App\Models\User;
use App\Models\Workspace;

Route::get('/debug-owner-permissions', function () {
  $user = auth()->user();

  if (!$user) {
    return response()->json(['error' => 'Not authenticated']);
  }

  $workspaceId = $user->current_workspace_id;
  $workspace = Workspace::with('users')->find($workspaceId);

  if (!$workspace) {
    return response()->json(['error' => 'No workspace found']);
  }

  // Get user's role in this workspace
  $userWorkspace = $user->workspaces()->where('workspaces.id', $workspaceId)->first();
  $roleId = $userWorkspace?->pivot?->role_id;
  $role = Role::with('permissions')->find($roleId);

  // Check if user is creator
  $isCreator = $workspace->created_by === $user->id;

  return response()->json([
    'user_id' => $user->id,
    'workspace_id' => $workspaceId,
    'workspace_name' => $workspace->name,
    'workspace_created_by' => $workspace->created_by,
    'is_creator' => $isCreator,
    'user_role_id' => $roleId,
    'user_role' => $role ? [
      'id' => $role->id,
      'name' => $role->name,
      'slug' => $role->slug,
      'permissions' => $role->permissions->pluck('slug'),
    ] : null,
    'hasPermission_manage_team' => $user->hasPermission('manage-team', $workspaceId),
    'hasPermission_publish' => $user->hasPermission('publish', $workspaceId),
    'hasPermission_approve' => $user->hasPermission('approve', $workspaceId),
    'hasPermission_manage_content' => $user->hasPermission('manage-content', $workspaceId),
  ]);
});
