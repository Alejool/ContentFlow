<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cache Services Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for intelligent caching services
    |
    */

    'publication' => [
        'enabled' => env('CACHE_PUBLICATIONS', true),
        'ttl' => [
            'full' => env('CACHE_PUBLICATION_FULL_TTL', 3600), // 1 hour
            'metadata' => env('CACHE_PUBLICATION_METADATA_TTL', 3600), // 1 hour
            'stats' => env('CACHE_PUBLICATION_STATS_TTL', 1800), // 30 minutes
            'list' => env('CACHE_PUBLICATION_LIST_TTL', 600), // 10 minutes
        ],
    ],

    'social_api' => [
        'enabled' => env('CACHE_SOCIAL_API', true),
        'ttl' => [
            'profile' => env('CACHE_SOCIAL_PROFILE_TTL', 7200), // 2 hours
            'analytics' => env('CACHE_SOCIAL_ANALYTICS_TTL', 1800), // 30 minutes
            'posts' => env('CACHE_SOCIAL_POSTS_TTL', 600), // 10 minutes
        ],
    ],

    'query' => [
        'enabled' => env('CACHE_QUERIES', true),
        'ttl' => [
            'default' => env('CACHE_QUERY_DEFAULT_TTL', 1800), // 30 minutes
            'stats' => env('CACHE_QUERY_STATS_TTL', 1800), // 30 minutes
            'trending' => env('CACHE_QUERY_TRENDING_TTL', 900), // 15 minutes
            'user_activity' => env('CACHE_QUERY_USER_ACTIVITY_TTL', 600), // 10 minutes
        ],
    ],

    'video' => [
        'streaming' => [
            'enabled' => env('VIDEO_STREAMING_ENABLED', true),
            'chunk_size' => env('VIDEO_CHUNK_SIZE', 8 * 1024 * 1024), // 8MB
            'large_file_threshold' => env('VIDEO_LARGE_FILE_THRESHOLD', 500 * 1024 * 1024), // 500MB
            'progress_log_interval' => env('VIDEO_PROGRESS_LOG_INTERVAL', 5), // seconds
        ],
    ],

    'rate_limiting' => [
        'reel_generation' => [
            'max_attempts' => env('REEL_RATE_LIMIT_ATTEMPTS', 5),
            'decay_minutes' => env('REEL_RATE_LIMIT_DECAY', 10),
        ],
    ],
];
