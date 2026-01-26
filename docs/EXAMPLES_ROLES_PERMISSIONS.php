<?php

/**
 * COMPREHENSIVE EXAMPLES: Workspaces, Roles & Permissions
 *
 * This file contains all the correct patterns for working with
 * workspaces, roles, and permissions in ContentFlow.
 */

use App\Models\User;
use App\Models\Workspace;
use App\Models\Role;
use App\Models\Permission;

// ============================================================================
// EXAMPLE 1: Get User's Workspaces with Roles and Permissions
// ============================================================================

// Method A: Using the helper method (RECOMMENDED)
$user = User::find(1);
$workspaces = $user->getWorkspacesWithRolesAndPermissions();

foreach ($workspaces as $workspace) {
  $role = $workspace->pivot->role; // Auto-loaded

  if ($role) {
    echo "Workspace: {$workspace->name}\n";
    echo "Role: {$role->name}\n";

    // Load permissions
    $role->load('permissions');
    echo "Permissions: " . $role->permissions->pluck('slug')->implode(', ') . "\n";
  }
}

// Method B: Direct eager loading
$user = User::with('workspaces')->find(1);

foreach ($user->workspaces as $workspace) {
  $role = $workspace->pivot->role; // Auto-loaded by WorkspaceUser

  if ($role) {
    // Lazy load permissions if needed
    $role->load('permissions');
    $permissions = $role->permissions;
  }
}

// ============================================================================
// EXAMPLE 2: Get Current User's Role in Current Workspace
// ============================================================================

$user = auth()->user();

// Get current workspace with role
$currentWorkspace = $user->workspaces()
  ->where('workspaces.id', $user->current_workspace_id)
  ->first();

if ($currentWorkspace) {
  $role = $currentWorkspace->pivot->role;
  echo "Current workspace: {$currentWorkspace->name}\n";
  echo "Your role: {$role->name}\n";
}

// ============================================================================
// EXAMPLE 3: Check if User Has Permission in Workspace
// ============================================================================

// Method A: Using built-in method (RECOMMENDED)
$hasPublishPermission = $user->hasPermission('publish');
$hasApprovePermission = $user->hasPermission('approve', $workspaceId);

// Method B: Manual check
$workspace = $user->workspaces()
  ->where('workspaces.id', $workspaceId)
  ->first();

if ($workspace) {
  $role = $workspace->pivot->role;

  if ($role) {
    $hasPermission = $role->permissions()
      ->where('slug', 'publish')
      ->exists();
  }
}

// ============================================================================
// EXAMPLE 4: Get All Users in a Workspace with Their Roles
// ============================================================================

$workspace = Workspace::with('users')->find($workspaceId);

foreach ($workspace->users as $user) {
  $role = $user->pivot->role; // Auto-loaded

  echo "{$user->name} - {$role->name}\n";

  // Check if user is the workspace creator
  if ($workspace->created_by === $user->id) {
    echo "  (Workspace Creator)\n";
  }
}

// ============================================================================
// EXAMPLE 5: Assign/Update Role for User in Workspace
// ============================================================================

// Get the role
$editorRole = Role::where('slug', 'editor')->first();

// Assign user to workspace with role
$workspace->users()->attach($userId, [
  'role_id' => $editorRole->id
]);

// Update existing user's role in workspace
$workspace->users()->updateExistingPivot($userId, [
  'role_id' => $editorRole->id
]);

// Remove user from workspace
$workspace->users()->detach($userId);

// ============================================================================
// EXAMPLE 6: Get All Permissions for a Role
// ============================================================================

$role = Role::where('slug', 'owner')->first();
$permissions = $role->permissions;

foreach ($permissions as $permission) {
  echo "{$permission->name} ({$permission->slug})\n";
}

// ============================================================================
// EXAMPLE 7: Create New Workspace and Assign Owner
// ============================================================================

$workspace = Workspace::create([
  'name' => 'My New Workspace',
  'slug' => 'my-new-workspace',
  'created_by' => $user->id,
]);

// Assign creator as owner
$ownerRole = Role::where('slug', 'owner')->first();
$workspace->users()->attach($user->id, [
  'role_id' => $ownerRole->id
]);

// Set as user's current workspace
$user->update([
  'current_workspace_id' => $workspace->id
]);

// ============================================================================
// EXAMPLE 8: Efficient Loading - Get All Data in Minimal Queries
// ============================================================================

// Load user with workspaces
$user = User::with('workspaces')->find(1);

// Get all role IDs
$roleIds = $user->workspaces
  ->pluck('pivot.role.id')
  ->filter()
  ->unique();

// Load all roles with permissions in one query
$rolesWithPermissions = Role::with('permissions')
  ->whereIn('id', $roleIds)
  ->get()
  ->keyBy('id');

// Attach permissions to roles
foreach ($user->workspaces as $workspace) {
  $role = $workspace->pivot->role;

  if ($role && isset($rolesWithPermissions[$role->id])) {
    $role->setRelation('permissions', $rolesWithPermissions[$role->id]->permissions);

    echo "Workspace: {$workspace->name}\n";
    echo "Role: {$role->name}\n";
    echo "Permissions: " . $role->permissions->pluck('slug')->implode(', ') . "\n\n";
  }
}

// ============================================================================
// EXAMPLE 9: Check Multiple Permissions at Once
// ============================================================================

$workspace = $user->workspaces()
  ->where('workspaces.id', $user->current_workspace_id)
  ->first();

$role = $workspace->pivot->role;
$role->load('permissions');

$requiredPermissions = ['publish', 'approve', 'manage-content'];
$userPermissions = $role->permissions->pluck('slug')->toArray();

$hasAllPermissions = empty(array_diff($requiredPermissions, $userPermissions));

if ($hasAllPermissions) {
  echo "User has all required permissions\n";
}

// ============================================================================
// EXAMPLE 10: Get Workspace Statistics
// ============================================================================

$workspace = Workspace::with('users')->find($workspaceId);

// Count users by role
$usersByRole = $workspace->users->groupBy(function ($user) {
  return $user->pivot->role->name;
});

foreach ($usersByRole as $roleName => $users) {
  echo "{$roleName}: " . $users->count() . " users\n";
}

// ============================================================================
// COMMON MISTAKES TO AVOID
// ============================================================================

// ❌ WRONG - Will cause "column roles.workspace_id does not exist" error
// $user = User::with('workspaces.roles.permissions')->first();

// ❌ WRONG - Trying to access roles as a collection on workspace
// $roles = $workspace->roles;

// ❌ WRONG - Trying to access role directly on workspace
// $role = $workspace->role;

// ✅ CORRECT - Access role through pivot
// $role = $workspace->pivot->role;

// ============================================================================
// KEY CONCEPTS
// ============================================================================

/*
 * 1. Roles are GLOBAL entities (no workspace_id column)
 * 2. Users are assigned roles PER WORKSPACE via workspace_user pivot table
 * 3. WorkspaceUser pivot auto-loads the role relationship
 * 4. Always access role through: $workspace->pivot->role
 * 5. Never try to access: $workspace->roles (doesn't exist!)
 *
 * Database Structure:
 *
 *   users
 *     ↓
 *   workspace_user (pivot)
 *     ├── user_id
 *     ├── workspace_id
 *     └── role_id  ← Links to global roles table
 *           ↓
 *         roles (GLOBAL)
 *           ↓
 *         permission_role (pivot)
 *           ↓
 *         permissions
 */
