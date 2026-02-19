<?php

namespace App\Services\Cache;

use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * Intelligent caching service for publications
 * Implements three caching strategies:
 * 1. Metadata caching for frequently accessed publications
 * 2. Social API response caching
 * 3. Query caching for aggregated statistics
 */
class PublicationCacheService
{
    private const CACHE_PREFIX = 'publication:';
    private const METADATA_TTL = 3600; // 1 hour
    private const STATS_TTL = 1800; // 30 minutes
    private const LIST_TTL = 600; // 10 minutes
    private const FREQUENT_ACCESS_THRESHOLD = 5; // Track after 5 accesses

    /**
     * Get publication with metadata from cache
     * Tracks access frequency for intelligent caching
     */
    public function getPublication(int $publicationId, bool $withRelations = true): ?Publication
    {
        // Track access frequency
        $this->trackAccess($publicationId);
        
        $cacheKey = $this->getCacheKey('full', $publicationId);
        
        return Cache::remember($cacheKey, self::METADATA_TTL, function () use ($publicationId, $withRelations) {
            $query = Publication::query();
            
            if ($withRelations) {
                $query->with(['media', 'user', 'workspace', 'mediaFiles', 'analytics']);
            }
            
            return $query->find($publicationId);
        });
    }
    
    /**
     * Track publication access frequency
     */
    private function trackAccess(int $publicationId): void
    {
        $key = $this->getCacheKey('access_count', $publicationId);
        $count = Cache::increment($key);
        
        // Set expiry on first access
        if ($count === 1) {
            Cache::put($key, 1, now()->addDay());
        }
        
        // Mark as frequently accessed
        if ($count >= self::FREQUENT_ACCESS_THRESHOLD) {
            $this->markAsFrequent($publicationId);
        }
    }
    
    /**
     * Mark publication as frequently accessed
     */
    private function markAsFrequent(int $publicationId): void
    {
        $key = 'publications:frequent';
        Redis::zadd($key, time(), $publicationId);
        Redis::expire($key, 86400); // 24 hours
    }
    
    /**
     * Get frequently accessed publications
     */
    public function getFrequentlyAccessed(int $limit = 20): array
    {
        $key = 'publications:frequent';
        $ids = Redis::zrevrange($key, 0, $limit - 1);
        
        if (empty($ids)) {
            return [];
        }
        
        return array_map('intval', $ids);
    }

    /**
     * Get publication metadata only (lightweight)
     */
    public function getMetadata(int $publicationId): ?array
    {
        $cacheKey = $this->getCacheKey('metadata', $publicationId);
        
        return Cache::remember($cacheKey, self::METADATA_TTL, function () use ($publicationId) {
            $publication = Publication::find($publicationId);
            
            if (!$publication) {
                return null;
            }
            
            return [
                'id' => $publication->id,
                'title' => $publication->title,
                'status' => $publication->status,
                'scheduled_at' => $publication->scheduled_at,
                'published_at' => $publication->published_at,
                'platforms' => $publication->platforms->pluck('name')->toArray(),
                'media_count' => $publication->media()->count(),
            ];
        });
    }

    /**
     * Get publication statistics with caching
     */
    public function getStats(int $publicationId): array
    {
        $cacheKey = $this->getCacheKey('stats', $publicationId);
        
        return Cache::remember($cacheKey, self::STATS_TTL, function () use ($publicationId) {
            $publication = Publication::find($publicationId);
            
            if (!$publication) {
                return [];
            }
            
            return [
                'views' => $publication->analytics()->sum('views') ?? 0,
                'likes' => $publication->analytics()->sum('likes') ?? 0,
                'comments' => $publication->analytics()->sum('comments') ?? 0,
                'shares' => $publication->analytics()->sum('shares') ?? 0,
                'engagement_rate' => $this->calculateEngagementRate($publication),
            ];
        });
    }

    /**
     * Get frequently accessed publications list
     */
    public function getFrequentPublications(int $workspaceId, int $limit = 10): array
    {
        $cacheKey = $this->getCacheKey('frequent', $workspaceId);
        
        return Cache::remember($cacheKey, self::LIST_TTL, function () use ($workspaceId, $limit) {
            return Publication::where('workspace_id', $workspaceId)
                ->where('status', 'published')
                ->orderBy('updated_at', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
        });
    }

    /**
     * Invalidate publication cache
     */
    public function invalidate(int $publicationId): void
    {
        $keys = [
            $this->getCacheKey('full', $publicationId),
            $this->getCacheKey('metadata', $publicationId),
            $this->getCacheKey('stats', $publicationId),
        ];
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        
        Log::info('Publication cache invalidated', ['publication_id' => $publicationId]);
    }

    /**
     * Invalidate workspace publications list cache
     */
    public function invalidateWorkspace(int $workspaceId): void
    {
        Cache::forget($this->getCacheKey('frequent', $workspaceId));
        Log::info('Workspace publications cache invalidated', ['workspace_id' => $workspaceId]);
    }

    /**
     * Warm up cache for a publication
     */
    public function warmUp(int $publicationId): void
    {
        $this->getPublication($publicationId);
        $this->getMetadata($publicationId);
        $this->getStats($publicationId);
        
        Log::info('Publication cache warmed up', ['publication_id' => $publicationId]);
    }

    /**
     * Preload frequently accessed publications into cache
     */
    public function preloadFrequent(int $workspaceId): int
    {
        $frequentIds = $this->getFrequentlyAccessed(50);
        $loaded = 0;
        
        foreach ($frequentIds as $id) {
            $publication = Publication::find($id);
            if ($publication && $publication->workspace_id === $workspaceId) {
                $this->warmUp($id);
                $loaded++;
            }
        }
        
        Log::info('Preloaded frequent publications', [
            'workspace_id' => $workspaceId,
            'count' => $loaded
        ]);
        
        return $loaded;
    }
    
    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        $frequentIds = $this->getFrequentlyAccessed(100);
        
        return [
            'frequent_publications' => count($frequentIds),
            'cache_driver' => config('cache.default'),
            'ttl' => [
                'metadata' => self::METADATA_TTL,
                'stats' => self::STATS_TTL,
                'list' => self::LIST_TTL,
            ],
        ];
    }
    
    /**
     * Get cache key
     */
    private function getCacheKey(string $type, int|string $id): string
    {
        return self::CACHE_PREFIX . "{$type}:{$id}";
    }

    /**
     * Calculate engagement rate
     */
    private function calculateEngagementRate(Publication $publication): float
    {
        $analytics = $publication->analytics()->first();
        
        if (!$analytics || !$analytics->views) {
            return 0.0;
        }
        
        $engagements = ($analytics->likes ?? 0) + ($analytics->comments ?? 0) + ($analytics->shares ?? 0);
        
        return round(($engagements / $analytics->views) * 100, 2);
    }
}
