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
     * CRITICAL RULES:
     * - When NO workflow is active: Admin and Owner can publish directly
     * - When workflow IS active: ONLY Owner can publish directly (Admin must use workflow)
     * - All other roles must always send to review
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return bool
     */
    public function canPublishDirectly(User $user, Workspace $workspace): bool
    {
        // Get user's role
        $role = $this->getUserRole($user, $workspace);
        
        if (!$role) {
            return false;
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        $workflowEnabled = $workflow && $workflow->is_enabled;

        if ($workflowEnabled) {
            // When workflow is ENABLED: ONLY Owner can publish directly
            return $role->slug === Role::OWNER;
        } else {
            // When NO workflow: Both Admin and Owner can publish directly
            return in_array($role->slug, [Role::ADMIN, Role::OWNER]);
        }
    }

    /**
     * Determine if a user must send content to review.
     * 
     * CRITICAL RULES:
     * - When NO workflow is active: Only Admin and Owner can publish directly, others must review
     * - When workflow IS active: Only Owner can publish directly, everyone else (including Admin) must review
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return bool
     */
    public function mustSendToReview(User $user, Workspace $workspace): bool
    {
        // Get user's role
        $role = $this->getUserRole($user, $workspace);
        
        if (!$role) {
            return true; // No role = must review
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        $workflowEnabled = $workflow && $workflow->is_enabled;

        if ($workflowEnabled) {
            // When workflow is ENABLED: Only Owner can bypass, everyone else must review (including Admin)
            return $role->slug !== Role::OWNER;
        } else {
            // When NO workflow: Admin and Owner can publish directly, others must review
            $isAdminOrOwner = in_array($role->slug, [Role::ADMIN, Role::OWNER]);
            return !$isAdminOrOwner;
        }
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
     * CRITICAL RULE: When NO multi-level workflow is active:
     * - ONLY Admin and Owner can publish directly
     * - All other roles must send to review
     * 
     * @param Publication $publication
     * @param User $user
     * @throws \Exception
     */
    public function validateCanPublish(Publication $publication, User $user): void
    {
        $workspace = $publication->workspace;
        $role = $this->getUserRole($user, $workspace);

        if (!$role) {
            throw new \Exception('User has no role in this workspace.');
        }

        // Check if user is Admin or Owner - they can publish directly
        $isAdminOrOwner = in_array($role->slug, [Role::ADMIN, Role::OWNER]);
        if ($isAdminOrOwner) {
            Log::info('User can publish directly (Admin or Owner)', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'publication_id' => $publication->id,
                'role' => $role->slug,
            ]);
            return;
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_enabled) {
            // CRITICAL: When NO workflow is active, ONLY Admin and Owner can publish
            throw new \Exception(
                'Only Admin and Owner can publish content directly. Please send your content to review.'
            );
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
     * CRITICAL RULES:
     * - When NO workflow is active:
     *   - Admin and Owner should publish directly (not use review) - PERO permitimos que lo hagan si quieren
     *   - All other roles MUST send to review (no pueden publicar directamente)
     * - When workflow IS active:
     *   - Admin and Owner can choose to publish directly OR send to review
     *   - All other roles must send to review
     * 
     * @param Publication $publication
     * @param User $user
     * @throws \Exception
     */
    public function validateCanRequestReview(Publication $publication, User $user): void
    {
        $workspace = $publication->workspace;
        $role = $this->getUserRole($user, $workspace);

        if (!$role) {
            throw new \Exception('User has no role in this workspace.');
        }

        // Check if approval workflow is enabled
        $workflow = $workspace->approvalWorkflow;
        $workflowEnabled = $workflow && $workflow->is_enabled;

        // CAMBIO CRÍTICO: Permitir que TODOS los roles envíen a revisión
        // Esto es necesario porque:
        // 1. Cuando NO hay workflow: roles no-admin/owner DEBEN enviar a revisión
        // 2. Cuando SÍ hay workflow: todos pueden enviar a revisión
        // 3. Admin/Owner pueden elegir publicar directamente O enviar a revisión
        
        Log::info('Validating can request review', [
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'role' => $role->slug,
            'workflow_enabled' => $workflowEnabled,
        ]);

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
            'role' => $role->slug,
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
