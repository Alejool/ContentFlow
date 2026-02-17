<?php

return [
    'facebook' => [
        'video' => [
            'formats' => ['mp4', 'mov', 'avi'],
            'max_size_mb' => 4096,
            'max_duration_seconds' => 14400, // 240 minutos
            'min_duration_seconds' => 1,
            'resolutions' => [
                'min_width' => 120,
                'max_width' => 1920,
                'min_height' => 120,
                'max_height' => 1080,
            ],
            'types' => [
                'feed' => [
                    'aspect_ratios' => ['16:9', '4:5', '1:1', '9:16'],
                    'recommended_aspect_ratio' => '16:9',
                    'max_duration_seconds' => 14400,
                ],
                'reel' => [
                    'aspect_ratio' => '9:16',
                    'max_duration_seconds' => 90,
                    'min_duration_seconds' => 3,
                    'recommended_resolution' => '1080x1920',
                ],
            ],
        ],
        'image' => [
            'formats' => ['jpg', 'jpeg', 'png'],
            'max_size_mb' => 10,
            'min_width' => 600,
            'recommended_resolution' => '1200x630',
        ],
    ],

    'instagram' => [
        'video' => [
            'formats' => ['mp4', 'mov'],
            'max_size_mb' => 4096,
            'types' => [
                'feed' => [
                    'max_duration_seconds' => 60,
                    'min_duration_seconds' => 3,
                    'aspect_ratios' => ['4:5', '1:1', '16:9'],
                    'recommended_aspect_ratio' => '4:5',
                    'recommended_resolution' => '1080x1350',
                ],
                'reel' => [
                    'max_duration_seconds' => 90,
                    'min_duration_seconds' => 3,
                    'aspect_ratio' => '9:16',
                    'recommended_resolution' => '1080x1920',
                    'max_size_mb' => 4096,
                ],
            ],
        ],
        'image' => [
            'formats' => ['jpg', 'jpeg', 'png'],
            'max_size_mb' => 8,
            'aspect_ratios' => ['1:1', '4:5', '16:9'],
            'recommended_resolution' => '1080x1080',
        ],
    ],

    'tiktok' => [
        'video' => [
            'formats' => ['mp4', 'mov', 'webm'],
            'max_size_mb' => 4096,
            'max_duration_seconds' => 600, // 10 minutos
            'min_duration_seconds' => 3,
            'aspect_ratio' => '9:16',
            'recommended_resolution' => '1080x1920',
            'resolutions' => [
                'min_width' => 720,
                'max_width' => 4096,
                'min_height' => 1280,
                'max_height' => 4096,
            ],
        ],
    ],

    'youtube' => [
        'video' => [
            'formats' => ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
            'max_size_mb' => 256000, // 256 GB
            'max_duration_seconds' => 43200, // 12 horas
            'min_duration_seconds' => 1,
            'types' => [
                'standard' => [
                    'aspect_ratios' => ['16:9', '4:3', '21:9'],
                    'recommended_aspect_ratio' => '16:9',
                    'recommended_resolution' => '1920x1080',
                ],
                'short' => [
                    'max_duration_seconds' => 60,
                    'aspect_ratio' => '9:16',
                    'recommended_resolution' => '1080x1920',
                ],
            ],
        ],
    ],

    'twitter' => [
        'video' => [
            'formats' => ['mp4', 'mov'],
            'max_size_mb' => 512,
            'max_duration_seconds' => 140,
            'min_duration_seconds' => 0.5,
            'aspect_ratios' => ['16:9', '1:1', '9:16'],
            'recommended_aspect_ratio' => '16:9',
            'resolutions' => [
                'min_width' => 32,
                'max_width' => 1920,
                'min_height' => 32,
                'max_height' => 1200,
            ],
        ],
        'image' => [
            'formats' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'max_size_mb' => 5,
            'recommended_resolution' => '1200x675',
        ],
    ],

    'linkedin' => [
        'video' => [
            'formats' => ['mp4', 'mov', 'avi'],
            'max_size_mb' => 5120,
            'max_duration_seconds' => 600, // 10 minutos
            'min_duration_seconds' => 3,
            'aspect_ratios' => ['16:9', '1:1', '9:16', '4:5'],
            'recommended_aspect_ratio' => '16:9',
            'recommended_resolution' => '1920x1080',
        ],
        'image' => [
            'formats' => ['jpg', 'jpeg', 'png', 'gif'],
            'max_size_mb' => 10,
            'recommended_resolution' => '1200x627',
        ],
    ],
];
