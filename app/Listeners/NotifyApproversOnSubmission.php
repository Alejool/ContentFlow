<?php

namespace App\Listeners;

use App\Events\ContentSubmittedForApproval;
use App\Notifications\PublicationAwaitingApprovalNotification;
use App\Services\RoleService;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class NotifyApproversOnSubmission
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /**
     * Handle the event when content is submitted for approval.
     */
    public function handle(ContentSubmittedForApproval $event): void
    {
        Log::info('NotifyApproversOnSubmission: Event received', [
            'content_id' => $event->content->id,
            'submitter_id' => $event->submitter->id,
        ]);

        $content = $event->content;
        $workspace = $content->workspace;
        $workflow = $workspace->approvalWorkflow;

        if (!$workflow || !$workflow->is_enabled) {
            Log::warning('NotifyApproversOnSubmission: Workflow not enabled', [
                'workspace_id' => $workspace->id,
                'has_workflow' => !!$workflow,
                'is_enabled' => $workflow?->is_enabled,
            ]);
            return;
        }

        // Get the current approval level
        $currentLevel = $content->current_approval_level;
        $approvalLevel = $workflow->getLevelByNumber($currentLevel);

        if (!$approvalLevel) {
            Log::warning('NotifyApproversOnSubmission: Approval level not found', [
                'workspace_id' => $workspace->id,
                'current_level' => $currentLevel,
            ]);
            return;
        }

        Log::info('NotifyApproversOnSubmission: Found approval level', [
            'level_number' => $approvalLevel->level_number,
            'level_name' => $approvalLevel->level_name,
            'role_id' => $approvalLevel->role_id,
        ]);

        // Get all approvers for this level
        $approvers = $approvalLevel->getApprovers();

        Log::info('NotifyApproversOnSubmission: Found approvers', [
            'approver_count' => $approvers->count(),
            'approver_ids' => $approvers->pluck('id')->toArray(),
        ]);

        // Send notification to all approvers
        if ($approvers->isNotEmpty()) {
            Notification::send(
                $approvers,
                new PublicationAwaitingApprovalNotification(
                    $content,
                    $currentLevel
                )
            );
            
            Log::info('NotifyApproversOnSubmission: Notifications sent', [
                'approver_count' => $approvers->count(),
            ]);
        } else {
            Log::warning('NotifyApproversOnSubmission: No approvers found');
        }
    }
}
