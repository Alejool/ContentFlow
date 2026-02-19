<?php

namespace App\Observers;

use App\Models\Campaigns\CampaignAnalytics;
use App\Services\Cache\PublicationCacheService;
use App\Services\Cache\QueryCacheService;
use Illuminate\Support\Facades\Log;

/**
 * Observer for automatic cache invalidation on analytics changes
 */
class AnalyticsCacheObserver
{
    public function __construct(
        private PublicationCacheService $publicationCache,
        private QueryCacheService $queryCache
    ) {}

    /**
     * Handle the CampaignAnalytics "created" event.
     */
    public function created(CampaignAnalytics $analytics): void
    {
        $this->invalidateCache($analytics);
    }

    /**
     * Handle the CampaignAnalytics "updated" event.
     */
    public function updated(CampaignAnalytics $analytics): void
    {
        $this->invalidateCache($analytics);
    }

    /**
     * Invalidate related caches
     */
    private function invalidateCache(CampaignAnalytics $analytics): void
    {
        if ($analytics->publication_id) {
            // Invalidate publication stats cache
            $this->queryCache->invalidatePublication($analytics->publication_id);
            
            // Get publication to invalidate workspace cache
            $publication = $analytics->publication;
            if ($publication) {
                $this->queryCache->invalidateWorkspace($publication->workspace_id);
                
                Log::debug('Analytics cache invalidated', [
                    'analytics_id' => $analytics->id,
                    'publication_id' => $analytics->publication_id,
                    'workspace_id' => $publication->workspace_id,
                ]);
            }
        }
    }
}
