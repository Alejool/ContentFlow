<?php

namespace App\Services;

use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;
use App\Policies\PublicationPolicy;
use Illuminate\Support\Facades\Log;

/**
 * Service to manage publication flow based on user roles and workspace settings.
 * 
 * This service centralizes the logic for determining whether a user should:
 * - Publish content directly (owners)
 * - Send content to review (non-owners with approval workflow)
 */
class PublicationFlowService
{
    public function __construct(
        private PublicationPolicy $policy
    ) {}

    /**
     * Determine if a user can publish directly without approval.
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return bool
     */
    public function canPublishDirectly(User $user, Workspace $workspace): bool
    {
        return $this->policy->canBypassApprovalWorkflow($user, $workspace);
    }

    /**
     * Determine if a user must send content to review.
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return bool
     */
    public function mustSendToReview(User $user, Workspace $workspace): bool
    {
        // If user can bypass workflow, they don't need review
        if ($this->canPublishDirectly($user, $workspace)) {
            return false;
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_enabled) {
            return false;
        }

        return true;
    }

    /**
     * Get the appropriate action for a user in a workspace.
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return string 'publish' or 'review'
     */
    public function getPublicationAction(User $user, Workspace $workspace): string
    {
        return $this->policy->getPublicationAction($user, $workspace);
    }

    /**
     * Validate that a publication can be published by a user.
     * Throws exception if not allowed.
     * 
     * @param Publication $publication
     * @param User $user
     * @throws \Exception
     */
    public function validateCanPublish(Publication $publication, User $user): void
    {
        $workspace = $publication->workspace;

        // Check if user can bypass workflow (is owner)
        if ($this->canPublishDirectly($user, $workspace)) {
            Log::info('User can publish directly (owner)', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'publication_id' => $publication->id,
            ]);
            return;
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_enabled) {
            Log::info('No approval workflow, user can publish', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
            ]);
            return;
        }

        // If workflow is enabled, publication must be approved
        if ($publication->status !== 'approved') {
            throw new \Exception(
                'This publication must be approved before publishing. Current status: ' . $publication->status
            );
        }

        Log::info('Publication approved, can publish', [
            'user_id' => $user->id,
            'publication_id' => $publication->id,
            'status' => $publication->status,
        ]);
    }

    /**
     * Validate that a publication can be sent to review.
     * Throws exception if not allowed.
     * 
     * @param Publication $publication
     * @param User $user
     * @throws \Exception
     */
    public function validateCanRequestReview(Publication $publication, User $user): void
    {
        $workspace = $publication->workspace;

        // Owners should not use request review
        if ($this->canPublishDirectly($user, $workspace)) {
            throw new \Exception(
                'As workspace owner, you can publish content directly without approval.'
            );
        }

        // Check if approval workflow is enabled (check both is_active and is_enabled)
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow) {
            throw new \Exception(
                'No approval workflow found for this workspace.'
            );
        }
        
        $workflowEnabled = $workflow->is_enabled || $workflow->is_active;
        if (!$workflowEnabled) {
            throw new \Exception(
                'Approval workflow is not enabled for this workspace.'
            );
        }

        // Check publication status
        $allowedStatuses = ['draft', 'failed', 'rejected'];
        if (!in_array($publication->status, $allowedStatuses)) {
            throw new \Exception(
                'Only draft, failed, or rejected publications can be sent for review. Current status: ' . $publication->status
            );
        }

        Log::info('Publication can be sent to review', [
            'user_id' => $user->id,
            'publication_id' => $publication->id,
            'status' => $publication->status,
        ]);
    }

    /**
     * Get user's role in workspace.
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return Role|null
     */
    public function getUserRole(User $user, Workspace $workspace): ?Role
    {
        $workspaceUser = $user->workspaces()
            ->where('workspaces.id', $workspace->id)
            ->first();

        if (!$workspaceUser || !$workspaceUser->pivot->role_id) {
            return null;
        }

        return Role::find($workspaceUser->pivot->role_id);
    }

    /**
     * Check if user is owner of workspace.
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return bool
     */
    public function isOwner(User $user, Workspace $workspace): bool
    {
        $role = $this->getUserRole($user, $workspace);
        return $role && $role->slug === Role::OWNER;
    }
}
