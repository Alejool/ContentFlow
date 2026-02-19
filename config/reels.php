<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Reel Generation Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for AI-powered reel generation from videos.
    | Optimized for speed and quality balance.
    |
    */

    // Default platforms to generate reels for
    // Recommended: 1 platform for fastest generation
    'default_platforms' => ['instagram'],

    // Maximum recommended platforms for optimal speed
    'max_recommended_platforms' => 1,

    // FFmpeg encoding settings
    'encoding' => [
        // Preset: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
        // veryfast = good balance between speed and quality
        'preset' => env('REEL_ENCODING_PRESET', 'veryfast'),
        
        // CRF (Constant Rate Factor): 0-51, lower = better quality, higher = smaller file
        // 26 = good quality with smaller file size for faster upload
        'crf' => env('REEL_ENCODING_CRF', 26),
        
        // Audio bitrate (lower = faster encoding)
        'audio_bitrate' => env('REEL_AUDIO_BITRATE', '96k'),
    ],

    // Visual effects configuration
    'effects' => [
        // Enable/disable specific effects for speed optimization
        'color_enhancement' => true,
        'clickbait_text' => true,
        'zoom_effect' => false, // Disabled for speed
        'vignette' => false, // Disabled for speed
    ],

    // Text overlay settings
    'text_overlay' => [
        'es' => '¡MIRA ESTO! 👀',
        'en' => 'WATCH THIS! 👀',
        'fr' => 'REGARDEZ ÇA! 👀',
        'de' => 'SCHAU DIR DAS AN! 👀',
        'pt' => 'VEJA ISSO! 👀',
    ],

    // Platform specifications
    'platforms' => [
        'instagram' => [
            'width' => 1080,
            'height' => 1920,
            'max_duration' => 90,
            'aspect_ratio' => '9:16',
        ],
        'tiktok' => [
            'width' => 1080,
            'height' => 1920,
            'max_duration' => 180,
            'aspect_ratio' => '9:16',
        ],
        'youtube_shorts' => [
            'width' => 1080,
            'height' => 1920,
            'max_duration' => 60,
            'aspect_ratio' => '9:16',
        ],
    ],

    // Performance tips
    'performance_tips' => [
        '1 reel = Fastest (2-4 min) - RECOMMENDED',
        '2 reels = Slower (5-8 min)',
        '3+ reels = Slowest (10+ min)',
    ],
];
