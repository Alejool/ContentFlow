<?php

namespace App\Services\Approval;

use App\Models\Publications\Publication;
use App\Models\Approval\ApprovalRequest;
use App\Models\ApprovalLevel;
use App\Models\ApprovalAction;
use App\Models\Approval\ApprovalStepApproval;
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
            // CRITICAL: Cancel any previous pending approval requests
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

            // Create initial action
            ApprovalAction::create([
                'request_id' => $request->id,
                'content_id' => $publication->id,
                'step_id' => null,
                'user_id' => $submitter->id,
                'action_type' => 'submitted',
                'approval_level' => 0,
                'metadata' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ],
            ]);

            // Create pending approvals for first step
            $this->createPendingApprovalsForStep($request, $firstStep);

            // Update publication status
            $publication->update([
                'status' => Publication::STATUS_PENDING_REVIEW,
                'current_approval_level' => $firstStep->level_number,
                'current_approval_step_id' => $firstStep->id, // CRITICAL: Set initial step ID
                'submitted_for_approval_at' => now(),
                'submitted_for_approval_by' => $submitter->id, // CRITICAL: Track who submitted
            ]);

            Log::info('Approval request submitted', [
                'request_id' => $request->id,
                'publication_id' => $publication->id,
                'workflow_id' => $workflow->id,
                'first_step_id' => $firstStep->id,
                'submitted_by' => $submitter->id,
            ]);

            // Dispatch event
            event(new ApprovalRequestSubmitted($request, $submitter));

            return $request->fresh(['currentStep', 'workflow']);
        });
    }

    /**
     * Approve at current step
     * 
     * @param ApprovalRequest $request
     * @param User $approver
     * @param string|null $comment
     * @return ApprovalAction
     * @throws \Exception
     */
    public function approve(
        ApprovalRequest $request,
        User $approver,
        ?string $comment = null
    ): ApprovalAction {
        if (!$request->isPending()) {
            throw new \Exception('Request is not pending approval');
        }

        $currentStep = $request->currentStep;
        
        if (!$currentStep) {
            throw new \Exception('No current step found');
        }

        // Validate approver has permission
        $this->validateApprover($approver, $request, $currentStep);

        return DB::transaction(function () use ($request, $currentStep, $approver, $comment) {
            // Record individual approval
            $stepApproval = ApprovalStepApproval::where([
                'request_id' => $request->id,
                'step_id' => $currentStep->id,
                'user_id' => $approver->id,
            ])->firstOrFail();

            $stepApproval->update([
                'status' => ApprovalStepApproval::STATUS_APPROVED,
                'comment' => $comment,
                'approved_at' => now(),
            ]);

            // Create action record
            $action = ApprovalAction::create([
                'request_id' => $request->id,
                'content_id' => $request->publication_id,
                'step_id' => $currentStep->id,
                'user_id' => $approver->id,
                'action_type' => 'approved',
                'approval_level' => $currentStep->level_number,
                'comment' => $comment,
                'metadata' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ],
            ]);

            Log::info('Step approval recorded', [
                'request_id' => $request->id,
                'step_id' => $currentStep->id,
                'user_id' => $approver->id,
                'step_approval_id' => $stepApproval->id,
            ]);

            // Check if step is complete
            if ($this->isStepComplete($request, $currentStep)) {
                $this->completeStep($request, $currentStep, $approver);
            }

            return $action;
        });
    }

    /**
     * Reject at current step
     * 
     * @param ApprovalRequest $request
     * @param User $rejector
     * @param string $reason
     * @return ApprovalAction
     * @throws \Exception
     */
    public function reject(
        ApprovalRequest $request,
        User $rejector,
        string $reason
    ): ApprovalAction {
        if (!$request->isPending()) {
            throw new \Exception('Request is not pending approval');
        }

        $currentStep = $request->currentStep;
        
        if (!$currentStep) {
            throw new \Exception('No current step found');
        }

        // Validate rejector has permission
        $this->validateApprover($rejector, $request, $currentStep);

        return DB::transaction(function () use ($request, $currentStep, $rejector, $reason) {
            // Update request
            $request->update([
                'status' => ApprovalRequest::STATUS_REJECTED,
                'current_step_id' => null,
                'rejection_reason' => $reason,
                'completed_at' => now(),
                'completed_by' => $rejector->id,
            ]);

            // Create action record
            $action = ApprovalAction::create([
                'request_id' => $request->id,
                'content_id' => $request->publication_id,
                'step_id' => $currentStep->id,
                'user_id' => $rejector->id,
                'action_type' => 'rejected',
                'approval_level' => $currentStep->level_number,
                'comment' => $reason,
                'metadata' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ],
            ]);

            // Update publication
            $request->publication->update([
                'status' => 'rejected',
                'current_approval_level' => 0,
                'current_approval_step_id' => null, // Clear step ID when rejected
                'rejected_at' => now(),
                'rejected_by' => $rejector->id,
                'rejection_reason' => $reason,
            ]);

            Log::info('Approval request rejected', [
                'request_id' => $request->id,
                'step_id' => $currentStep->id,
                'rejected_by' => $rejector->id,
                'reason' => $reason,
            ]);

            // Dispatch event
            event(new ApprovalRequestRejected($request, $rejector, $reason));

            return $action;
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

        // Check if user has pending approval for this step
        return ApprovalStepApproval::where([
            'request_id' => $request->id,
            'step_id' => $currentStep->id,
            'user_id' => $user->id,
            'status' => ApprovalStepApproval::STATUS_PENDING,
        ])->exists();
    }

    /**
     * Get approval status with detailed info
     * 
     * @param ApprovalRequest $request
     * @return array
     */
    public function getApprovalStatus(ApprovalRequest $request): array
    {
        $workflow = $request->workflow;
        $currentStep = $request->currentStep;
        
        $steps = $workflow->levels()->orderBy('level_number')->get()->map(function ($step) use ($request) {
            $approvals = ApprovalStepApproval::where([
                'request_id' => $request->id,
                'step_id' => $step->id,
            ])->with('user')->get();

            $isCurrentStep = $request->current_step_id === $step->id;
            $isPastStep = $request->current_step_id && 
                $step->level_number < $request->currentStep->level_number;

            return [
                'id' => $step->id,
                'order' => $step->level_number,
                'name' => $step->level_name,
                'description' => $step->description,
                'is_current' => $isCurrentStep,
                'is_past' => $isPastStep,
                'is_future' => !$isCurrentStep && !$isPastStep,
                'status' => $this->getStepStatus($approvals),
                'approvals' => $approvals->map(fn($a) => [
                    'user' => [
                        'id' => $a->user->id,
                        'name' => $a->user->name,
                        'photo_url' => $a->user->photo_url,
                    ],
                    'status' => $a->status,
                    'comment' => $a->comment,
                    'approved_at' => $a->approved_at?->toIso8601String(),
                ]),
                'required_approvals' => $step->require_all_users 
                    ? $approvals->count() 
                    : 1,
                'completed_approvals' => $approvals->where('status', ApprovalStepApproval::STATUS_APPROVED)->count(),
            ];
        });

        return [
            'request_id' => $request->id,
            'status' => $request->status,
            'current_step' => $currentStep ? [
                'id' => $currentStep->id,
                'order' => $currentStep->level_number,
                'name' => $currentStep->level_name,
            ] : null,
            'steps' => $steps,
            'submitted_by' => [
                'id' => $request->submitter->id,
                'name' => $request->submitter->name,
            ],
            'submitted_at' => $request->submitted_at->toIso8601String(),
            'completed_at' => $request->completed_at?->toIso8601String(),
        ];
    }

    /**
     * Private helper methods
     */

    private function validateApprover(User $user, ApprovalRequest $request, ApprovalLevel $step): void
    {
        // Check if user is in the step's approvers list
        $hasPermission = ApprovalStepApproval::where([
            'request_id' => $request->id,
            'step_id' => $step->id,
            'user_id' => $user->id,
            'status' => ApprovalStepApproval::STATUS_PENDING,
        ])->exists();

        if (!$hasPermission) {
            throw new \Exception('User does not have permission to approve at this step');
        }
    }

    private function createPendingApprovalsForStep(
        ApprovalRequest $request,
        ApprovalLevel $step
    ): void {
        $approvers = $step->getApprovers();

        if ($approvers->isEmpty()) {
            throw new \Exception('Step has no approvers configured');
        }

        foreach ($approvers as $approver) {
            ApprovalStepApproval::create([
                'request_id' => $request->id,
                'step_id' => $step->id,
                'user_id' => $approver->id,
                'status' => ApprovalStepApproval::STATUS_PENDING,
            ]);
        }

        Log::info('Created pending approvals for step', [
            'request_id' => $request->id,
            'step_id' => $step->id,
            'approvers_count' => $approvers->count(),
        ]);
    }

    private function isStepComplete(ApprovalRequest $request, ApprovalLevel $step): bool
    {
        $approvals = ApprovalStepApproval::where([
            'request_id' => $request->id,
            'step_id' => $step->id,
        ])->get();

        if ($step->require_all_users) {
            // All users must approve
            $isComplete = $approvals->every(fn($a) => $a->status === ApprovalStepApproval::STATUS_APPROVED);
        } else {
            // At least one user must approve
            $isComplete = $approvals->contains(fn($a) => $a->status === ApprovalStepApproval::STATUS_APPROVED);
        }

        Log::info('Step completion check', [
            'request_id' => $request->id,
            'step_id' => $step->id,
            'require_all' => $step->require_all_users,
            'total_approvals' => $approvals->count(),
            'approved_count' => $approvals->where('status', ApprovalStepApproval::STATUS_APPROVED)->count(),
            'is_complete' => $isComplete,
        ]);

        return $isComplete;
    }

    private function completeStep(
        ApprovalRequest $request,
        ApprovalLevel $step,
        User $approver
    ): void {
        // Get next step
        $nextStep = ApprovalLevel::where('approval_workflow_id', $step->approval_workflow_id)
            ->where('level_number', '>', $step->level_number)
            ->orderBy('level_number')
            ->first();

        if ($nextStep) {
            // Advance to next step
            $request->update([
                'current_step_id' => $nextStep->id,
            ]);

            $request->publication->update([
                'current_approval_level' => $nextStep->level_number,
                'current_approval_step_id' => $nextStep->id, // CRITICAL: Update step ID for pending approvals list
            ]);

            // Create pending approvals for next step
            $this->createPendingApprovalsForStep($request, $nextStep);

            Log::info('Advanced to next step', [
                'request_id' => $request->id,
                'from_step' => $step->id,
                'to_step' => $nextStep->id,
                'publication_id' => $request->publication_id,
            ]);

            // Dispatch event
            event(new ApprovalStepCompleted($request, $step, $nextStep));
        } else {
            // Final step completed - approve request
            $request->update([
                'status' => ApprovalRequest::STATUS_APPROVED,
                'current_step_id' => null,
                'completed_at' => now(),
                'completed_by' => $approver->id,
            ]);

            $request->publication->update([
                'status' => Publication::STATUS_APPROVED,
                'current_approval_level' => 0,
                'current_approval_step_id' => null, // Clear step ID when approved
                'approved_at' => now(),
                'approved_by' => $approver->id,
            ]);

            Log::info('Approval request completed', [
                'request_id' => $request->id,
                'completed_by' => $approver->id,
            ]);

            // Auto-publish if configured
            if ($request->workflow->auto_publish_on_final_approval) {
                Log::info('Auto-publish triggered', [
                    'request_id' => $request->id,
                    'publication_id' => $request->publication_id,
                ]);
                // Dispatch publish job
                // \App\Jobs\PublishContent::dispatch($request->publication);
            }

            // Dispatch event
            event(new ApprovalRequestCompleted($request, $approver));
        }
    }

    private function getStepStatus($approvals): string
    {
        if ($approvals->isEmpty()) {
            return 'pending';
        }

        if ($approvals->contains(fn($a) => $a->status === ApprovalStepApproval::STATUS_REJECTED)) {
            return 'rejected';
        }

        if ($approvals->every(fn($a) => $a->status === ApprovalStepApproval::STATUS_APPROVED)) {
            return 'approved';
        }

        if ($approvals->contains(fn($a) => $a->status === ApprovalStepApproval::STATUS_APPROVED)) {
            return 'partially_approved';
        }

        return 'pending';
    }
}
