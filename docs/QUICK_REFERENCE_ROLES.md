# Quick Reference: Workspaces, Roles & Permissions

## ❌ WRONG - Will cause "column roles.workspace_id does not exist" error

```php
$user = User::with('workspaces.roles.permissions')->first();
```

## ✅ CORRECT - Access roles through pivot table

```php
// Method 1: Use helper method
$user = User::first();
$workspaces = $user->getWorkspacesWithRolesAndPermissions();

foreach ($workspaces as $workspace) {
    $role = $workspace->pivot->role;
    $permissions = $role->permissions;
}

// Method 2: Direct access
$user = User::with('workspaces')->first();

foreach ($user->workspaces as $workspace) {
    $role = $workspace->pivot->role; // Auto-loaded by WorkspaceUser
    $role->load('permissions'); // Load permissions
    $permissions = $role->permissions;
}
```

## Common Patterns

```php
// Get user's role in current workspace
$workspace = $user->workspaces()
    ->where('workspaces.id', $user->current_workspace_id)
    ->first();
$role = $workspace->pivot->role;

// Check permission
$hasPermission = $user->hasPermission('publish');

// Get all workspace users with roles
$workspace = Workspace::with('users')->find($id);
foreach ($workspace->users as $user) {
    $role = $user->pivot->role;
}

// Assign role to user in workspace
$workspace->users()->attach($userId, ['role_id' => $roleId]);
```

## Key Concept

**Roles are GLOBAL, not workspace-specific!**

The `workspace_user` pivot table stores which role a user has in each workspace.

```
User ←→ workspace_user (has role_id) ←→ Workspace
              ↓
            Role ←→ permission_role ←→ Permission
```

Access: `$workspace->pivot->role->permissions`
