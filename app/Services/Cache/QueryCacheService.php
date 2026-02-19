<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Query caching service for aggregated statistics
 * Caches expensive database queries to improve performance
 */
class QueryCacheService
{
    private const CACHE_PREFIX = 'query:';
    private const DEFAULT_TTL = 1800; // 30 minutes
    private const STATS_TTL = 3600; // 1 hour for aggregated stats
    
    /**
     * Cache workspace statistics
     */
    public function getWorkspaceStats(int $workspaceId): array
    {
        $cacheKey = $this->getCacheKey('workspace_stats', $workspaceId);
        
        return Cache::remember($cacheKey, self::STATS_TTL, function () use ($workspaceId) {
            return [
                'total_publications' => DB::table('publications')
                    ->where('workspace_id', $workspaceId)
                    ->count(),
                    
                'published_count' => DB::table('publications')
                    ->where('workspace_id', $workspaceId)
                    ->where('status', 'published')
                    ->count(),
                    
                'draft_count' => DB::table('publications')
                    ->where('workspace_id', $workspaceId)
                    ->where('status', 'draft')
                    ->count(),
                    
                'scheduled_count' => DB::table('publications')
                    ->where('workspace_id', $workspaceId)
                    ->where('status', 'scheduled')
                    ->count(),
                    
                'total_views' => DB::table('campaign_analytics')
                    ->join('publications', 'campaign_analytics.publication_id', '=', 'publications.id')
                    ->where('publications.workspace_id', $workspaceId)
                    ->sum('campaign_analytics.views'),
                    
                'total_engagement' => DB::table('campaign_analytics')
                    ->join('publications', 'campaign_analytics.publication_id', '=', 'publications.id')
                    ->where('publications.workspace_id', $workspaceId)
                    ->sum(DB::raw('campaign_analytics.likes + campaign_analytics.comments + campaign_analytics.shares')),
            ];
        });
    }

    /**
     * Cache publication performance metrics
     */
    public function getPublicationPerformance(int $publicationId): array
    {
        $cacheKey = $this->getCacheKey('publication_performance', $publicationId);
        
        return Cache::remember($cacheKey, self::DEFAULT_TTL, function () use ($publicationId) {
            $analytics = DB::table('campaign_analytics')
                ->where('publication_id', $publicationId)
                ->select([
                    DB::raw('SUM(views) as total_views'),
                    DB::raw('SUM(clicks) as total_clicks'),
                    DB::raw('SUM(likes) as total_likes'),
                    DB::raw('SUM(comments) as total_comments'),
                    DB::raw('SUM(shares) as total_shares'),
                    DB::raw('AVG(engagement_rate) as avg_engagement_rate'),
                ])
                ->first();
                
            return [
                'views' => $analytics->total_views ?? 0,
                'clicks' => $analytics->total_clicks ?? 0,
                'likes' => $analytics->total_likes ?? 0,
                'comments' => $analytics->total_comments ?? 0,
                'shares' => $analytics->total_shares ?? 0,
                'engagement_rate' => round($analytics->avg_engagement_rate ?? 0, 2),
                'total_engagement' => ($analytics->total_likes ?? 0) + 
                                     ($analytics->total_comments ?? 0) + 
                                     ($analytics->total_shares ?? 0),
            ];
        });
    }
    
    /**
     * Cache platform performance comparison
     */
    public function getPlatformPerformance(int $workspaceId, ?string $dateRange = null): array
    {
        $cacheKey = $this->getCacheKey('platform_performance', "{$workspaceId}:{$dateRange}");
        
        return Cache::remember($cacheKey, self::DEFAULT_TTL, function () use ($workspaceId, $dateRange) {
            $query = DB::table('social_post_logs')
                ->join('publications', 'social_post_logs.publication_id', '=', 'publications.id')
                ->where('publications.workspace_id', $workspaceId)
                ->where('social_post_logs.status', 'success');
                
            if ($dateRange) {
                $dates = $this->parseDateRange($dateRange);
                $query->whereBetween('social_post_logs.published_at', $dates);
            }
            
            return $query->select([
                    'social_post_logs.platform',
                    DB::raw('COUNT(*) as post_count'),
                    DB::raw('COUNT(DISTINCT social_post_logs.publication_id) as publication_count'),
                ])
                ->groupBy('social_post_logs.platform')
                ->get()
                ->keyBy('platform')
                ->toArray();
        });
    }
    
