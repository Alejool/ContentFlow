# Database Relationships Diagram

## Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id              │
│ name            │
│ email           │
│ current_ws_id   │───┐
└─────────────────┘   │
         │            │
         │ Many       │ BelongsTo
         │            │
         ▼            │
┌─────────────────┐   │
│ WORKSPACE_USER  │   │
│    (PIVOT)      │   │
├─────────────────┤   │
│ id              │   │
│ user_id         │   │
│ workspace_id    │───┼───────┐
│ role_id         │───┼───┐   │
└─────────────────┘   │   │   │
         │            │   │   │
         │ BelongsTo  │   │   │
         ▼            │   │   │
┌─────────────────┐   │   │   │
│   WORKSPACES    │◄──┘   │   │
├─────────────────┤       │   │
│ id              │       │   │
│ name            │       │   │
│ slug            │       │   │
│ created_by      │       │   │
└─────────────────┘       │   │
                          │   │
         ┌────────────────┘   │
         │ BelongsTo          │
         ▼                    │
┌─────────────────┐           │
│     ROLES       │           │
│    (GLOBAL)     │           │
├─────────────────┤           │
│ id              │           │
│ name            │           │
│ slug            │           │
│ description     │           │
└─────────────────┘           │
         │                    │
         │ Many               │
         │                    │
         ▼                    │
┌─────────────────┐           │
│ PERMISSION_ROLE │           │
│    (PIVOT)      │           │
├─────────────────┤           │
│ id              │           │
│ permission_id   │───┐       │
│ role_id         │   │       │
└─────────────────┘   │       │
                      │       │
         ┌────────────┘       │
         │ BelongsTo          │
         ▼                    │
┌─────────────────┐           │
│  PERMISSIONS    │           │
│    (GLOBAL)     │           │
├─────────────────┤           │
│ id              │           │
│ name            │           │
│ slug            │           │
│ description     │           │
└─────────────────┘           │
                              │
                              │
         Current Workspace ───┘
```

## Data Flow: How to Access Roles & Permissions

```
User
  │
  ├─ workspaces (BelongsToMany)
  │    │
  │    └─ Workspace
  │         │
  │         └─ pivot (WorkspaceUser)
  │              │
  │              ├─ role_id
  │              │
  │              └─ role (BelongsTo) ← AUTO-LOADED!
  │                   │
  │                   └─ Role
  │                        │
  │                        └─ permissions (BelongsToMany)
  │                             │
  │                             └─ Permission[]
  │
  └─ current_workspace_id
       │
       └─ currentWorkspace (BelongsTo)
            │
            └─ Workspace
```

## Code Example with Diagram

```php
$user = User::with('workspaces')->first();

foreach ($user->workspaces as $workspace) {
    // Access path: User → workspaces → pivot → role
    $role = $workspace->pivot->role;
    
    // Access path: User → workspaces → pivot → role → permissions
    $permissions = $role->permissions;
}
```

## Visual Representation

```
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
│  - id: 1                                                      │
│  - name: "John Doe"                                           │
│  - current_workspace_id: 1                                    │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ has many workspaces through workspace_user
                        │
        ┌───────────────┴───────────────┬─────────────────────┐
        │                               │                     │
        ▼                               ▼                     ▼
┌──────────────────┐          ┌──────────────────┐  ┌──────────────────┐
│ WORKSPACE_USER   │          │ WORKSPACE_USER   │  │ WORKSPACE_USER   │
│ (PIVOT)          │          │ (PIVOT)          │  │ (PIVOT)          │
├──────────────────┤          ├──────────────────┤  ├──────────────────┤
│ workspace_id: 1  │          │ workspace_id: 2  │  │ workspace_id: 3  │
│ user_id: 1       │          │ user_id: 1       │  │ user_id: 1       │
│ role_id: 1       │          │ role_id: 2       │  │ role_id: 3       │
└────────┬─────────┘          └────────┬─────────┘  └────────┬─────────┘
         │                             │                     │
         │ belongs to role             │                     │
         ▼                             ▼                     ▼
┌──────────────────┐          ┌──────────────────┐  ┌──────────────────┐
│ ROLE: Owner      │          │ ROLE: Admin      │  │ ROLE: Editor     │
│ (GLOBAL)         │          │ (GLOBAL)         │  │ (GLOBAL)         │
├──────────────────┤          ├──────────────────┤  ├──────────────────┤
│ id: 1            │          │ id: 2            │  │ id: 3            │
│ slug: owner      │          │ slug: admin      │  │ slug: editor     │
└────────┬─────────┘          └────────┬─────────┘  └────────┬─────────┘
         │                             │                     │
         │ has many permissions        │                     │
         ▼                             ▼                     ▼
┌──────────────────┐          ┌──────────────────┐  ┌──────────────────┐
│ PERMISSIONS      │          │ PERMISSIONS      │  │ PERMISSIONS      │
│ - publish        │          │ - publish        │  │ - manage-content │
│ - approve        │          │ - approve        │  │ - view-analytics │
│ - manage-team    │          │ - manage-content │  │ - view-content   │
│ - manage-accounts│          │ - view-analytics │  └──────────────────┘
│ - view-analytics │          │ - view-content   │
│ - manage-content │          └──────────────────┘
│ - view-content   │
└──────────────────┘
```

## Key Insights

1. **One User** can belong to **Multiple Workspaces**
2. **Each Workspace** assigns the user a **Different Role**
3. **Roles are Global** - shared across all workspaces
4. **Permissions** are attached to roles, not users or workspaces
5. **WorkspaceUser pivot** stores which role a user has in each workspace

## Access Pattern

```
✅ CORRECT:
$workspace->pivot->role->permissions

❌ WRONG:
$workspace->roles->permissions  // roles() relationship doesn't exist!
```
