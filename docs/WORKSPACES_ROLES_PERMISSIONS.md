# Workspace, Roles, and Permissions - Correct Usage Guide

## Database Structure

The application uses a **global roles** system where:

- **Roles** are global entities (not workspace-specific)
- **Permissions** are attached to roles via `permission_role` pivot table
- **Users** are assigned roles **per workspace** via the `workspace_user` pivot table

### Tables Structure

```
users
├── id
├── name
├── email
└── current_workspace_id

workspaces
├── id
├── name
├── slug
└── created_by (user_id)

roles (GLOBAL - no workspace_id)
├── id
├── name
├── slug
└── description

permissions (GLOBAL)
├── id
├── name
├── slug
└── description

workspace_user (PIVOT)
├── id
├── workspace_id
├── user_id
├── role_id  ← User's role in THIS workspace
└── timestamps

permission_role (PIVOT)
├── id
├── permission_id
├── role_id
└── timestamps
```

## ❌ INCORRECT Usage

```php
// This WILL FAIL with error:
// "column roles.workspace_id does not exist"
$user = User::with('workspaces.roles.permissions')->first();
```

**Why it fails:** The `Workspace` model doesn't have a `roles()` relationship because roles are global, not workspace-specific.

## ✅ CORRECT Usage

### Method 1: Using the Helper Method

```php
$user = User::first();
$workspaces = $user->getWorkspacesWithRolesAndPermissions();

foreach ($workspaces as $workspace) {
    $role = $workspace->pivot->role; // Role is auto-loaded via WorkspaceUser pivot
    $permissions = $role->permissions; // Load permissions from role
    
    echo "Workspace: {$workspace->name}\n";
    echo "Role: {$role->name}\n";
    echo "Permissions: " . $permissions->pluck('slug')->implode(', ') . "\n";
}
```

### Method 2: Direct Eager Loading

```php
// Load workspaces (WorkspaceUser pivot auto-loads role via $with = ['role'])
$user = User::with('workspaces')->first();

foreach ($user->workspaces as $workspace) {
    $role = $workspace->pivot->role; // Access role through pivot
    
    if ($role) {
        // Lazy load permissions if needed
        $role->load('permissions');
        $permissions = $role->permissions;
    }
}
```

### Method 3: Eager Load Everything at Once

```php
// This is the most efficient way - loads everything in minimal queries
$user = User::first();
$user->load('workspaces'); // WorkspaceUser pivot auto-loads role

// Then load permissions for all roles at once
$roleIds = $user->workspaces->pluck('pivot.role.id')->filter();
$rolesWithPermissions = \App\Models\Role::with('permissions')
    ->whereIn('id', $roleIds)
    ->get()
    ->keyBy('id');

foreach ($user->workspaces as $workspace) {
    $role = $workspace->pivot->role;
    if ($role && isset($rolesWithPermissions[$role->id])) {
        $role->setRelation('permissions', $rolesWithPermissions[$role->id]->permissions);
    }
}
```

## Model Relationships

### User Model

```php
public function workspaces()
{
    return $this->belongsToMany(Workspace::class, 'workspace_user')
        ->using(WorkspaceUser::class)
        ->withPivot('role_id')
        ->withTimestamps();
}

public function currentWorkspace()
{
    return $this->belongsTo(Workspace::class, 'current_workspace_id');
}
```

### Workspace Model

```php
public function users()
{
    return $this->belongsToMany(User::class, 'workspace_user')
        ->using(WorkspaceUser::class)
        ->withPivot('role_id')
        ->withTimestamps();
}

// NOTE: No roles() relationship! Roles are accessed through the pivot.
```

### WorkspaceUser Pivot Model

```php
class WorkspaceUser extends Pivot
{
    protected $table = 'workspace_user';
    protected $with = ['role']; // Auto-loads role!

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

### Role Model

```php
public function permissions()
{
    return $this->belongsToMany(Permission::class, 'permission_role')
        ->withTimestamps();
}

public function users()
{
    return $this->belongsToMany(User::class, 'workspace_user')
        ->withPivot('workspace_id')
        ->withTimestamps();
}
```

## Common Use Cases

### Get Current User's Role in Current Workspace

```php
$user = auth()->user();
$workspace = $user->workspaces()
    ->where('workspaces.id', $user->current_workspace_id)
    ->first();

$role = $workspace->pivot->role;
```

### Check if User Has Permission in Workspace

```php
// Use the built-in method
$hasPermission = $user->hasPermission('publish', $workspaceId);

// Or manually:
$workspace = $user->workspaces()->where('workspaces.id', $workspaceId)->first();
$role = $workspace->pivot->role;
$hasPermission = $role->permissions()->where('slug', 'publish')->exists();
```

### Get All Users in a Workspace with Their Roles

```php
$workspace = Workspace::with('users')->find($workspaceId);

foreach ($workspace->users as $user) {
    $role = $user->pivot->role; // Auto-loaded
    echo "{$user->name} - {$role->name}\n";
}
```

### Assign Role to User in Workspace

```php
$workspace->users()->attach($userId, ['role_id' => $roleId]);

// Or update existing:
$workspace->users()->updateExistingPivot($userId, ['role_id' => $roleId]);
```

## Key Points to Remember

1. **Roles are global** - they don't belong to workspaces
2. **Access roles through the pivot** - `$workspace->pivot->role`
3. **WorkspaceUser auto-loads role** - thanks to `protected $with = ['role']`
4. **Never use** `$user->workspaces->roles` - this relationship doesn't exist
5. **Use the helper method** - `$user->getWorkspacesWithRolesAndPermissions()` for convenience

## Troubleshooting

### Error: "column roles.workspace_id does not exist"

**Cause:** Trying to access roles as if they belong to workspaces.

**Solution:** Access roles through the pivot table:
```php
// ❌ Wrong
$user->workspaces->roles

// ✅ Correct
foreach ($user->workspaces as $workspace) {
    $role = $workspace->pivot->role;
}
```

### Permissions Not Loading

**Cause:** Permissions need to be explicitly loaded from the role.

**Solution:**
```php
$workspace = $user->workspaces->first();
$role = $workspace->pivot->role;
$role->load('permissions'); // Explicitly load
$permissions = $role->permissions;
```
