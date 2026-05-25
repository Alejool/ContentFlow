<?php

/**
 * Feature Flags por Plataforma
 * 
 * Permite activar/desactivar funcionalidades sin código.
 * Útil para:
 * - Rollout gradual de nuevas características
 * - A/B testing
 * - Feature toggle por cliente/workspace
 * - Experimental features
 */

return [
    'facebook' => [
        'publishing' => [
            'enabled' => true,
            'instant_publishing' => true,
            'scheduled_publishing' => true,
            'auto_publish_optimization' => false, // Experimental
        ],
        'media' => [
            'video_upload' => true,
            'image_upload' => true,
            'carousel_upload' => true,
            'reels' => true,
            'stories' => true,
        ],
        'features' => [
            'analytics' => true,
            'scheduling' => true,
            'bulk_upload' => false, // Beta
            'ai_captions' => false, // Experimental
            'ai_hashtags' => false, // Experimental
        ],
    ],

    'instagram' => [
        'publishing' => [
            'enabled' => true,
            'instant_publishing' => true,
            'scheduled_publishing' => true,
        ],
        'media' => [
            'feed_posts' => true,
            'reels' => true,
            'stories' => true,
            'carousel' => true,
            'igv' => false, // Not available through API
        ],
        'features' => [
            'analytics' => true,
            'scheduling' => true,
            'insights' => true,
            'ai_captions' => false,
            'ai_hashtags' => false,
        ],
    ],

    'youtube' => [
        'publishing' => [
            'enabled' => true,
            'instant_publishing' => true,
            'scheduled_publishing' => true,
            'auto_publish_on_premiere' => false, // Experimental
        ],
        'media' => [
            'video_upload' => true,
            'shorts_upload' => true,
            'community_posts' => false, // Requires special permissions
            'live_streaming' => false, // Separate feature
        ],
        'features' => [
            'analytics' => true,
            'scheduling' => true,
            'thumbnails' => true,
            'descriptions' => true,
            'ai_captions' => false,
            'ai_titles' => false,
            'ai_descriptions' => false,
        ],
    ],

    'twitter' => [
        'publishing' => [
            'enabled' => true,
            'instant_publishing' => true,
            'scheduled_publishing' => false, // Not available in free tier
            'tweet_threads' => true,
            'polls' => true,
        ],
        'media' => [
            'images' => true,
            'videos' => true,
            'gifs' => true,
            'animated_gifs' => true,
        ],
        'features' => [
            'analytics' => true,
            'scheduling' => false,
            'engagement_tracking' => true,
            'ai_suggestions' => false,
            'ai_quote_tweets' => false,
        ],
    ],

    'tiktok' => [
        'publishing' => [
            'enabled' => true,
            'instant_publishing' => true,
            'scheduled_publishing' => false, // TikTok requires instant
            'auto_captions' => true,
        ],
        'media' => [
            'video_upload' => true,
            'duets' => false, // API limitation
            'stitches' => false, // API limitation
            'sounds' => true,
        ],
        'features' => [
            'analytics' => true,
            'hashtag_suggestions' => true,
            'sound_recommendations' => true,
            'trend_analysis' => false, // Experimental
            'ai_captions' => false,
        ],
    ],

    'linkedin' => [
        'publishing' => [
            'enabled' => false, // Not yet enabled
            'instant_publishing' => false,
            'scheduled_publishing' => false,
        ],
        'media' => [
            'documents' => false,
            'articles' => false,
            'videos' => false,
        ],
        'features' => [
            'analytics' => false,
            'scheduling' => false,
        ],
    ],

    'threads' => [
        'publishing' => [
            'enabled' => false, // Threads is new, not yet integrated
            'instant_publishing' => false,
            'scheduled_publishing' => false,
        ],
        'media' => [
            'text' => false,
            'images' => false,
            'videos' => false,
        ],
        'features' => [
            'analytics' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global Features
    |--------------------------------------------------------------------------
    */
    'global' => [
        'bulk_operations' => [
            'enabled' => false,
            'batch_size' => 100,
        ],
        'ai_features' => [
            'captions' => false,
            'hashtags' => false,
            'descriptions' => false,
            'best_time_to_post' => false,
        ],
        'advanced_analytics' => [
            'enabled' => false,
        ],
        'content_calendar' => [
            'enabled' => true,
        ],
        'team_collaboration' => [
            'enabled' => false,
            'approvals' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Experimental Features
    |--------------------------------------------------------------------------
    | Features bajo desarrollo o prueba. Pueden cambiar sin previo aviso.
    */
    'experimental' => [
        'ai_powered_optimization' => false,
        'auto_translate' => false,
        'cross_platform_analytics' => false,
        'unified_calendar' => false,
    ],
];
