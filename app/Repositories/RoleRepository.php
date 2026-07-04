<?php

namespace App\Repositories;

use App\Models\Auth\Role;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Support\Facades\DB;

/**
 * Complex / reused Eloquent + pivot queries for roles.
 * No business logic — query construction only.
 */
class RoleRepository
{
    public function findWorkspace(string $idOrSlug): Workspace
    {
        return Workspace::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();
    }

    public function findUser(int|string $id): User
    {
        return User::findOrFail($id);
    }

    public function findRole(int $roleId): Role
    {
        return Role::findOrFail($roleId);
    }

    public function findRoleById(?int $roleId): ?Role
    {
        return $roleId ? Role::find($roleId) : null;
    }

    /** System roles with their permissions eager-loaded. */
    public function systemRolesWithPermissions()
    {
        return Role::systemRoles()->with('permissions')->get();
    }

    /** All roles with their permissions eager-loaded. */
    public function allRolesWithPermissions()
    {
        return Role::with('permissions')->get();
    }

    /** Resolve a workspace by numeric id or slug. */
    public function findWorkspaceFlexible(string $idOrSlug): Workspace
    {
        return Workspace::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', $idOrSlug);
            }
            $q->orWhere('slug', $idOrSlug);
        })->firstOrFail();
    }

    /** Pivot row for a user's role in a workspace, or null. */
    public function userRolePivot(int $userId, int $workspaceId): ?object
    {
        return DB::table('role_user')
            ->where('user_id', $userId)
            ->where('workspace_id', $workspaceId)
            ->first();
    }

    public function deleteUserRole(int $userId, int $workspaceId): void
    {
        DB::table('role_user')
            ->where('user_id', $userId)
            ->where('workspace_id', $workspaceId)
            ->delete();
    }

    public function countRoleUsers(int $roleId, int $workspaceId): int
    {
        return DB::table('role_user')
            ->where('role_id', $roleId)
            ->where('workspace_id', $workspaceId)
            ->count();
    }
}
