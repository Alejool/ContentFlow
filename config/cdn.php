<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CDN Configuration
    |--------------------------------------------------------------------------
    |
    | Configure CDN settings for serving media files with optimal performance
    | Supports CloudFront, Cloudflare, and custom CDN providers
    |
    */

    'enabled' => env('CDN_ENABLED', false),

    'provider' => env('CDN_PROVIDER', 'cloudfront'), // cloudfront, cloudflare, custom

    'domain' => env('CDN_DOMAIN', env('AWS_URL')),

    /*
    |--------------------------------------------------------------------------
    | Signed URLs
    |--------------------------------------------------------------------------
    |
    | Enable signed URLs for private content protection
    | Requires CloudFront key pair configuration
    |
    */

    'use_signed_urls' => env('CDN_USE_SIGNED_URLS', false),

    'private_key_path' => env('CDN_PRIVATE_KEY_PATH', storage_path('keys/cloudfront-private-key.pem')),

    'key_pair_id' => env('CDN_KEY_PAIR_ID'),

    /*
    |--------------------------------------------------------------------------
    | CloudFront Configuration
    |--------------------------------------------------------------------------
    */

    'cloudfront_distribution_id' => env('CLOUDFRONT_DISTRIBUTION_ID'),

    /*
    |--------------------------------------------------------------------------
    | Cloudflare Configuration
    |--------------------------------------------------------------------------
    */

    'cloudflare_zone_id' => env('CLOUDFLARE_ZONE_ID'),

    'cloudflare_api_token' => env('CLOUDFLARE_API_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Cache Control
    |--------------------------------------------------------------------------
    |
    | Default cache control headers for different content types
    |
    */

    'cache_control' => [
        'images' => 'public, max-age=31536000, immutable', // 1 year
        'videos' => 'public, max-age=31536000, immutable', // 1 year
        'thumbnails' => 'public, max-age=2592000', // 30 days
        'default' => 'public, max-age=86400', // 1 day
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Optimization
    |--------------------------------------------------------------------------
    |
    | Settings for automatic image optimization and format conversion
    |
    */

    'image_optimization' => [
        'enabled' => env('CDN_IMAGE_OPTIMIZATION', true),
        'formats' => ['webp', 'avif', 'jpeg'],
        'quality' => [
            'webp' => 85,
            'avif' => 80,
            'jpeg' => 90,
        ],
        'breakpoints' => [150, 320, 640, 1024, 1920],
    ],
];
