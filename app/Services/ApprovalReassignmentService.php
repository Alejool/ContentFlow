<?php

namespace App\Services;

use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\ApprovalLevel;
use App\Models\ApprovalAction;
use App\Models\ApprovalWorkflow;
use App\Models\Role\Role;
use App\Events\ApprovalTaskReassigned;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApprovalReassignmentService
{
    public function __construct(
        private RoleService $roleService
    ) {}

    /**
     * Detect and reassign approval tasks when a user's role changes
     * 
     * @param User $user The user whose role changed
     * @param Workspace $workspace The workspace context
     * @param Role $oldRole The previous role
     * @param Role $newRole The new role
     * 
     * @return int Number of approval tasks reassigned
     */
    public function handleRoleChange(
        User $user,
        Workspace $workspace,
        Role $oldRole,
        Role $newRole
    ): int {
        // Get workflow for workspace
        $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->first();

        if (!$workflow) {
            return 0;
        }

        // Find content pending approval where this user was the designated approver
        $pendingContent = $this->findPendingContentForUser($user, $workspace, $workflow, $oldRole);

        $reassignedCount = 0;

        foreach ($pendingContent as $content) {
            try {
                $this->reassignApprovalTask($content, $user, $workflow, $oldRole, $newRole);
                $reassignedCount++;
            } catch (\Exception $e) {
                Log::error('Failed to reassign approval task', [
                    'content_id' => $content->id,
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $reassignedCount;
    }

    /**
     * Reassign a specific approval task
     * 
     * @param Publication $content The content with pending approval
     * @param User $fromUser The user who lost approval permission
     * @param ApprovalWorkflow $workflow The approval workflow
     * @param Role $oldRole The old role
     * @param Role $newRole The new role
     * 
     * @return void
     */
    private function reassignApprovalTask(
        Publication $content,
        User $fromUser,
        ApprovalWorkflow $workflow,
        Role $oldRole,
        Role $newRole
    ): void {
        DB::transaction(function () use ($content, $fromUser, $workflow, $oldRole, $newRole) {
            $workspace = $content->workspace;
            $currentLevel = $content->current_approval_level;

            // Determine the required role for current level
            $requiredRole = $this->getRequiredRoleForLevel($workflow, $currentLevel);

            if (!$requiredRole) {
                Log::warning('No required role found for approval level', [
                    'content_id' => $content->id,
                    'level' => $currentLevel,
                ]);
                return;
            }

            // Find another user with the required role
            $newApprover = $this->findAlternativeApprover($workspace, $requiredRole, $fromUser);

            if (!$newApprover) {
                // No alternative approver found - log for admin notification
                Log::warning('No alternative approver found for reassignment', [
                    'content_id' => $content->id,
                    'workspace_id' => $workspace->id,
                    'required_role' => $requiredRole->name,
                    'level' => $currentLevel,
                ]);
                return;
            }

            // Log the reassignment in approval_actions
            $reason = "User role changed from {$oldRole->display_name} to {$newRole->display_name}";
            
            ApprovalAction::create([
                'content_id' => $content->id,
                'user_id' => $newApprover->id,
                'action_type' => 'reassigned',
                'approval_level' => $currentLevel,
                'comment' => $reason,
            ]);

            // Dispatch event for notifications
            event(new ApprovalTaskReassigned(
                $content,
                $fromUser,
                $newApprover,
                $reason,
                $currentLevel
            ));

            Log::info('Approval task reassigned', [
                'content_id' => $content->id,
                'from_user_id' => $fromUser->id,
                'to_user_id' => $newApprover->id,
                'reason' => $reason,
                'level' => $currentLevel,
            ]);
        });
    }

    /**
     * Find content pending approval for a specific user
     * 
     * @param User $user The user
     * @param Workspace $workspace The workspace
     * @param ApprovalWorkflow $workflow The workflow
     * @param Role $role The user's role
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function findPendingContentForUser(
        User $user,
        Workspace $workspace,
        ApprovalWorkflow $workflow,
        Role $role
    ): \Illuminate\Database\Eloquent\Collection {
        if ($workflow->is_multi_level) {
            // Multi-level workflow: find content at levels assigned to this role
            $levelNumbers = ApprovalLevel::where('approval_workflow_id', $workflow->id)
                ->where('role_id', $role->id)
                ->pluck('level_number')
                ->toArray();

            if (empty($levelNumbers)) {
                return collect();
            }

            return Publication::where('workspace_id', $workspace->id)
                ->where('status', Publication::STATUS_PENDING_REVIEW)
                ->whereIn('current_approval_level', $levelNumbers)
                ->get();
        } else {
            // Simple workflow: any content pending review if user had publish permission
            $hadPublishPermission = $role->permissions()
                ->where('name', 'publish_content')
                ->exists();

            if (!$hadPublishPermission) {
                return collect();
            }

            return Publication::where('workspace_id', $workspace->id)
                ->where('status', Publication::STATUS_PENDING_REVIEW)
                ->get();
        }
    }

    /**
     * Get the required role for a specific approval level
     * 
     * @param ApprovalWorkflow $workflow The workflow
     * @param int $level The approval level
     * 
     * @return Role|null
     */
    private function getRequiredRoleForLevel(ApprovalWorkflow $workflow, int $level): ?Role
    {
        if ($workflow->is_multi_level) {
            $approvalLevel = ApprovalLevel::where('approval_workflow_id', $workflow->id)
                ->where('level_number', $level)
                ->with('role')
                ->first();

            return $approvalLevel?->role;
        } else {
            // Simple workflow: any role with publish_content permission
            return Role::whereHas('permissions', function ($query) {
                $query->where('name', 'publish_content');
            })->first();
        }
    }

    /**
     * Find an alternative approver with the required role
     * 
     * @param Workspace $workspace The workspace
     * @param Role $requiredRole The required role
     * @param User $excludeUser User to exclude from search
     * 
     * @return User|null
     */
    private function findAlternativeApprover(
        Workspace $workspace,
        Role $requiredRole,
        User $excludeUser
    ): ?User {
        return User::select('users.*')
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->where('role_user.workspace_id', $workspace->id)
            ->where('role_user.role_id', $requiredRole->id)
            ->where('users.id', '!=', $excludeUser->id)
            ->first();
    }

    /**
     * Check if a user losing publish permission affects pending approvals
     * 
     * @param User $user The user
     * @param Workspace $workspace The workspace
     * 
     * @return int Number of affected content items
     */
    public function handlePublishPermissionLoss(User $user, Workspace $workspace): int
    {
        $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->first();

        if (!$workflow) {
            return 0;
        }

        // Get user's current role
        $rolePivot = DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (!$rolePivot) {
            return 0;
        }

        $currentRole = Role::find($rolePivot->role_id);

        if (!$currentRole) {
            return 0;
        }

        // Check if current role has publish permission
        $hasPublishPermission = $currentRole->permissions()
            ->where('name', 'publish_content')
            ->exists();

        if ($hasPublishPermission) {
            // User still has publish permission, no action needed
            return 0;
        }

        // Find pending content and reassign
        $pendingContent = Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PENDING_REVIEW)
            ->get();

        $affectedCount = 0;

        foreach ($pendingContent as $content) {
            try {
                // Create a dummy old role with publish permission for logging
                $oldRole = new Role(['name' => 'previous_role', 'display_name' => 'Previous Role']);
                
                $this->reassignApprovalTask($content, $user, $workflow, $oldRole, $currentRole);
                $affectedCount++;
            } catch (\Exception $e) {
                Log::error('Failed to handle publish permission loss', [
                    'content_id' => $content->id,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $affectedCount;
    }

    /**
     * Automatically advance content past a removed approval level
     * 
     * @param Workspace $workspace The workspace
     * @param int $removedLevelNumber The level number that was removed
     * 
     * @return int Number of content items advanced
     */
    public function advanceContentPastRemovedLevel(Workspace $workspace, int $removedLevelNumber): int
    {
        // Find all content currently at the removed level
        $affectedContent = Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PENDING_REVIEW)
            ->where('current_approval_level', $removedLevelNumber)
            ->get();

        $advancedCount = 0;

        foreach ($affectedContent as $content) {
            try {
                DB::transaction(function () use ($content, $removedLevelNumber) {
                    $workflow = ApprovalWorkflow::where('workspace_id', $content->workspace_id)->first();

                    if (!$workflow) {
                        return;
                    }

                    // Get the new max level after removal
                    $maxLevel = $workflow->getMaxLevel();

                    if ($removedLevelNumber > $maxLevel) {
                        // The removed level was the last level, mark as approved
                        $content->status = Publication::STATUS_APPROVED;
                        $content->approved_at = now();
                        $content->current_approval_level = 0;
                    } else {
                        // Advance to the next level
                        $content->current_approval_level = $removedLevelNumber;
                    }

                    $content->save();

                    // Log the automatic advancement
                    $reason = "Approval level {$removedLevelNumber} was removed from workflow configuration";
                    
                    ApprovalAction::create([
                        'content_id' => $content->id,
                        'user_id' => null, // System action
                        'action_type' => 'auto_advanced',
                        'approval_level' => $removedLevelNumber,
                        'comment' => $reason,
                    ]);

                    Log::info('Content automatically advanced past removed level', [
                        'content_id' => $content->id,
                        'removed_level' => $removedLevelNumber,
                        'new_status' => $content->status,
                        'new_level' => $content->current_approval_level,
                    ]);
                });

                $advancedCount++;
            } catch (\Exception $e) {
                Log::error('Failed to auto-advance content past removed level', [
                    'content_id' => $content->id,
                    'removed_level' => $removedLevelNumber,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $advancedCount;
    }

    /**
     * Handle approval level removal by advancing affected content
     * 
     * @param ApprovalWorkflow $workflow The workflow
     * @param array $oldLevels Array of old level numbers before removal
     * @param array $newLevels Array of new level numbers after removal
     * 
     * @return int Number of content items advanced
     */
    public function handleLevelRemoval(
        ApprovalWorkflow $workflow,
        array $oldLevels,
        array $newLevels
    ): int {
        // Find which levels were removed
        $removedLevels = array_diff($oldLevels, $newLevels);

        $totalAdvanced = 0;

        foreach ($removedLevels as $removedLevel) {
            $advanced = $this->advanceContentPastRemovedLevel(
                $workflow->workspace,
                $removedLevel
            );
            $totalAdvanced += $advanced;
        }

        return $totalAdvanced;
    }
}
