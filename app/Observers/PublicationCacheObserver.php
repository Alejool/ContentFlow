<?php

namespace App\Observers;

use App\Models\Publications\Publication;
use App\Services\Cache\PublicationCacheService;
use App\Services\Cache\QueryCacheService;
use Illuminate\Support\Facades\Log;

/**
 * Observer for automatic cache invalidation on publication changes
 */
class PublicationCacheObserver
{
    public function __construct(
        private PublicationCacheService $publicationCache,
        private QueryCacheService $queryCache
    ) {}

    /**
     * Handle the Publication "updated" event.
     */
    public function updated(Publication $publication): void
    {
        $this->invalidateCache($publication);
        
        Log::debug('Publication cache invalidated on update', [
            'publication_id' => $publication->id
        ]);
    }

    /**
     * Handle the Publication "deleted" event.
     */
    public function deleted(Publication $publication): void
    {
        $this->invalidateCache($publication);
        
        Log::debug('Publication cache invalidated on delete', [
            'publication_id' => $publication->id
        ]);
    }

    /**
     * Handle the Publication "saved" event (covers create and update).
     */
    public function saved(Publication $publication): void
    {
        // Only invalidate workspace cache on status changes
        if ($publication->wasChanged('status')) {
            $this->publicationCache->invalidateWorkspace($publication->workspace_id);
            $this->queryCache->invalidateWorkspace($publication->workspace_id);
            
            Log::debug('Workspace cache invalidated on publication status change', [
                'publication_id' => $publication->id,
                'workspace_id' => $publication->workspace_id,
                'old_status' => $publication->getOriginal('status'),
                'new_status' => $publication->status,
            ]);
        }
    }

    /**
     * Invalidate all related caches
     */
    private function invalidateCache(Publication $publication): void
    {
        $this->publicationCache->invalidate($publication->id);
        $this->queryCache->invalidatePublication($publication->id);
        
        // Invalidate workspace cache if publication is published
        if ($publication->status === 'published') {
            $this->publicationCache->invalidateWorkspace($publication->workspace_id);
            $this->queryCache->invalidateWorkspace($publication->workspace_id);
        }
    }
}
