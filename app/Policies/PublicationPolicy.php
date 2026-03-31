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
     * Rule: Anyone with 'manage-content' OR 'publish' permission can submit for approval.
     * - manage-content: Editors can create and submit content
     * - publish: Publishers/Admins can also submit content
     */
    public function submitForApproval(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            \Log::warning('submitForApproval: User has no role in workspace', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
            ]);
            return false;
        }

        // CRÍTICO: Solo usuarios con permiso "publish" pueden enviar a revisión
        // Admin y Owner siempre pueden (tienen publish implícito)
        $isAdminOrOwner = in_array($userRole->slug, ['owner', 'admin']);
        $hasPublishPermission = $this->roleService->userHasPermission($user, $workspace, 'publish');
        
        if (!$isAdminOrOwner && !$hasPublishPermission) {
            \Log::warning('submitForApproval: User lacks publish permission', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'role' => $userRole->slug,
                'has_publish' => $hasPublishPermission,
            ]);
            return false;
        }

        // Check if content is in a valid status for submission
        if (!in_array($publication->status, ['draft', 'rejected', 'failed'])) {
            \Log::warning('submitForApproval: Invalid publication status', [
                'publication_id' => $publication->id,
                'status' => $publication->status,
            ]);
            return false;
        }

        \Log::info('submitForApproval: User can submit for approval', [
            'user_id' => $user->id,
            'publication_id' => $publication->id,
            'workspace_id' => $workspace->id,
            'role' => $userRole->slug,
            'has_publish' => $hasPublishPermission,
            'is_admin_or_owner' => $isAdminOrOwner,
        ]);

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
        if ($userRole->slug === Role::OWNER) {
            return true;
        }

        // Get approval workflow
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_active) {
            return false;
        }

        // For simple workflow, check publish permission
        if ($workflow->isSimpleWorkflow()) {
            return $this->roleService->userHasPermission($user, $workspace, 'publish');
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
     * CRITICAL RULES:
     * - When NO workflow: Admin and Owner can publish directly
     * - When workflow IS active: ONLY Owner can publish directly (Admin must use workflow)
     * - If approval workflow is enabled and content is approved:
     *   - User must be the one who submitted for approval
     * - All other roles must send to review
     * 
     * @param User $user
     * @param Publication $publication
     * @return bool
     */
    public function publish(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Get user's role in workspace first
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        \Log::info('PublicationPolicy::publish - Debug', [
            'user_id' => $user->id,
            'publication_id' => $publication->id,
            'workspace_id' => $workspace->id,
            'user_role_name' => $userRole ? $userRole->name : 'NULL',
            'user_role_slug' => $userRole ? $userRole->slug : 'NULL',
            'publication_status' => $publication->status,
            'publication_user_id' => $publication->user_id,
            'is_creator' => $user->id === $publication->user_id,
        ]);
        
        if (!$userRole) {
            \Log::warning('PublicationPolicy::publish - No role found for user');
            return false;
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        $workflowEnabled = $workflow && $workflow->is_enabled;
        
        if ($workflowEnabled) {
            // When workflow is ENABLED: ONLY Owner can bypass ALL requirements
            if ($userRole->slug === Role::OWNER) {
                \Log::info('PublicationPolicy::publish - User is OWNER with workflow enabled, allowing publish');
                return true;
            }
            
            // Admin and everyone else must have approved content
            if ($publication->status !== 'approved') {
                \Log::info('PublicationPolicy::publish - Content not approved', [
                    'status' => $publication->status
                ]);
                return false;
            }

            // Only the person who submitted for approval can publish
            $approvalRequest = $publication->approvalRequest;
            $submitterId = $approvalRequest?->submitted_by ?? $publication->user_id;
            $canPublish = $user->id === $submitterId;
            
            \Log::info('PublicationPolicy::publish - Workflow enabled, checking if user submitted for approval', [
                'user_id' => $user->id,
                'submitter_id' => $submitterId,
                'publication_user_id' => $publication->user_id,
                'approval_request_id' => $approvalRequest?->id,
                'approval_request_submitted_by' => $approvalRequest?->submitted_by,
                'can_publish' => $canPublish
            ]);

            return $canPublish;
        } else {
            // When NO workflow: Both Admin and Owner can bypass ALL requirements
            $isAdminOrOwner = in_array($userRole->slug, [Role::OWNER, Role::ADMIN]);
            if ($isAdminOrOwner) {
                \Log::info('PublicationPolicy::publish - User is OWNER or ADMIN without workflow, allowing publish');
                return true;
            }
            
            // All other roles cannot publish directly when no workflow
            \Log::info('PublicationPolicy::publish - No workflow active, only Admin/Owner can publish directly', [
                'user_role' => $userRole->slug,
                'can_publish' => false
            ]);
            return false;
        }
    }

    /**
     * Determine if the user can view the publication.
     */
    public function view(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;
        
        return $this->roleService->userHasPermission($user, $workspace, 'view-content');
    }

    /**
     * Determine if the user can update the publication.
     */
    public function update(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // User must have manage-content permission or be the creator
        if ($publication->user_id === $user->id) {
            return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
        }

        return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
    }

    /**
     * Determine if the user can delete the publication.
     */
    public function delete(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // User must have manage-content permission or be the creator
        if ($publication->user_id === $user->id) {
            return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
        }

        return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
    }

    /**
     * Determine if the user can create publications.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
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
        return in_array($userRole->slug, [Role::ADMIN, Role::OWNER]);
    }

    /**
     * Determine if the user can bypass the approval workflow.
     * 
     * Only workspace owners can bypass approval workflow and publish directly.
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return bool
     */
    public function canBypassApprovalWorkflow(User $user, Workspace $workspace): bool
    {
        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Only Owner can bypass approval workflow
        return $userRole->slug === Role::OWNER;
    }

    /**
     * Determine the appropriate action for a user when creating/editing content.
     * Returns 'publish' if user can publish directly, 'review' if must go through approval.
     * 
     * CRITICAL RULES:
     * - When NO workflow is active: Admin and Owner can publish directly
     * - When workflow IS active: ONLY Owner can publish directly (Admin must use workflow)
     * - All other roles must always send to review
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return string 'publish' or 'review'
     */
    public function getPublicationAction(User $user, Workspace $workspace): string
    {
        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return 'review';
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        $workflowEnabled = $workflow && $workflow->is_enabled;

        if ($workflowEnabled) {
            // When workflow is ENABLED: ONLY Owner can publish directly
            // Admin and everyone else must go through the workflow
            if ($userRole->slug === Role::OWNER) {
                return 'publish';
            }
            return 'review';
        } else {
            // When NO workflow: Both Admin and Owner can publish directly
            // Everyone else must send to review
            $isAdminOrOwner = in_array($userRole->slug, [Role::ADMIN, Role::OWNER]);
            if ($isAdminOrOwner) {
                return 'publish';
            }
            return 'review';
        }
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
