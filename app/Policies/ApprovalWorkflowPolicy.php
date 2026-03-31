<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ApprovalWorkflow;
use App\Models\Workspace\Workspace;
use App\Models\Publications\Publication;
use App\Services\RoleService;

class ApprovalWorkflowPolicy
{
    public function __construct(
        private RoleService $roleService
    ) {}

    /**
     * Determine if the user can configure the approval workflow.
     * 
     * Requirements: 9.1, 9.2
     * - Only Admins and Owners can configure workflows
     */
    public function configure(User $user, Workspace $workspace): bool
    {
        return $this->roleService->userHasPermission($user, $workspace, 'manage_workspace');
    }

    /**
     * Determine if the user can enable the approval workflow.
     * 
     * Requirements: 9.1
     * - Only Admins and Owners can enable workflows
     */
    public function enable(User $user, Workspace $workspace): bool
    {
        return $this->roleService->userHasPermission($user, $workspace, 'manage_workspace');
    }

    /**
     * Determine if the user can disable the approval workflow.
     * 
     * Requirements: 9.2
     * - Only Admins and Owners can disable workflows
     */
    public function disable(User $user, Workspace $workspace): bool
    {
        return $this->roleService->userHasPermission($user, $workspace, 'manage_workspace');
    }

    /**
     * Determine if the user can modify approval levels.
     * 
     * Requirements: 9.5
     * - Only Admins and Owners can modify levels
     * - Cannot modify levels when content is pending review
     */
    public function modifyLevels(User $user, Workspace $workspace): bool
    {
        // Check if user has permission to manage workspace
        if (!$this->roleService->userHasPermission($user, $workspace, 'manage_workspace')) {
            return false;
        }

        // Check if any content is currently pending review in this workspace
        $hasPendingContent = Publication::where('workspace_id', $workspace->id)
            ->where('status', 'pending_review')
            ->exists();

        if ($hasPendingContent) {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can add an approval level.
     * 
     * Requirements: 9.5
     */
    public function addLevel(User $user, Workspace $workspace): bool
    {
        return $this->modifyLevels($user, $workspace);
    }

    /**
     * Determine if the user can update an approval level.
     * 
     * Requirements: 9.5
     */
    public function updateLevel(User $user, Workspace $workspace): bool
    {
        return $this->modifyLevels($user, $workspace);
    }

    /**
     * Determine if the user can remove an approval level.
     * 
     * Requirements: 9.5
     */
    public function removeLevel(User $user, Workspace $workspace): bool
    {
        return $this->modifyLevels($user, $workspace);
    }

    /**
     * Determine if the user can view the approval workflow configuration.
     */
    public function view(User $user, Workspace $workspace): bool
    {
        // Any user in the workspace can view the workflow configuration
        return $user->workspaces()
            ->where('workspaces.id', $workspace->id)
            ->exists();
    }
}
