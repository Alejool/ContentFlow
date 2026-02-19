<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Cache service for social media API responses
 * Implements intelligent caching with rate limit tracking
 * Reduces API calls and improves performance
 */
class SocialApiCacheService
{
    private const CACHE_PREFIX = 'social_api:';
    private const PROFILE_TTL = 7200; // 2 hours
    private const ANALYTICS_TTL = 1800; // 30 minutes
    private const POSTS_TTL = 600; // 10 minutes
    private const RATE_LIMIT_TTL = 3600; // 1 hour

    /**
     * Cache social profile data
     */
    public function cacheProfile(string $platform, string $accountId, array $data): void
    {
        $cacheKey = $this->getCacheKey('profile', $platform, $accountId);
        Cache::put($cacheKey, $data, self::PROFILE_TTL);
        
        Log::debug('Social profile cached', [
            'platform' => $platform,
            'account_id' => $accountId,
            'ttl' => self::PROFILE_TTL
        ]);
    }

    /**
     * Get cached social profile
     */
    public function getProfile(string $platform, string $accountId): ?array
    {
        $cacheKey = $this->getCacheKey('profile', $platform, $accountId);
        return Cache::get($cacheKey);
    }

    /**
     * Cache analytics data
     */
    public function cacheAnalytics(string $platform, string $accountId, string $metric, array $data): void
    {
        $cacheKey = $this->getCacheKey('analytics', $platform, "{$accountId}:{$metric}");
        Cache::put($cacheKey, $data, self::ANALYTICS_TTL);
        
        Log::debug('Social analytics cached', [
            'platform' => $platform,
            'account_id' => $accountId,
            'metric' => $metric,
            'ttl' => self::ANALYTICS_TTL
        ]);
    }

    /**
     * Get cached analytics
     */
    public function getAnalytics(string $platform, string $accountId, string $metric): ?array
    {
        $cacheKey = $this->getCacheKey('analytics', $platform, "{$accountId}:{$metric}");
        return Cache::get($cacheKey);
    }

    /**
     * Cache posts list
     */
    public function cachePosts(string $platform, string $accountId, array $posts): void
    {
        $cacheKey = $this->getCacheKey('posts', $platform, $accountId);
        Cache::put($cacheKey, $posts, self::POSTS_TTL);
        
        Log::debug('Social posts cached', [
            'platform' => $platform,
            'account_id' => $accountId,
            'count' => count($posts),
            'ttl' => self::POSTS_TTL
        ]);
    }

    /**
     * Get cached posts
     */
    public function getPosts(string $platform, string $accountId): ?array
    {
        $cacheKey = $this->getCacheKey('posts', $platform, $accountId);
        return Cache::get($cacheKey);
    }

    /**
     * Invalidate all cache for an account
     */
    public function invalidateAccount(string $platform, string $accountId): void
    {
        $patterns = ['profile', 'analytics', 'posts'];
        
        foreach ($patterns as $pattern) {
            $key = $this->getCacheKey($pattern, $platform, $accountId);
            Cache::forget($key);
        }
        
        Log::info('Social account cache invalidated', [
            'platform' => $platform,
            'account_id' => $accountId
        ]);
    }

    /**
     * Check if API call should be made (rate limit check)
     */
    public function canMakeApiCall(string $platform, string $accountId, int $maxCalls = 100): bool
    {
        $key = $this->getCacheKey('rate_limit', $platform, $accountId);
        $calls = Cache::get($key, 0);
        
        return $calls < $maxCalls;
    }
    
    /**
     * Track API call for rate limiting
     */
    public function trackApiCall(string $platform, string $accountId): void
    {
        $key = $this->getCacheKey('rate_limit', $platform, $accountId);
        $calls = Cache::increment($key);
        
        if ($calls === 1) {
            Cache::put($key, 1, self::RATE_LIMIT_TTL);
        }
        
        Log::debug('API call tracked', [
            'platform' => $platform,
            'account_id' => $accountId,
            'calls' => $calls
        ]);
    }
    
    /**
     * Get remaining API calls
     */
    public function getRemainingCalls(string $platform, string $accountId, int $maxCalls = 100): int
    {
        $key = $this->getCacheKey('rate_limit', $platform, $accountId);
        $calls = Cache::get($key, 0);
        
        return max(0, $maxCalls - $calls);
    }
    
    /**
     * Cache with conditional refresh
     */
    public function cacheWithRefresh(string $type, string $platform, string $accountId, callable $fetcher, ?int $ttl = null): mixed
    {
        $cacheKey = $this->getCacheKey($type, $platform, $accountId);
        
        // Try to get from cache first
        $cached = Cache::get($cacheKey);
        
        if ($cached !== null) {
            return $cached;
        }
        
        // Check rate limit before making API call
        if (!$this->canMakeApiCall($platform, $accountId)) {
            Log::warning('API rate limit reached', [
                'platform' => $platform,
                'account_id' => $accountId
            ]);
            return null;
        }
        
        // Fetch fresh data
        $data = $fetcher();
        
        if ($data !== null) {
            $this->trackApiCall($platform, $accountId);
            
            $ttl = $ttl ?? match($type) {
                'profile' => self::PROFILE_TTL,
                'analytics' => self::ANALYTICS_TTL,
                'posts' => self::POSTS_TTL,
                default => self::POSTS_TTL,
            };
            
            Cache::put($cacheKey, $data, $ttl);
        }
        
        return $data;
    }
    
    /**
     * Batch cache multiple items
     */
    public function batchCache(string $type, string $platform, array $items, ?int $ttl = null): void
    {
        foreach ($items as $accountId => $data) {
            $cacheKey = $this->getCacheKey($type, $platform, $accountId);
            
            $ttl = $ttl ?? match($type) {
                'profile' => self::PROFILE_TTL,
                'analytics' => self::ANALYTICS_TTL,
                'posts' => self::POSTS_TTL,
                default => self::POSTS_TTL,
            };
            
            Cache::put($cacheKey, $data, $ttl);
        }
        
        Log::info('Batch cached social data', [
            'platform' => $platform,
            'type' => $type,
            'count' => count($items)
        ]);
    }
    
    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        return [
            'driver' => config('cache.default'),
            'prefix' => self::CACHE_PREFIX,
            'ttl' => [
                'profile' => self::PROFILE_TTL,
                'analytics' => self::ANALYTICS_TTL,
                'posts' => self::POSTS_TTL,
                'rate_limit' => self::RATE_LIMIT_TTL,
            ],
        ];
    }

    /**
     * Get cache key
     */
    private function getCacheKey(string $type, string $platform, string $identifier): string
    {
        return self::CACHE_PREFIX . "{$type}:{$platform}:{$identifier}";
    }
}
