<?php

/**
 * Capacidades por Rol y Plan de Suscripción
 * 
 * Define qué puede hacer cada rol de usuario en cada plataforma,
 * según su plan de suscripción.
 * 
 * Estructura:
 * roles[role] => plans[plan] => platforms[platform] => capabilities
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Free Plan
    |--------------------------------------------------------------------------
    */
    'free' => [
        'facebook' => [
            'can_publish' => true,
            'can_schedule' => false,
            'can_publish_stories' => false,
            'can_publish_reels' => false,
            'can_publish_carousel' => false,
            'max_accounts' => 1,
            'max_posts_per_day' => 5,
            'max_post_size_mb' => 100,
            'max_video_duration_seconds' => 600, // 10 minutos
            'analytics_available' => false,
            'ai_assistance' => false,
        ],
        'instagram' => [
            'can_publish' => true,
            'can_schedule' => false,
            'can_publish_stories' => false,
            'can_publish_reels' => false,
            'can_publish_carousel' => false,
            'max_accounts' => 1,
            'max_posts_per_day' => 3,
            'max_post_size_mb' => 100,
            'max_video_duration_seconds' => 90,
            'analytics_available' => false,
            'ai_assistance' => false,
        ],
        'youtube' => [
            'can_publish' => true,
            'can_schedule' => false,
            'can_publish_shorts' => true,
            'max_accounts' => 1,
            'max_videos_per_day' => 3,
            'max_video_size_mb' => 1024, // 1GB
            'max_video_duration_seconds' => 900, // 15 minutos (unverified)
            'analytics_available' => false,
            'ai_assistance' => false,
        ],
        'twitter' => [
            'can_publish' => true,
            'can_schedule' => false,
            'can_publish_threads' => true,
            'can_publish_polls' => false,
            'max_accounts' => 1,
            'max_posts_per_day' => 10,
            'max_post_size_mb' => 5,
            'max_video_duration_seconds' => 140,
            'analytics_available' => false,
            'ai_assistance' => false,
        ],
        'tiktok' => [
            'can_publish' => true,
            'can_schedule' => false,
            'can_use_sounds' => true,
            'max_accounts' => 1,
            'max_videos_per_day' => 1,
            'max_video_size_mb' => 500,
            'max_video_duration_seconds' => 600,
            'analytics_available' => false,
            'ai_assistance' => false,
        ],
        'linkedin' => [
            'can_publish' => false,
            'can_schedule' => false,
            'max_accounts' => 0,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pro Plan
    |--------------------------------------------------------------------------
    */
    'pro' => [
        'facebook' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_stories' => true,
            'can_publish_reels' => true,
            'can_publish_carousel' => true,
            'max_accounts' => 5,
            'max_posts_per_day' => 50,
            'max_post_size_mb' => 4096,
            'max_video_duration_seconds' => 14400, // 4 horas
            'analytics_available' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_hashtag_suggestions' => true,
            'ai_best_time_to_post' => true,
        ],
        'instagram' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_stories' => true,
            'can_publish_reels' => true,
            'can_publish_carousel' => true,
            'max_accounts' => 5,
            'max_posts_per_day' => 30,
            'max_post_size_mb' => 4096,
            'max_video_duration_seconds' => 3600, // 1 hora (IGTV)
            'analytics_available' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_hashtag_suggestions' => true,
            'ai_best_time_to_post' => true,
        ],
        'youtube' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_shorts' => true,
            'max_accounts' => 3,
            'max_videos_per_day' => 10,
            'max_video_size_mb' => 10240, // 10GB
            'max_video_duration_seconds' => 43200, // 12 horas (after verification)
            'analytics_available' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_thumbnail_generation' => true,
            'ai_best_time_to_post' => true,
        ],
        'twitter' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_threads' => true,
            'can_publish_polls' => true,
            'max_accounts' => 5,
            'max_posts_per_day' => 100,
            'max_post_size_mb' => 5,
            'max_video_duration_seconds' => 7200, // 2 horas (after verification)
            'analytics_available' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_hashtag_suggestions' => true,
        ],
        'tiktok' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_use_sounds' => true,
            'can_use_effects' => true,
            'max_accounts' => 3,
            'max_videos_per_day' => 5,
            'max_video_size_mb' => 4096,
            'max_video_duration_seconds' => 600,
            'analytics_available' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_trending_sounds' => true,
        ],
        'linkedin' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_articles' => true,
            'max_accounts' => 2,
            'max_posts_per_day' => 20,
            'analytics_available' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Business Plan (Premium)
    |--------------------------------------------------------------------------
    */
    'business' => [
        'facebook' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_stories' => true,
            'can_publish_reels' => true,
            'can_publish_carousel' => true,
            'can_publish_ads' => true,
            'max_accounts' => 'unlimited',
            'max_posts_per_day' => 'unlimited',
            'max_post_size_mb' => 4096,
            'max_video_duration_seconds' => 14400,
            'analytics_available' => true,
            'advanced_analytics' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_hashtag_suggestions' => true,
            'ai_best_time_to_post' => true,
            'ai_content_calendar' => true,
            'ai_competitor_analysis' => true,
            'priority_support' => true,
        ],
        'instagram' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_stories' => true,
            'can_publish_reels' => true,
            'can_publish_carousel' => true,
            'can_publish_ads' => true,
            'max_accounts' => 'unlimited',
            'max_posts_per_day' => 'unlimited',
            'max_post_size_mb' => 4096,
            'max_video_duration_seconds' => 3600,
            'analytics_available' => true,
            'advanced_analytics' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_hashtag_suggestions' => true,
            'ai_best_time_to_post' => true,
            'ai_content_calendar' => true,
            'priority_support' => true,
        ],
        'youtube' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_shorts' => true,
            'can_monetize' => true,
            'max_accounts' => 'unlimited',
            'max_videos_per_day' => 'unlimited',
            'max_video_size_mb' => 10240,
            'max_video_duration_seconds' => 43200,
            'analytics_available' => true,
            'advanced_analytics' => true,
            'ai_assistance' => true,
            'ai_caption_generation' => true,
            'ai_thumbnail_generation' => true,
            'ai_best_time_to_post' => true,
            'priority_support' => true,
        ],
        'twitter' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_threads' => true,
            'can_publish_polls' => true,
            'max_accounts' => 'unlimited',
            'max_posts_per_day' => 'unlimited',
            'max_post_size_mb' => 5,
            'max_video_duration_seconds' => 7200,
            'analytics_available' => true,
            'advanced_analytics' => true,
            'ai_assistance' => true,
            'priority_support' => true,
        ],
        'tiktok' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_use_sounds' => true,
            'can_use_effects' => true,
            'max_accounts' => 'unlimited',
            'max_videos_per_day' => 'unlimited',
            'max_video_size_mb' => 4096,
            'max_video_duration_seconds' => 600,
            'analytics_available' => true,
            'advanced_analytics' => true,
            'ai_assistance' => true,
            'priority_support' => true,
        ],
        'linkedin' => [
            'can_publish' => true,
            'can_schedule' => true,
            'can_publish_articles' => true,
            'max_accounts' => 'unlimited',
            'max_posts_per_day' => 'unlimited',
            'analytics_available' => true,
            'advanced_analytics' => true,
            'ai_assistance' => true,
            'priority_support' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin/Workspace Owner
    |--------------------------------------------------------------------------
    */
    'admin' => [
        'all_platforms' => [
            'can_publish' => true,
            'can_schedule' => true,
            'max_accounts' => 'unlimited',
            'max_posts_per_day' => 'unlimited',
            'can_manage_team' => true,
            'can_manage_settings' => true,
            'can_view_all_posts' => true,
            'can_delete_any_post' => true,
            'can_manage_integrations' => true,
            'analytics_available' => true,
            'advanced_analytics' => true,
            'ai_assistance' => true,
            'priority_support' => true,
        ],
    ],
];
