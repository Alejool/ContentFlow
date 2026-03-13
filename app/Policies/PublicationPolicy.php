<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Publications\Publication;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;
use App\Services\RoleService;
use App\Services\ApprovalWorkflowService;

class PublicationPolicy
{
    public function __construct(
        private RoleService $roleService,
        private ApprovalWorkflowService $approvalWorkflowService
    ) {}

    /**
     * Determine if the user can submit content for approval.
     * 
     * Requirements: 5.1
     * - User must have create_content or manage_content permission
     * - Content must be in draft or rejected status
     * - Approval workflow must be enabled for the workspace
     */
    public function submitForApproval(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Check if user has permission to create or manage content
        if (!$this->roleService->userHasPermission($user, $workspace, 'create_content') &&
            !$this->roleService->userHasPermission($user, $workspace, 'manage_content')) {
            return false;
        }

        // Check if content is in a valid status for submission
        if (!in_array($publication->status, ['draft', 'rejected'])) {
            return false;
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        if (!$workflow || !$workflow->is_active) {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can approve content.
     * 
     * Requirements: 5.4, 7.3
     * - Content must be in pending_review status
     * - For simple workflow: user must have publish_content permission
     * - For multi-level workflow: user must have the role required for current level
     * - Owner can always approve
     */
    public function approve(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Content must be pending review
        if ($publication->status !== 'pending_review') {
            return false;
        }

        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Owner can always approve
        if ($userRole->name === Role::OWNER) {
            return true;
        }

        // Get approval workflow
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_active) {
            return false;
        }

        // For simple workflow, check publish_content permission
        if ($workflow->isSimpleWorkflow()) {
            return $this->roleService->userHasPermission($user, $workspace, 'publish_content');
        }

        // For multi-level workflow, check if user has the required role for current level
        $currentLevel = $workflow->getLevelByNumber($publication->current_approval_level);
        
        if (!$currentLevel) {
            return false;
        }

        return $userRole->id === $currentLevel->role_id;
    }

    /**
     * Determine if the user can reject content.
     * 
     * Requirements: 5.5, 7.5
     * - Same rules as approve
     */
    public function reject(User $user, Publication $publication): bool
    {
        return $this->approve($user, $publication);
    }

    /**
     * Determine if the user can publish content.
     * 
     * Requirements: 8.1, 8.2, 8.3, 8.5
     * - User must have publish_content permission
     * - If approval workflow is enabled:
     *   - Content must be in approved status (unless user is Owner)
     * - Owner can bypass approval requirements
     */
    public function publish(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Get user's role in workspace first
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Owner can bypass ALL requirements (approval workflow and permissions)
        if ($userRole->name === Role::OWNER) {
            return true;
        }

        // For non-Owner users, check if they have publish_content permission
        if (!$this->roleService->userHasPermission($user, $workspace, 'publish_content')) {
            return false;
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_active) {
            // No approval workflow, just need publish permission
            return true;
        }

        // If approval workflow is enabled, content MUST be approved
        // Even users with publish_content permission cannot bypass the workflow
        if ($publication->status !== 'approved') {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can view the publication.
     */
    public function view(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;
        
        return $this->roleService->userHasPermission($user, $workspace, 'view_content');
    }

    /**
     * Determine if the user can update the publication.
     */
    public function update(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // User must have manage_content permission or be the creator
        if ($publication->user_id === $user->id) {
            return $this->roleService->userHasPermission($user, $workspace, 'create_content');
        }

        return $this->roleService->userHasPermission($user, $workspace, 'manage_content');
    }

    /**
     * Determine if the user can delete the publication.
     */
    public function delete(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // User must have manage_content permission or be the creator
        if ($publication->user_id === $user->id) {
            return $this->roleService->userHasPermission($user, $workspace, 'manage_content');
        }

        return $this->roleService->userHasPermission($user, $workspace, 'manage_content');
    }

    /**
     * Determine if the user can create publications.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        return $this->roleService->userHasPermission($user, $workspace, 'create_content');
    }

    /**
     * Determine if the user can manually resolve approval state.
     * 
     * Requirements: 11.7, 8.6
     * - User must be Admin or Owner
     * - This is for emergency resolution when approval workflow is stuck
     */
    public function manualResolve(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Only Admin and Owner can manually resolve
        return in_array($userRole->name, [Role::ADMIN, Role::OWNER]);
    }

    /**
     * Get the user's role in a workspace.
     */
    private function getUserRoleInWorkspace(User $user, Workspace $workspace): ?Role
    {
        $workspaceUser = $user->workspaces()
            ->where('workspaces.id', $workspace->id)
            ->first();

        if (!$workspaceUser || !$workspaceUser->pivot->role_id) {
            return null;
        }

        return Role::find($workspaceUser->pivot->role_id);
    }
}
