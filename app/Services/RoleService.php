<?php

namespace App\Services;

use App\Models\Role\Role;
use App\Models\Permission\Permission;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Exceptions\RoleNotFoundException;
use App\Exceptions\InsufficientPermissionsException;
use App\Events\RoleChanged;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;

class RoleService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    private const CACHE_TTL = 3600;

    /**
     * Assign a role to a user in a workspace
     * 
     * @param User $user The user to assign the role to
     * @param Workspace $workspace The workspace context
     * @param string $roleName The name of the role to assign
     * @param User|null $assigner The user performing the assignment (for audit trail)
     * 
     * @throws RoleNotFoundException If the role doesn't exist
     * @throws InsufficientPermissionsException If the assigner cannot assign this role
     */
    public function assignRole(User $user, Workspace $workspace, string $roleName, ?User $assigner = null): void
    {
        // Validate role exists
        $role = Role::where('name', $roleName)->first();
        
        if (!$role) {
            throw new RoleNotFoundException($roleName);
        }

        // Check if assigner has permission to assign this role
        if ($assigner && !$this->canAssignRole($assigner, $roleName)) {
            throw new InsufficientPermissionsException(
                "You do not have permission to assign the '{$roleName}' role."
            );
        }

        // Check if user already has a role in this workspace
        $existingPivot = DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if ($existingPivot) {
            // Update existing role assignment
            DB::table('role_user')
                ->where('user_id', $user->id)
                ->where('workspace_id', $workspace->id)
                ->update([
                    'role_id' => $role->id,
                    'assigned_by' => $assigner?->id,
                    'assigned_at' => now(),
                ]);
        } else {
            // Create new role assignment
            DB::table('role_user')->insert([
                'user_id' => $user->id,
                'role_id' => $role->id,
                'workspace_id' => $workspace->id,
                'assigned_by' => $assigner?->id,
                'assigned_at' => now(),
            ]);
        }

        // Clear permission cache for the affected user
        $this->clearPermissionCache($user, $workspace);

        // Dispatch RoleChanged event for additional cache invalidation
        event(new RoleChanged(
            action: 'role_assigned',
            auditable: $user,
            oldValues: $existingPivot ? ['role_id' => $existingPivot->role_id] : null,
            newValues: ['role_id' => $role->id],
            metadata: [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'role_name' => $roleName,
                'assigned_by' => $assigner?->id,
            ]
        ));
    }

    /**
     * Get all users with a specific role in a workspace
     * 
     * @param Workspace $workspace The workspace to query
     * @param string $roleName The name of the role to filter by
     * 
     * @return Collection Collection of users with the specified role
     */
    public function getUsersWithRole(Workspace $workspace, string $roleName): Collection
    {
        $role = Role::where('name', $roleName)->first();

        if (!$role) {
            return collect();
        }

        // Optimized: Use eager loading to avoid N+1 queries
        return User::select('users.*')
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->where('role_user.workspace_id', $workspace->id)
            ->where('role_user.role_id', $role->id)
            ->with(['roles' => function ($query) use ($workspace) {
                $query->wherePivot('workspace_id', $workspace->id);
            }])
            ->get();
    }

    /**
     * Check if a user has a specific permission in a workspace
     * 
     * @param User $user The user to check
     * @param Workspace $workspace The workspace context
     * @param string $permission The permission name to check
     * 
     * @return bool True if the user has the permission
     */
    public function userHasPermission(User $user, Workspace $workspace, string $permission): bool
    {
        // Check Redis cache first
        $cacheKey = $this->getPermissionCacheKey($user, $workspace, $permission);
        
        $cached = Redis::get($cacheKey);
        if ($cached !== null) {
            return (bool) $cached;
        }

        // Fall back to database query
        $hasPermission = $this->checkPermissionInDatabase($user, $workspace, $permission);

        // Cache the result
        Redis::setex($cacheKey, self::CACHE_TTL, $hasPermission ? '1' : '0');

        return $hasPermission;
    }

    /**
     * Get all permissions for a user in a workspace
     * 
     * @param User $user The user to get permissions for
     * @param Workspace $workspace The workspace context
     * 
     * @return array Array of permission names
     */
    public function getUserPermissions(User $user, Workspace $workspace): array
    {
        // Check Redis cache first
        $cacheKey = $this->getUserPermissionsCacheKey($user, $workspace);
        
        $cached = Redis::get($cacheKey);
        if ($cached !== null) {
            return json_decode($cached, true);
        }

        // Fall back to database query
        $permissions = $this->getPermissionsFromDatabase($user, $workspace);

        // Cache the results
        Redis::setex($cacheKey, self::CACHE_TTL, json_encode($permissions));

        return $permissions;
    }

    /**
     * Validate if a role can be assigned by the current user
     * 
     * @param User $assigner The user attempting to assign the role
     * @param string $targetRole The role name to be assigned
     * 
     * @return bool True if the assigner can assign the target role
     */
    public function canAssignRole(User $assigner, string $targetRole): bool
    {
        // Get assigner's role in the current workspace
        $assignerWorkspaceId = $assigner->current_workspace_id;
        
        if (!$assignerWorkspaceId) {
            return false;
        }

        $assignerRolePivot = DB::table('role_user')
            ->where('user_id', $assigner->id)
            ->where('workspace_id', $assignerWorkspaceId)
            ->first();

        if (!$assignerRolePivot) {
            return false;
        }

        $assignerRole = Role::find($assignerRolePivot->role_id);

        if (!$assignerRole) {
            return false;
        }

        // Owner can assign any role
        if ($assignerRole->slug === Role::OWNER) {
            return true;
        }

        // Admin can assign Editor and Viewer roles only
        if ($assignerRole->slug === Role::ADMIN) {
            return in_array($targetRole, [Role::EDITOR, Role::VIEWER]);
        }

        // Other roles cannot assign roles
        return false;
    }

    /**
     * Check permission in database
     * 
     * @param User $user
     * @param Workspace $workspace
     * @param string $permission
     * 
     * @return bool
     */
    private function checkPermissionInDatabase(User $user, Workspace $workspace, string $permission): bool
    {
        // Check if user is workspace owner (bypass)
        if ($workspace->created_by === $user->id) {
            return true;
        }

        // Get user's role in the workspace
        $rolePivot = DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (!$rolePivot) {
            return false;
        }

        $role = Role::find($rolePivot->role_id);

        if (!$role) {
            return false;
        }

        // Owner role has all permissions
        if ($role->slug === Role::OWNER) {
            return true;
        }

        // Check if role has the specific permission
        return $role->permissions()
            ->where('slug', $permission)
            ->exists();
    }

    /**
     * Get permissions from database
     * 
     * @param User $user
     * @param Workspace $workspace
     * 
     * @return array
     */
    private function getPermissionsFromDatabase(User $user, Workspace $workspace): array
    {
        // Check if user is workspace owner (has all permissions)
        if ($workspace->created_by === $user->id) {
            return [
                Permission::VIEW_CONTENT,
                Permission::CREATE_CONTENT,
                Permission::MANAGE_CONTENT,
                Permission::PUBLISH_CONTENT,
                Permission::MANAGE_WORKSPACE,
            ];
        }

        // Get user's role in the workspace
        $rolePivot = DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (!$rolePivot) {
            return [];
        }

        $role = Role::with('permissions')->find($rolePivot->role_id);

        if (!$role) {
            return [];
        }

        // Owner role has all permissions
        if ($role->slug === Role::OWNER) {
            return [
                Permission::VIEW_CONTENT,
                Permission::CREATE_CONTENT,
                Permission::MANAGE_CONTENT,
                Permission::PUBLISH_CONTENT,
                Permission::MANAGE_WORKSPACE,
            ];
        }

        // Return role's permissions
        return $role->permissions->pluck('name')->toArray();
    }

    /**
     * Get cache key for a specific permission check
     * 
     * @param User $user
     * @param Workspace $workspace
     * @param string $permission
     * 
     * @return string
     */
    private function getPermissionCacheKey(User $user, Workspace $workspace, string $permission): string
    {
        return "permission:user:{$user->id}:workspace:{$workspace->id}:permission:{$permission}";
    }

    /**
     * Get cache key for user's all permissions
     * 
     * @param User $user
     * @param Workspace $workspace
     * 
     * @return string
     */
    private function getUserPermissionsCacheKey(User $user, Workspace $workspace): string
    {
        return "permissions:user:{$user->id}:workspace:{$workspace->id}";
    }

    /**
     * Clear permission cache for a user in a workspace
     * 
     * @param User $user
     * @param Workspace $workspace
     * 
     * @return void
     */
    private function clearPermissionCache(User $user, Workspace $workspace): void
    {
        // Clear all permissions cache
        $allPermissionsKey = $this->getUserPermissionsCacheKey($user, $workspace);
        Redis::del($allPermissionsKey);

        // Clear individual permission caches
        $permissions = [
            Permission::VIEW_CONTENT,
            Permission::CREATE_CONTENT,
            Permission::MANAGE_CONTENT,
            Permission::PUBLISH_CONTENT,
            Permission::MANAGE_WORKSPACE,
        ];

        foreach ($permissions as $permission) {
            $key = $this->getPermissionCacheKey($user, $workspace, $permission);
            Redis::del($key);
        }
    }
}