    /**
     * Cache top performing publications
     */
    public function getTopPublications(int $workspaceId, int $limit = 10, string $metric = 'views'): array
    {
        $cacheKey = $this->getCacheKey('top_publications', "{$workspaceId}:{$metric}:{$limit}");
        
        return Cache::remember($cacheKey, self::STATS_TTL, function () use ($workspaceId, $limit, $metric) {
            $validMetrics = ['views', 'clicks', 'likes', 'comments', 'shares', 'engagement_rate'];
            
            if (!in_array($metric, $validMetrics)) {
                $metric = 'views';
            }
            
            return DB::table('publications')
                ->join('campaign_analytics', 'publications.id', '=', 'campaign_analytics.publication_id')
                ->where('publications.workspace_id', $workspaceId)
                ->where('publications.status', 'published')
                ->select([
                    'publications.id',
                    'publications.title',
                    'publications.published_at',
                    DB::raw("SUM(campaign_analytics.{$metric}) as total_{$metric}"),
                ])
                ->groupBy('publications.id', 'publications.title', 'publications.published_at')
                ->orderByDesc("total_{$metric}")
                ->limit($limit)
                ->get()
                ->toArray();
        });
    }
    
    /**
     * Cache time-series analytics data
     */
    public function getTimeSeriesAnalytics(int $workspaceId, string $period = 'daily', int $days = 30): array
    {
        $cacheKey = $this->getCacheKey('timeseries', "{$workspaceId}:{$period}:{$days}");
        
        return Cache::remember($cacheKey, self::DEFAULT_TTL, function () use ($workspaceId, $period, $days) {
            $dateFormat = match($period) {
                'hourly' => 'Y-m-d H:00:00',
                'daily' => 'Y-m-d',
                'weekly' => 'Y-W',
                'monthly' => 'Y-m',
                default => 'Y-m-d',
            };
            
            $startDate = now()->subDays($days);
            
            return DB::table('campaign_analytics')
                ->join('publications', 'campaign_analytics.publication_id', '=', 'publications.id')
                ->where('publications.workspace_id', $workspaceId)
                ->where('campaign_analytics.created_at', '>=', $startDate)
                ->select([
                    DB::raw("DATE_FORMAT(campaign_analytics.created_at, '%Y-%m-%d') as date"),
                    DB::raw('SUM(views) as views'),
                    DB::raw('SUM(clicks) as clicks'),
                    DB::raw('SUM(likes) as likes'),
                    DB::raw('SUM(comments) as comments'),
                    DB::raw('SUM(shares) as shares'),
                ])
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->toArray();
        });
    }
    
    /**
     * Cache user activity statistics
     */
    public function getUserActivityStats(int $workspaceId): array
    {
        $cacheKey = $this->getCacheKey('user_activity', $workspaceId);
        
        return Cache::remember($cacheKey, self::STATS_TTL, function () use ($workspaceId) {
            return [
                'most_active_users' => DB::table('publications')
                    ->join('users', 'publications.user_id', '=', 'users.id')
                    ->where('publications.workspace_id', $workspaceId)
                    ->select([
                        'users.id',
                        'users.name',
                        DB::raw('COUNT(*) as publication_count'),
                    ])
                    ->groupBy('users.id', 'users.name')
                    ->orderByDesc('publication_count')
                    ->limit(10)
                    ->get()
                    ->toArray(),
                    
                'recent_activity' => DB::table('publications')
                    ->where('workspace_id', $workspaceId)
                    ->where('created_at', '>=', now()->subDays(7))
                    ->count(),
            ];
        });
    }
    
    /**
     * Invalidate workspace-related caches
     */
    public function invalidateWorkspace(int $workspaceId): void
    {
        $patterns = [
            'workspace_stats',
            'platform_performance',
            'top_publications',
            'timeseries',
            'user_activity',
        ];
        
        foreach ($patterns as $pattern) {
            // Clear all variations of the cache key
            Cache::forget($this->getCacheKey($pattern, $workspaceId));
            
            // For keys with additional parameters, we'd need to track them
            // or use cache tags (available in Redis)
        }
        
        Log::info('Workspace query cache invalidated', ['workspace_id' => $workspaceId]);
    }
    
    /**
     * Invalidate publication-related caches
     */
    public function invalidatePublication(int $publicationId): void
    {
        Cache::forget($this->getCacheKey('publication_performance', $publicationId));
        
        Log::info('Publication query cache invalidated', ['publication_id' => $publicationId]);
    }
    
    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        return [
            'driver' => config('cache.default'),
            'prefix' => self::CACHE_PREFIX,
            'ttl' => [
                'default' => self::DEFAULT_TTL,
                'stats' => self::STATS_TTL,
            ],
        ];
    }
    
    /**
     * Parse date range string
     */
    private function parseDateRange(string $range): array
    {
        return match($range) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'yesterday' => [now()->subDay()->startOfDay(), now()->subDay()->endOfDay()],
            'last_7_days' => [now()->subDays(7), now()],
            'last_30_days' => [now()->subDays(30), now()],
            'this_month' => [now()->startOfMonth(), now()->endOfMonth()],
            'last_month' => [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()],
            default => [now()->subDays(30), now()],
        };
    }
    
    /**
     * Get cache key
     */
    private function getCacheKey(string $type, int|string $identifier): string
    {
        return self::CACHE_PREFIX . "{$type}:{$identifier}";
    }
}
