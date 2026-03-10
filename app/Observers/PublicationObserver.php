<?php

namespace App\Observers;

use App\Models\Publications\Publication;
use App\Services\Usage\UsageTrackingService;
use Illuminate\Support\Facades\Cache;

class PublicationObserver
{
    public function __construct(
        private UsageTrackingService $usageTracking
    ) {}

    /**
     * Track when a publication is created with published or scheduled status directly.
     */
    public function created(Publication $publication): void
    {
        // Only count publications that are immediately active or scheduled
        // Draft creations do NOT count against the plan limit
        // Note: 'publishing' is NOT counted here because the actual post
        // hasn't been created yet. The WorkspaceUsageService will handle that.
        if (in_array($publication->status, ['published', 'scheduled'])) {
            $workspace = $publication->workspace;
            if ($workspace) {
                $this->clearPublicationCache($workspace->id);
            }
        }
    }

    /**
     * Track when a publication's status changes to/from active states.
     */
    public function updated(Publication $publication): void
    {
        $workspace = $publication->workspace;
        if (!$workspace) {
            \Log::warning('PublicationObserver: No workspace found', [
                'publication_id' => $publication->id
            ]);
            return;
        }

        $originalStatus = $publication->getOriginal('status');
        $newStatus      = $publication->status;

        \Log::info('PublicationObserver: Status change detected', [
            'publication_id' => $publication->id,
            'workspace_id' => $workspace->id,
            'original_status' => $originalStatus,
            'new_status' => $newStatus
        ]);

        $activeStatuses = ['published', 'scheduled'];

        if ($originalStatus !== $newStatus) {
            $wasActive = in_array($originalStatus, $activeStatuses);
            $isActive  = in_array($newStatus, $activeStatuses);

            \Log::info('PublicationObserver: Checking if notification needed', [
                'publication_id' => $publication->id,
                'was_active' => $wasActive,
                'is_active' => $isActive,
                'should_notify' => $wasActive !== $isActive,
                'note' => 'publishing status is NOT counted as active to avoid premature notifications'
            ]);

            // Status moved into or out of active states
            // Note: 'publishing' is NOT in activeStatuses because the actual post
            // hasn't been created yet. The WorkspaceUsageService will notify when
            // the SocialPostLog is created successfully.
            if ($wasActive !== $isActive) {
                $this->clearPublicationCache($workspace->id);
                
                \Log::info('PublicationObserver: Dispatching WebSocket notification', [
                    'publication_id' => $publication->id,
                    'workspace_id' => $workspace->id,
                    'action' => $isActive ? 'publication_published' : 'publication_unpublished'
                ]);
                
                // Notify via WebSocket about publication count change
                $this->notifyPublicationUsageUpdated($workspace, $wasActive, $isActive);
            }
        }
    }

    /**
     * Track when a publication is deleted — clear count cache.
     */
    public function deleted(Publication $publication): void
    {
        $workspace = $publication->workspace;
        if (!$workspace) {
            return;
        }

        // Only notify if the publication was in an active state
        // Note: 'publishing' is NOT counted as active
        if (in_array($publication->status, ['published', 'scheduled'])) {
            $this->clearPublicationCache($workspace->id);
            
            // Notify via WebSocket about publication deletion
            $this->notifyPublicationUsageUpdated($workspace, true, false);
        }
    }

    private function clearPublicationCache(int $workspaceId): void
    {
        Cache::forget("workspace.{$workspaceId}.publications.active_count");
        Cache::forget("workspace.{$workspaceId}.publications.current_plan_usage");
    }

    /**
     * Notify workspace about publication usage updates via WebSocket.
     */
    private function notifyPublicationUsageUpdated($workspace, bool $wasActive, bool $isActive): void
    {
        $notificationService = app(\App\Services\Subscription\UsageLimitsNotificationService::class);
        
        $action = $isActive ? 'publication_published' : 'publication_unpublished';
        $notificationService->notifyLimitsUpdated($workspace, $action);
    }
}
