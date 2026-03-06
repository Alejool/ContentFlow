<?php

namespace App\Observers;

use App\Models\MediaFiles\MediaFile;
use App\Services\Usage\UsageTrackingService;
use Illuminate\Support\Facades\Log;

class MediaFileObserver
{
    public function __construct(
        private UsageTrackingService $usageTracking
    ) {}

    public function created(MediaFile $mediaFile): void
    {
        $workspace = $mediaFile->workspace;

        if (!$workspace || !$mediaFile->size) {
            return;
        }

        // Track storage in bytes (the UsageTrackingService handles the limit in bytes)
        $this->usageTracking->incrementUsage($workspace, 'storage_bytes', (int) $mediaFile->size);

        Log::info("Storage usage incremented for workspace {$workspace->id}", [
            'workspace_id'   => $workspace->id,
            'media_file_id'  => $mediaFile->id,
            'file_size_bytes' => $mediaFile->size,
        ]);
    }

    public function deleted(MediaFile $mediaFile): void
    {
        $workspace = $mediaFile->workspace;

        if (!$workspace || !$mediaFile->size) {
            return;
        }

        $this->usageTracking->decrementUsage($workspace, 'storage_bytes', (int) $mediaFile->size);

        Log::info("Storage usage decremented for workspace {$workspace->id}", [
            'workspace_id'   => $workspace->id,
            'media_file_id'  => $mediaFile->id,
            'file_size_bytes' => $mediaFile->size,
        ]);
    }
}
