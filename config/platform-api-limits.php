<?php

/**
 * Límites de API por Plataforma
 * 
 * Define:
 * - Rate limiting (requests por segundo/minuto/hora/día)
 * - Cuotas de uso
 * - Limitaciones según tipo de cuenta
 * - Throttling
 * - Límites de conexiones concurrentes
 */

return [
    'facebook' => [
        'rate_limits' => [
            'requests_per_hour' => 200, // Por usuario
            'requests_per_minute' => 600, // Por aplicación
        ],
        'quotas' => [
            'posts_per_day' => 'unlimited',
            'api_calls_per_day' => 'unlimited',
        ],
        'by_account_type' => [
            'verified_page' => [
                'requests_per_hour' => 500,
                'posts_per_day' => 'unlimited',
            ],
            'unverified_page' => [
                'requests_per_hour' => 200,
                'posts_per_day' => 'unlimited',
            ],
        ],
        'throttling' => [
            'enabled' => true,
            'retry_after_seconds' => 60,
            'max_retries' => 3,
        ],
    ],

    'instagram' => [
        'rate_limits' => [
            'requests_per_hour' => 200,
            'requests_per_minute' => 60,
        ],
        'quotas' => [
            'posts_per_day' => 'unlimited',
            'api_calls_per_day' => 'unlimited',
        ],
        'by_account_type' => [
            'business_account' => [
                'requests_per_hour' => 500,
                'posts_per_day' => 'unlimited',
            ],
            'creator_account' => [
                'requests_per_hour' => 400,
                'posts_per_day' => 'unlimited',
            ],
        ],
        'throttling' => [
            'enabled' => true,
            'retry_after_seconds' => 60,
            'max_retries' => 3,
        ],
    ],

    'youtube' => [
        'rate_limits' => [
            'quota_units_per_day' => 10000,
        ],
        'quotas' => [
            'upload_cost_units' => 1600, // Per video upload
            'list_cost_units' => 1,
            'get_cost_units' => 1,
        ],
        'by_account_type' => [
            'verified' => [
                'quota_units_per_day' => 10000,
                'max_video_duration_seconds' => 43200,
            ],
            'unverified' => [
                'quota_units_per_day' => 10000,
                'max_video_duration_seconds' => 900,
            ],
        ],
        'throttling' => [
            'enabled' => true,
            'quota_resets_at' => 'midnight PT',
            'retry_after_seconds' => 60,
            'max_retries' => 5,
        ],
    ],

    'twitter' => [
        'rate_limits' => [
            'posts_per_three_hours' => 300,
            'requests_per_day' => 2400,
        ],
        'quotas' => [
            'api_calls_per_month' => 'depends_on_plan',
        ],
        'by_account_type' => [
            'premium' => [
                'posts_per_day' => 'higher_limits',
                'api_calls_per_month' => 'higher_limits',
            ],
            'free' => [
                'posts_per_three_hours' => 300,
                'api_calls_per_month' => 'limited',
            ],
        ],
        'throttling' => [
            'enabled' => true,
            'retry_after_seconds' => 15,
            'max_retries' => 3,
            'pricing' => 'pay_as_you_go',
        ],
    ],

    'tiktok' => [
        'rate_limits' => [
            'requests_per_day' => 1000,
            'records_per_day' => 100000,
        ],
        'quotas' => [
            'posts_per_day' => '1-3 recommended',
            'analytics_requests_per_day' => 500,
        ],
        'by_account_type' => [
            'verified_creator' => [
                'requests_per_day' => 2000,
                'records_per_day' => 200000,
            ],
            'unverified' => [
                'requests_per_day' => 1000,
                'records_per_day' => 100000,
            ],
        ],
        'throttling' => [
            'enabled' => true,
            'retry_after_seconds' => 30,
            'max_retries' => 3,
        ],
    ],

    'linkedin' => [
        'rate_limits' => [
            'requests_per_minute' => 60,
            'requests_per_day' => 10000,
        ],
        'quotas' => [
            'posts_per_day' => 'unlimited',
            'api_calls_per_day' => 'unlimited',
        ],
        'throttling' => [
            'enabled' => true,
            'retry_after_seconds' => 60,
            'max_retries' => 3,
        ],
    ],

    'threads' => [
        'rate_limits' => [
            'requests_per_hour' => 200,
        ],
        'quotas' => [
            'posts_per_day' => 250,
            'replies_per_day' => 1000,
        ],
        'note' => 'Threads API v1.0 - Limits subject to change',
        'throttling' => [
            'enabled' => true,
            'retry_after_seconds' => 60,
            'max_retries' => 3,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global/Universal Limits
    |--------------------------------------------------------------------------
    */
    'global' => [
        'concurrent_connections' => [
            'max_per_user' => 5,
            'max_per_workspace' => 50,
        ],
        'connection_timeout_seconds' => 30,
        'request_timeout_seconds' => 60,
        'retry_strategy' => 'exponential_backoff', // linear, exponential
        'max_global_retries' => 3,
    ],
];
