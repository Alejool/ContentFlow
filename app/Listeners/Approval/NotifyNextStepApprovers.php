<?php

namespace App\Listeners\Approval;

use App\Events\Approval\ApprovalStepCompleted;
use App\Notifications\PublicationAwaitingApprovalNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class NotifyNextStepApprovers
{
    /**
     * Handle the event when an approval step is completed.
     */
    public function handle(ApprovalStepCompleted $event): void
    {
        Log::info('NotifyNextStepApprovers: Event received', [
            'request_id' => $event->request->id,
            'completed_step_id' => $event->completedStep->id,
            'next_step_id' => $event->nextStep->id,
        ]);

        $request = $event->request;
        $nextStep = $event->nextStep;
        $publication = $request->publication;

        // CRITICAL: Load workflow relationship if not loaded
        if (!$nextStep->relationLoaded('workflow')) {
            $nextStep->load('workflow');
        }

        // Get all approvers for the next step
        $approvers = $nextStep->getApprovers();

        Log::info('NotifyNextStepApprovers: Checking next step configuration', [
            'next_step_id' => $nextStep->id,
            'next_step_name' => $nextStep->level_name,
            'next_step_number' => $nextStep->level_number,
            'has_users' => $nextStep->users()->exists(),
            'role_id' => $nextStep->role_id,
            'user_id' => $nextStep->user_id,
            'workflow_id' => $nextStep->approval_workflow_id,
            'workspace_id' => $nextStep->workflow?->workspace_id,
            'approver_count' => $approvers->count(),
            'approver_ids' => $approvers->pluck('id')->toArray(),
        ]);

        // Send notification to all approvers of the next step
        if ($approvers->isNotEmpty()) {
            Notification::send(
                $approvers,
                new PublicationAwaitingApprovalNotification(
                    $publication,
                    $nextStep->level_number
                )
            );
            
            Log::info('NotifyNextStepApprovers: Notifications sent', [
                'approver_count' => $approvers->count(),
                'next_step_number' => $nextStep->level_number,
            ]);
        } else {
            Log::warning('NotifyNextStepApprovers: No approvers found for next step', [
                'next_step_id' => $nextStep->id,
            ]);
        }
    }
}
