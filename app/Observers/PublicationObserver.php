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
        if (in_array($publication->status, ['published', 'scheduled', 'publishing'])) {
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
            return;
        }

        $originalStatus = $publication->getOriginal('status');
        $newStatus      = $publication->status;

        $activeStatuses = ['published', 'scheduled', 'publishing'];

        if ($originalStatus !== $newStatus) {
            $wasActive = in_array($originalStatus, $activeStatuses);
            $isActive  = in_array($newStatus, $activeStatuses);

            // Status moved into or out of active states — clear cache so next read is fresh
            if ($wasActive !== $isActive) {
                $this->clearPublicationCache($workspace->id);
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

        if (in_array($publication->status, ['published', 'scheduled', 'publishing'])) {
            $this->clearPublicationCache($workspace->id);
        }
    }

    private function clearPublicationCache(int $workspaceId): void
    {
        Cache::forget("workspace.{$workspaceId}.publications.active_count");
    }
}
