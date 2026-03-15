<?php

namespace App\Services\Approval;

use App\Models\Publications\Publication;
use App\Models\Approval\ApprovalRequest;
use App\Models\ApprovalLevel;
use App\Models\Logs\ApprovalLog;
use App\Models\ApprovalWorkflow;
use App\Models\User;
use App\Events\Approval\ApprovalRequestSubmitted;
use App\Events\Approval\ApprovalStepCompleted;
use App\Events\Approval\ApprovalRequestCompleted;
use App\Events\Approval\ApprovalRequestRejected;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ApprovalWorkflowEngine
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    private const CACHE_TTL = 3600;

    /**
     * Submit publication for approval
     * 
     * @param Publication $publication
     * @param User $submitter
     * @return ApprovalRequest
     * @throws \Exception
     */
    public function submitForApproval(Publication $publication, User $submitter): ApprovalRequest
    {
        $workflow = $publication->workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_enabled) {
            throw new \Exception('Approval workflow not enabled for this workspace');
        }

        return DB::transaction(function () use ($publication, $submitter, $workflow) {
            // Cancel any previous pending approval requests
            ApprovalRequest::where('publication_id', $publication->id)
                ->where('status', ApprovalRequest::STATUS_PENDING)
                ->update([
                    'status' => ApprovalRequest::STATUS_CANCELLED,
                    'completed_at' => now(),
                    'metadata' => DB::raw("jsonb_set(COALESCE(metadata, '{}'), '{cancelled_reason}', '\"Resubmitted for approval\"')")
                ]);
            
            Log::info('Cancelled previous pending approval requests', [
                'publication_id' => $publication->id,
            ]);
            
            // Get first step
            $firstStep = $workflow->levels()->orderBy('level_number')->first();
            
            if (!$firstStep) {
                throw new \Exception('Workflow has no steps configured');
            }

            // Create approval request
            $request = ApprovalRequest::create([
                'publication_id' => $publication->id,
                'workflow_id' => $workflow->id,
                'current_step_id' => $firstStep->id,
                'status' => ApprovalRequest::STATUS_PENDING,
                'submitted_by' => $submitter->id,
                'submitted_at' => now(),
                'metadata' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ],
            ]);

            // Create initial log entry
            ApprovalLog::create([
                'approval_request_id' => $request->id,
                'approval_step_id' => null,
                'user_id' => $submitter->id,
                'action' => ApprovalLog::ACTION_SUBMITTED,
                'level_number' => 0,
                'comment' => 'Publication submitted for approval',
                'metadata' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ],
            ]);

            // Update publication status
            $publication->update([
                'status' => Publication::STATUS_PENDING_REVIEW,
                'current_approval_level' => $firstStep->level_number,
                'current_approval_step_id' => $firstStep->id,
                'submitted_for_approval_at' => now(),
            ]);

            // Clear cache
            $this->clearApprovalCache($publication->workspace_id);

            // Dispatch event
            event(new ApprovalRequestSubmitted($request, $submitter));

            Log::info('Publication submitted for approval', [
                'publication_id' => $publication->id,
                'request_id' => $request->id,
                'workflow_id' => $workflow->id,
                'first_step_id' => $firstStep->id,
            ]);

            // Auto-approve steps where submitter is assigned
            $request = $this->autoApproveSubmitterSteps($request, $submitter);

            return $request->load(['currentStep.role', 'workflow', 'submitter']);
        });
    }

    /**
     * Auto-approve steps where the submitter is assigned as approver
     * 
     * @param ApprovalRequest $request
     * @param User $submitter
     * @return ApprovalRequest
     */
    private function autoApproveSubmitterSteps(ApprovalRequest $request, User $submitter): ApprovalRequest
    {
        $maxIterations = 10; // Prevent infinite loops
        $iteration = 0;

        while ($request->isPending() && $iteration < $maxIterations) {
            $iteration++;
            
            // Check if submitter can approve current step
            if (!$this->canApprove($submitter, $request)) {
                // Submitter cannot approve this step, stop auto-approval
                Log::info('Auto-approval stopped - submitter cannot approve current step', [
                    'request_id' => $request->id,
                    'current_step' => $request->current_step_id,
                    'submitter_id' => $submitter->id,
                ]);
                break;
            }

            $currentStep = $request->currentStep;
            
            Log::info('Auto-approving step for submitter', [
                'request_id' => $request->id,
                'step_id' => $currentStep->id,
                'step_number' => $currentStep->level_number,
                'submitter_id' => $submitter->id,
            ]);

            // Create auto-approval log entry
            ApprovalLog::create([
                'approval_request_id' => $request->id,
                'approval_step_id' => $currentStep->id,
                'user_id' => $submitter->id,
                'action' => ApprovalLog::ACTION_AUTO_ADVANCED,
                'level_number' => $currentStep->level_number,
                'comment' => 'Auto-approved: Submitter is assigned to this approval level',
                'metadata' => [
                    'auto_approved' => true,
                    'reason' => 'submitter_is_approver',
                ],
            ]);

            // Check if there are more steps
            $nextStep = $request->workflow->levels()
                ->where('level_number', '>', $currentStep->level_number)
                ->orderBy('level_number')
                ->first();

            if ($nextStep) {
                // Move to next step
                $request->update([
                    'current_step_id' => $nextStep->id,
                ]);

                $request->publication->update([
                    'current_approval_level' => $nextStep->level_number,
                    'current_approval_step_id' => $nextStep->id,
                ]);

                Log::info('Auto-approval advanced to next step', [
                    'request_id' => $request->id,
                    'from_step' => $currentStep->level_number,
                    'to_step' => $nextStep->level_number,
                ]);

                // Dispatch event for step completion
                event(new ApprovalStepCompleted($request, $currentStep, $nextStep));

                // Refresh request to get updated step
                $request = $request->fresh();
            } else {
                // No more steps - final approval
                $request->update([
                    'status' => ApprovalRequest::STATUS_APPROVED,
                    'current_step_id' => null,
                    'completed_at' => now(),
                    'completed_by' => $submitter->id,
                ]);

                $request->publication->update([
                    'status' => Publication::STATUS_APPROVED,
                    'approved_at' => now(),
                    'approved_by' => $submitter->id,
                    'current_approval_level' => null,
                    'current_approval_step_id' => null,
                ]);

                Log::info('Auto-approval completed - all steps approved', [
                    'request_id' => $request->id,
                    'publication_id' => $request->publication_id,
                ]);

                event(new ApprovalRequestCompleted($request));
                break;
            }
        }

        if ($iteration >= $maxIterations) {
            Log::warning('Auto-approval stopped - max iterations reached', [
                'request_id' => $request->id,
                'iterations' => $iteration,
            ]);
        }

        return $request;
    }

    /**
     * Approve at current step
     * 
     * @param ApprovalRequest $request
     * @param User $approver
     * @param string|null $comment
     * @return ApprovalRequest
     * @throws \Exception
     */
    public function approve(ApprovalRequest $request, User $approver, ?string $comment = null): ApprovalRequest
    {
        if (!$request->isPending()) {
            throw new \Exception('Approval request is not pending');
        }

        if (!$this->canApprove($approver, $request)) {
            throw new \Exception('User does not have permission to approve at this step');
        }

        return DB::transaction(function () use ($request, $approver, $comment) {
            $currentStep = $request->currentStep;
            
            // Create approval log entry
            ApprovalLog::create([
                'approval_request_id' => $request->id,
                'approval_step_id' => $currentStep->id,
                'user_id' => $approver->id,
                'action' => ApprovalLog::ACTION_APPROVED,
                'level_number' => $currentStep->level_number,
                'comment' => $comment,
                'metadata' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ],
            ]);

            // Check if there are more steps
            $nextStep = $request->workflow->levels()
                ->where('level_number', '>', $currentStep->level_number)
                ->orderBy('level_number')
                ->first();

            if ($nextStep) {
                // Move to next step
                $request->update([
                    'current_step_id' => $nextStep->id,
                ]);

                $request->publication->update([
                    'current_approval_level' => $nextStep->level_number,
                    'current_approval_step_id' => $nextStep->id,
                ]);

                Log::info('Approval request advanced to next step', [
                    'request_id' => $request->id,
                    'from_step' => $currentStep->level_number,
                    'to_step' => $nextStep->level_number,
                ]);

                event(new ApprovalStepCompleted($request, $currentStep, $nextStep));
            } else {
                // Final approval - complete the request
                $request->update([
                    'status' => ApprovalRequest::STATUS_APPROVED,
                    'current_step_id' => null,
                    'completed_at' => now(),
                    'completed_by' => $approver->id,
                ]);

                $request->publication->update([
                    'status' => Publication::STATUS_APPROVED,
                    'approved_at' => now(),
                    'current_approval_level' => null,
                    'current_approval_step_id' => null,
                ]);

                Log::info('Approval request completed', [
                    'request_id' => $request->id,
                    'publication_id' => $request->publication_id,
                ]);

                event(new ApprovalRequestCompleted($request));
            }

            // Clear cache
            $this->clearApprovalCache($request->publication->workspace_id);

            return $request->fresh()->load(['currentStep.role', 'workflow', 'submitter', 'publication']);
        });
    }

    /**
     * Reject at current step
     * 
     * @param ApprovalRequest $request
     * @param User $rejector
     * @param string $reason
     * @return ApprovalRequest
     * @throws \Exception
     */
    public function reject(ApprovalRequest $request, User $rejector, string $reason): ApprovalRequest
    {
        if (!$request->isPending()) {
            throw new \Exception('Approval request is not pending');
        }

        if (!$this->canApprove($rejector, $request)) {
            throw new \Exception('User does not have permission to reject at this step');
        }

        return DB::transaction(function () use ($request, $rejector, $reason) {
            $currentStep = $request->currentStep;
            
            // Create rejection log entry
            ApprovalLog::create([
                'approval_request_id' => $request->id,
                'approval_step_id' => $currentStep->id,
                'user_id' => $rejector->id,
                'action' => ApprovalLog::ACTION_REJECTED,
                'level_number' => $currentStep->level_number,
                'comment' => $reason,
                'metadata' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ],
            ]);

            // Update request status
            $request->update([
                'status' => ApprovalRequest::STATUS_REJECTED,
                'current_step_id' => null,
                'completed_at' => now(),
                'completed_by' => $rejector->id,
                'rejection_reason' => $reason,
            ]);

            // Update publication status
            $request->publication->update([
                'status' => Publication::STATUS_REJECTED,
                'rejected_at' => now(),
                'rejection_reason' => $reason,
                'current_approval_level' => null,
                'current_approval_step_id' => null,
            ]);

            Log::info('Approval request rejected', [
                'request_id' => $request->id,
                'publication_id' => $request->publication_id,
                'rejected_at_level' => $currentStep->level_number,
                'rejected_by' => $rejector->id,
            ]);

            // Clear cache
            $this->clearApprovalCache($request->publication->workspace_id);

            event(new ApprovalRequestRejected($request, $reason));

            return $request->fresh()->load(['currentStep.role', 'workflow', 'submitter', 'publication']);
        });
    }

    /**
     * Check if user can approve at current step
     * 
     * @param User $user
     * @param ApprovalRequest $request
     * @return bool
     */
    public function canApprove(User $user, ApprovalRequest $request): bool
    {
        if (!$request->isPending()) {
            return false;
        }

        $currentStep = $request->currentStep;
        
        if (!$currentStep) {
            return false;
        }

        // Check if user is directly assigned to this step
        if ($currentStep->user_id === $user->id) {
            return true;
        }

        // Check if user is in the step's user list
        if ($currentStep->users()->where('users.id', $user->id)->exists()) {
            return true;
        }

        // Check if user has the role assigned to this step
        if ($currentStep->role_id) {
            $hasRole = DB::table('role_user')
                ->where('user_id', $user->id)
                ->where('role_id', $currentStep->role_id)
                ->where('workspace_id', $request->publication->workspace_id)
                ->exists();
            
            if ($hasRole) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get pending approval requests for a user
     * 
     * @param User $user
     * @param int $workspaceId
     * @param string $type 'to_approve' (default) or 'my_requests'
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPendingRequestsForUser(User $user, int $workspaceId, string $type = 'to_approve')
    {
        $query = ApprovalRequest::with([
            'publication.mediaFiles',
            'publication.user',
            'workflow.levels',
            'currentStep.role',
            'currentStep.user',
            'submitter',
            'logs.user',
        ])
        ->whereHas('publication', function ($query) use ($workspaceId) {
            $query->where('workspace_id', $workspaceId);
        })
        ->where('status', ApprovalRequest::STATUS_PENDING);

        // If type is 'my_requests', show only requests submitted by the user
        if ($type === 'my_requests') {
            $query->where('submitted_by', $user->id);
        } else {
            // Default: show requests the user can approve (not their own)
            $query->where('submitted_by', '!=', $user->id)
                ->whereHas('currentStep', function ($q) use ($user, $workspaceId) {
                    // User is directly assigned
                    $q->where('user_id', $user->id)
                        // OR user is in the step's user list
                        ->orWhereHas('users', function ($userQuery) use ($user) {
                            $userQuery->where('users.id', $user->id);
                        })
                        // OR user has the role assigned to this step
                        ->orWhereHas('role', function ($roleQuery) use ($user, $workspaceId) {
                            $roleQuery->whereHas('users', function ($userRoleQuery) use ($user, $workspaceId) {
                                $userRoleQuery->where('users.id', $user->id)
                                    ->where('role_user.workspace_id', $workspaceId);
                            });
                        });
                });
        }

        return $query->orderBy('submitted_at', 'desc')->get();
    }

    /**
     * Get approval history for a publication
     * 
     * @param Publication $publication
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getApprovalHistory(Publication $publication)
    {
        return ApprovalRequest::with([
            'workflow',
            'submitter',
            'completedBy',
            'logs.user',
            'logs.approvalStep',
        ])
        ->where('publication_id', $publication->id)
        ->orderBy('submitted_at', 'desc')
        ->get();
    }

    /**
     * Clear approval cache for workspace
     * 
     * @param int $workspaceId
     */
    private function clearApprovalCache(int $workspaceId): void
    {
        Cache::forget("approval_workflow_{$workspaceId}");
        Cache::forget("pending_approvals_workspace_{$workspaceId}");
    }
}
