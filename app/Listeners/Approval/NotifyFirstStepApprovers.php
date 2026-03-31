<?php

namespace App\Listeners\Approval;

use App\Events\Approval\ApprovalRequestSubmitted;
use App\Notifications\PublicationAwaitingApprovalNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class NotifyFirstStepApprovers
{
    /**
     * Handle the event when an approval request is submitted.
     */
    public function handle(ApprovalRequestSubmitted $event): void
    {
        Log::info('NotifyFirstStepApprovers: Event received', [
            'request_id' => $event->request->id,
            'submitter_id' => $event->submitter->id,
        ]);

        $request = $event->request;
        $publication = $request->publication;
        $currentStep = $request->currentStep;

        if (!$currentStep) {
            Log::warning('NotifyFirstStepApprovers: No current step found', [
                'request_id' => $request->id,
            ]);
            return;
        }

        // Get all approvers for the first step
        $approvers = $currentStep->getApprovers();

        Log::info('NotifyFirstStepApprovers: Found approvers for first step', [
            'step_id' => $currentStep->id,
            'step_name' => $currentStep->level_name,
            'step_number' => $currentStep->level_number,
            'approver_count' => $approvers->count(),
            'approver_ids' => $approvers->pluck('id')->toArray(),
        ]);

        // Send notification to all approvers of the first step
        if ($approvers->isNotEmpty()) {
            Notification::send(
                $approvers,
                new PublicationAwaitingApprovalNotification(
                    $publication,
                    $currentStep->level_number
                )
            );
            
            Log::info('NotifyFirstStepApprovers: Notifications sent', [
                'approver_count' => $approvers->count(),
                'step_number' => $currentStep->level_number,
            ]);
        } else {
            Log::warning('NotifyFirstStepApprovers: No approvers found for first step', [
                'step_id' => $currentStep->id,
            ]);
        }
    }
}
