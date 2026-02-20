<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate Limit Configuration
    |--------------------------------------------------------------------------
    |
    | Configure rate limits per endpoint and role. Limits are expressed as
    | number of requests per minute. Each endpoint can have a default limit
    | and role-specific overrides.
    |
    */

    'cache_driver' => env('RATE_LIMIT_CACHE_DRIVER', 'redis'),

    'endpoints' => [
        'api.posts.store' => [
            'default' => 10,  // 10 requests per minute for regular users
            'roles' => [
                'admin' => 100,
                'premium' => 50,
            ],
        ],

        'api.ai.generate' => [
            'default' => 5,
            'roles' => [
                'admin' => 50,
                'premium' => 20,
            ],
        ],

        'api.uploads.store' => [
            'default' => 20,
            'roles' => [
                'admin' => 200,
                'premium' => 100,
            ],
        ],

        'api.social.connect' => [
            'default' => 10,
            'roles' => [
                'admin' => 50,
                'premium' => 30,
            ],
        ],

        'api.publications.store' => [
            'default' => 15,
            'roles' => [
                'admin' => 150,
                'premium' => 75,
            ],
        ],

        'api.campaigns.store' => [
            'default' => 10,
            'roles' => [
                'admin' => 100,
                'premium' => 50,
            ],
        ],

        // Authentication endpoints - stricter limits
        'auth.login' => [
            'default' => 5,
            'roles' => [],
        ],

        'auth.register' => [
            'default' => 3,
            'roles' => [],
        ],

        'auth.password.reset' => [
            'default' => 3,
            'roles' => [],
        ],

        // Default fallback for unspecified endpoints
        'default' => [
            'default' => 60,
            'roles' => [
                'admin' => 300,
                'premium' => 150,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limit Window
    |--------------------------------------------------------------------------
    |
    | The time window in seconds for rate limiting. Default is 60 seconds (1 minute).
    |
    */

    'window' => 60,

    /*
    |--------------------------------------------------------------------------
    | Response Headers
    |--------------------------------------------------------------------------
    |
    | Include rate limit information in response headers.
    |
    */

    'headers' => [
        'include' => true,
        'limit_header' => 'X-RateLimit-Limit',
        'remaining_header' => 'X-RateLimit-Remaining',
        'retry_after_header' => 'Retry-After',
    ],
];
