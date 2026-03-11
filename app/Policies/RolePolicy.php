<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Role\Role;
use App\Models\Workspace\Workspace;
use App\Services\RoleService;

class RolePolicy
{
    public function __construct(
        private RoleService $roleService
    ) {}

    /**
     * Determine if the user can assign a role to another user.
     * 
     * Requirements: 1.4, 1.5
     * - Admins can assign Editor and Viewer roles
     * - Admins cannot assign Owner or Admin roles
     * - Only Owners can assign any role
     */
    public function assignRole(User $user, Workspace $workspace, string $targetRoleName): bool
    {
        // Check if user has permission to manage workspace
        if (!$this->roleService->userHasPermission($user, $workspace, 'manage_workspace')) {
            return false;
        }

        // Get user's role in the workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Owner can assign any role
        if ($userRole === Role::OWNER) {
            return true;
        }

        // Admin can only assign Editor and Viewer roles
        if ($userRole === Role::ADMIN) {
            return in_array($targetRoleName, [Role::EDITOR, Role::VIEWER]);
        }

        return false;
    }

    /**
     * Determine if the user can revoke a role from another user.
     * 
     * Requirements: 1.4, 1.5
     * - Same rules as assignRole
     */
    public function revokeRole(User $user, Workspace $workspace, string $targetRoleName): bool
    {
        return $this->assignRole($user, $workspace, $targetRoleName);
    }

    /**
     * Determine if the user can update the approval_participant flag.
     * 
     * Requirements: 4.5, 4.6
     * - Only Admins and Owners can modify approval_participant
     * - Can only modify for Editor role
     * - Cannot modify for Owner, Admin, or Viewer roles
     */
    public function updateApprovalParticipant(User $user, Workspace $workspace, Role $role): bool
    {
        // Check if user has permission to manage workspace
        if (!$this->roleService->userHasPermission($user, $workspace, 'manage_workspace')) {
            return false;
        }

        // Can only modify approval_participant for Editor role
        if ($role->name !== Role::EDITOR) {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can delete a role.
     * 
     * Requirements: 1.3
     * - System roles (Owner, Admin, Editor, Viewer) cannot be deleted
     */
    public function delete(User $user, Role $role): bool
    {
        // System roles cannot be deleted
        if ($role->is_system_role) {
            return false;
        }

        return false; // All roles in this system are system roles
    }

    /**
     * Determine if the user can modify core attributes of a role.
     * 
     * Requirements: 1.3, 1.5
     * - System roles cannot have their name or core permissions modified
     */
    public function update(User $user, Role $role): bool
    {
        // System roles cannot be modified
        if ($role->is_system_role) {
            return false;
        }

        return false; // All roles in this system are system roles
    }

    /**
     * Get the user's role name in a workspace.
     */
    private function getUserRoleInWorkspace(User $user, Workspace $workspace): ?string
    {
        $workspaceUser = $user->workspaces()
            ->where('workspaces.id', $workspace->id)
            ->first();

        if (!$workspaceUser || !$workspaceUser->pivot->role_id) {
            return null;
        }

        $role = Role::find($workspaceUser->pivot->role_id);
        
        return $role?->name;
    }
}
