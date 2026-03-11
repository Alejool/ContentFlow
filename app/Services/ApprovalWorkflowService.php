<?php

namespace App\Services;

use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\ApprovalAction;
use App\Models\Role\Role;
use App\Models\Permission\Permission;
use App\DTOs\ApprovalStatus;
use App\Exceptions\ApprovalWorkflowNotEnabledException;
use App\Exceptions\InvalidContentStatusException;
use App\Exceptions\InsufficientPermissionsException;
use App\Exceptions\InvalidApprovalStateException;
use App\Exceptions\InvalidWorkflowConfigurationException;
use App\Events\ContentSubmittedForApproval;
use App\Events\ContentApproved;
use App\Events\ContentRejected;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class ApprovalWorkflowService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    private const CACHE_TTL = 3600;

    public function __construct(
        private RoleService $roleService
    ) {}

    /**
     * Get cache key for workflow configuration
     */
    private function getWorkflowCacheKey(int $workspaceId): string
    {
        return "workflow:workspace_{$workspaceId}";
    }

    /**
     * Get workflow configuration from cache or database
     */
    private function getWorkflowCached(int $workspaceId): ?ApprovalWorkflow
    {
        $cacheKey = $this->getWorkflowCacheKey($workspaceId);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($workspaceId) {
            return ApprovalWorkflow::with(['levels.role'])
                ->where('workspace_id', $workspaceId)
                ->first();
        });
    }

    /**
     * Invalidate workflow cache for a workspace (public method for external use)
     */
    public function invalidateCache(int $workspaceId): void
    {
        $this->invalidateWorkflowCache($workspaceId);
    }

    /**
     * Invalidate workflow cache for a workspace
     */
    private function invalidateWorkflowCache(int $workspaceId): void
    {
        $cacheKey = $this->getWorkflowCacheKey($workspaceId);
        Cache::forget($cacheKey);
    }

    /**
     * Submit content for approval
     * 
     * @param Publication $content The content to submit
     * @param User $submitter The user submitting the content
     * 
     * @return ApprovalAction The created approval action
     * 
     * @throws ApprovalWorkflowNotEnabledException
     * @throws InvalidContentStatusException
     */
    public function submitForApproval(Publication $content, User $submitter): ApprovalAction
    {
        // Get workspace and workflow (cached)
        $workspace = $content->workspace;
        $workflow = $this->getWorkflowCached($workspace->id);

        // Validate workflow is enabled
        if (!$workflow || !$workflow->is_enabled) {
            throw new ApprovalWorkflowNotEnabledException();
        }

        // Validate content is in draft or rejected status
        if (!in_array($content->status, [Publication::STATUS_DRAFT, 'rejected'])) {
            throw new InvalidContentStatusException(
                "Content must be in draft or rejected status to submit for approval. Current status: {$content->status}"
            );
        }

        return DB::transaction(function () use ($content, $submitter, $workflow) {
            // Set status to pending_review
            $content->status = Publication::STATUS_PENDING_REVIEW;
            $content->submitted_for_approval_at = now();

            // Set current_approval_level based on workflow type
            if ($workflow->is_multi_level) {
                // Multi-level workflow: start at level 1
                $content->current_approval_level = 1;
            } else {
                // Simple workflow: set to 0 (any admin can approve)
                $content->current_approval_level = 0;
            }

            $content->save();

            // Create ApprovalAction record
            $approvalAction = ApprovalAction::create([
                'content_id' => $content->id,
                'user_id' => $submitter->id,
                'action_type' => ApprovalAction::ACTION_SUBMITTED,
                'approval_level' => $content->current_approval_level,
                'comment' => null,
            ]);

            // Dispatch event
            event(new ContentSubmittedForApproval($content, $submitter));

            return $approvalAction;
        });
    }

    /**
     * Approve content at current level
     * 
     * @param Publication $content The content to approve
     * @param User $approver The user approving the content
     * @param string|null $comment Optional comment
     * 
     * @return ApprovalAction The created approval action
     * 
     * @throws InsufficientPermissionsException
     * @throws InvalidApprovalStateException
     */
    public function approveContent(
        Publication $content,
        User $approver,
        ?string $comment = null
    ): ApprovalAction {
        // Validate content is in pending_review status
        if ($content->status !== Publication::STATUS_PENDING_REVIEW) {
            throw new InvalidApprovalStateException(
                "Content must be in pending_review status to approve. Current status: {$content->status}"
            );
        }

        // Get workspace and workflow
        $workspace = $content->workspace;
        $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)->first();

        if (!$workflow || !$workflow->is_enabled) {
            throw new InvalidApprovalStateException("Approval workflow is not enabled.");
        }

        // Validate user has permission to approve at current level
        $this->validateApprovalPermission($approver, $workspace, $workflow, $content->current_approval_level);

        return DB::transaction(function () use ($content, $approver, $comment, $workflow) {
            $currentLevel = $content->current_approval_level;

            if ($workflow->is_multi_level) {
                // Multi-level workflow: check if this is the final level
                $maxLevel = $workflow->getMaxLevel();

                if ($currentLevel >= $maxLevel) {
                    // Final level: set status to approved
                    $content->status = Publication::STATUS_APPROVED;
                    $content->approved_at = now();
                } else {
                    // Advance to next level
                    $content->current_approval_level = $currentLevel + 1;
                }
            } else {
                // Simple workflow: set status to approved
                $content->status = Publication::STATUS_APPROVED;
                $content->approved_at = now();
            }

            $content->save();

            // Create ApprovalAction record
            $approvalAction = ApprovalAction::create([
                'content_id' => $content->id,
                'user_id' => $approver->id,
                'action_type' => ApprovalAction::ACTION_APPROVED,
                'approval_level' => $currentLevel,
                'comment' => $comment,
            ]);

            // Dispatch event
            event(new ContentApproved($content, $approver, $currentLevel, $comment));

            return $approvalAction;
        });
    }

    /**
     * Reject content and return to creator
     * 
     * @param Publication $content The content to reject
     * @param User $approver The user rejecting the content
     * @param string $reason The reason for rejection
     * 
     * @return ApprovalAction The created approval action
     * 
     * @throws InsufficientPermissionsException
     * @throws InvalidApprovalStateException
     */
    public function rejectContent(
        Publication $content,
        User $approver,
        string $reason
    ): ApprovalAction {
        // Validate content is in pending_review status
        if ($content->status !== Publication::STATUS_PENDING_REVIEW) {
            throw new InvalidApprovalStateException(
                "Content must be in pending_review status to reject. Current status: {$content->status}"
            );
        }

        // Get workspace and workflow (cached)
        $workspace = $content->workspace;
        $workflow = $this->getWorkflowCached($workspace->id);

        if (!$workflow || !$workflow->is_enabled) {
            throw new InvalidApprovalStateException("Approval workflow is not enabled.");
        }

        // Validate user has permission to reject at current level
        $this->validateApprovalPermission($approver, $workspace, $workflow, $content->current_approval_level);

        return DB::transaction(function () use ($content, $approver, $reason) {
            $currentLevel = $content->current_approval_level;

            // Set status to rejected
            $content->status = 'rejected';
            $content->rejected_at = now();
            $content->rejected_by = $approver->id;
            $content->rejection_reason = $reason;

            // Reset current_approval_level to 0
            $content->current_approval_level = 0;

            $content->save();

            // Create ApprovalAction record
            $approvalAction = ApprovalAction::create([
                'content_id' => $content->id,
                'user_id' => $approver->id,
                'action_type' => ApprovalAction::ACTION_REJECTED,
                'approval_level' => $currentLevel,
                'comment' => $reason,
            ]);

            // Dispatch event
            event(new ContentRejected($content, $approver, $reason, $currentLevel));

            return $approvalAction;
        });
    }

    /**
     * Get current approval status for content
     * 
     * @param Publication $content The content to get status for
     * 
     * @return ApprovalStatus The approval status value object
     */
    public function getApprovalStatus(Publication $content): ApprovalStatus
    {
        // Optimized: Eager load user relationship to avoid N+1 query
        $lastAction = ApprovalAction::where('content_id', $content->id)
            ->with('user:id,name')
            ->latest('created_at')
            ->first();

        // Determine next approver role if pending
        $nextApproverRole = null;
        if ($content->status === Publication::STATUS_PENDING_REVIEW) {
            $nextApproverRole = $this->getNextApproverRole($content);
        }

        return new ApprovalStatus(
            status: $content->status,
            currentLevel: $content->current_approval_level,
            nextApproverRole: $nextApproverRole,
            lastAction: $lastAction?->action_type,
            lastActionAt: $lastAction?->created_at,
            lastActionBy: $lastAction?->user?->name
        );
    }

    /**
     * Get approval history for content
     * 
     * @param Publication $content The content to get history for
     * 
     * @return Collection Collection of approval actions with relationships
     */
    public function getApprovalHistory(Publication $content): Collection
    {
        // Optimized: Eager load only necessary user fields and roles
        return ApprovalAction::where('content_id', $content->id)
            ->with([
                'user:id,name,email',
                'user.roles' => function ($query) use ($content) {
                    $query->select('roles.id', 'roles.name', 'roles.display_name')
                        ->wherePivot('workspace_id', $content->workspace_id);
                }
            ])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Configure multi-level workflow
     * 
     * @param Workspace $workspace The workspace to configure
     * @param array $levels Array of ['level' => int, 'name' => string, 'role' => string]
     * 
     * @return ApprovalWorkflow The configured workflow
     * 
     * @throws InvalidWorkflowConfigurationException
     */
    public function configureMultiLevelWorkflow(
        Workspace $workspace,
        array $levels
    ): ApprovalWorkflow {
        // Validate levels array structure
        if (empty($levels)) {
            throw new InvalidWorkflowConfigurationException("At least one approval level is required.");
        }

        if (count($levels) > 5) {
            throw new InvalidWorkflowConfigurationException("Maximum of 5 approval levels allowed.");
        }

        // Validate sequential numbering
        $levelNumbers = array_column($levels, 'level');
        sort($levelNumbers);
        $expectedNumbers = range(1, count($levels));
        
        if ($levelNumbers !== $expectedNumbers) {
            throw new InvalidWorkflowConfigurationException("Approval levels must be numbered sequentially starting from 1.");
        }

        // Validate no duplicate roles
        $roleNames = array_column($levels, 'role');
        if (count($roleNames) !== count(array_unique($roleNames))) {
            throw new InvalidWorkflowConfigurationException("Each role can only be assigned to one approval level.");
        }

        // Validate each role has approval_participant=true
        foreach ($roleNames as $roleName) {
            $role = Role::where('name', $roleName)->first();
            
            if (!$role) {
                throw new InvalidWorkflowConfigurationException("Role '{$roleName}' not found.");
            }

            if (!$role->approval_participant) {
                throw new InvalidWorkflowConfigurationException("Role '{$roleName}' cannot participate in approval workflows.");
            }
        }

        // Check if any content is currently pending
        $pendingContent = Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PENDING_REVIEW)
            ->exists();

        if ($pendingContent) {
            throw new InvalidWorkflowConfigurationException("Cannot modify approval levels while content is pending review.");
        }

        return DB::transaction(function () use ($workspace, $levels) {
            // Get or create workflow
            $workflow = ApprovalWorkflow::firstOrCreate(
                ['workspace_id' => $workspace->id],
                [
                    'is_enabled' => true,
                    'is_multi_level' => true,
                ]
            );

            // Update workflow to multi-level
            $workflow->is_multi_level = true;
            $workflow->save();

            // Delete existing levels
            ApprovalLevel::where('approval_workflow_id', $workflow->id)->delete();

            // Create new levels
            foreach ($levels as $levelData) {
                $role = Role::where('name', $levelData['role'])->first();

                ApprovalLevel::create([
                    'approval_workflow_id' => $workflow->id,
                    'level_number' => $levelData['level'],
                    'level_name' => $levelData['name'],
                    'role_id' => $role->id,
                ]);
            }

            // Invalidate cache after configuration changes
            $this->invalidateWorkflowCache($workspace->id);

            return $workflow->fresh(['levels']);
        });
    }

    /**
     * Check if content can be published
     * 
     * @param Publication $content The content to check
     * @param User $user The user attempting to publish
     * 
     * @return bool True if the content can be published
     */
    public function canPublish(Publication $content, User $user): bool
    {
        $workspace = $content->workspace;

        // Check if user is Owner (bypass approval)
        $userRole = $this->getUserRole($user, $workspace);
        if ($userRole && $userRole->name === Role::OWNER) {
            return true;
        }

        // Check if user has publish_content permission
        $hasPublishPermission = $this->roleService->userHasPermission(
            $user,
            $workspace,
            Permission::PUBLISH_CONTENT
        );

        if (!$hasPublishPermission) {
            return false;
        }

        // Check if workflow is enabled (cached)
        $workflow = $this->getWorkflowCached($workspace->id);

        if (!$workflow || !$workflow->is_enabled) {
            // Workflow not enabled, user with publish permission can publish
            return true;
        }

        // Workflow is enabled: content must be approved
        return $content->status === Publication::STATUS_APPROVED;
    }

    /**
     * Validate that a user has permission to approve/reject at a specific level
     * 
     * @param User $user The user to validate
     * @param Workspace $workspace The workspace context
     * @param ApprovalWorkflow $workflow The approval workflow
     * @param int $level The approval level
     * 
     * @throws InsufficientPermissionsException
     */
    private function validateApprovalPermission(
        User $user,
        Workspace $workspace,
        ApprovalWorkflow $workflow,
        int $level
    ): void {
        // Get user's role in workspace
        $userRole = $this->getUserRole($user, $workspace);

        if (!$userRole) {
            throw new InsufficientPermissionsException("You do not have a role in this workspace.");
        }

        // Owner can always approve
        if ($userRole->name === Role::OWNER) {
            return;
        }

        if ($workflow->is_multi_level) {
            // Use cached workflow with eager-loaded levels and roles
            $approvalLevel = $workflow->levels->firstWhere('level_number', $level);

            if (!$approvalLevel) {
                throw new InsufficientPermissionsException("Approval level {$level} not found.");
            }

            if ($userRole->id !== $approvalLevel->role_id) {
                throw new InsufficientPermissionsException(
                    "You do not have permission to approve at this level. Required role: {$approvalLevel->role->display_name}"
                );
            }
        } else {
            // Simple workflow: user must have publish_content permission
            $hasPublishPermission = $this->roleService->userHasPermission(
                $user,
                $workspace,
                Permission::PUBLISH_CONTENT
            );

            if (!$hasPublishPermission) {
                throw new InsufficientPermissionsException("You do not have permission to approve content.");
            }
        }
    }

    /**
     * Get the next approver role for pending content
     * 
     * @param Publication $content The content to check
     * 
     * @return string|null The role name or null
     */
    private function getNextApproverRole(Publication $content): ?string
    {
        $workspace = $content->workspace;
        $workflow = $this->getWorkflowCached($workspace->id);

        if (!$workflow || !$workflow->is_enabled) {
            return null;
        }

        if ($workflow->is_multi_level) {
            // Use cached workflow with eager-loaded levels and roles
            $approvalLevel = $workflow->levels->firstWhere('level_number', $content->current_approval_level);

            return $approvalLevel?->role?->display_name;
        } else {
            // Simple workflow: any admin can approve
            return 'Admin';
        }
    }

    /**
     * Get user's role in a workspace
     * 
     * @param User $user The user
     * @param Workspace $workspace The workspace
     * 
     * @return Role|null The role or null
     */
    private function getUserRole(User $user, Workspace $workspace): ?Role
    {
        $rolePivot = DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (!$rolePivot) {
            return null;
        }

        return Role::find($rolePivot->role_id);
    }
}
