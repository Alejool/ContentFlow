<?php

use App\Constants\ContentTypes;

return [
    /*
    |--------------------------------------------------------------------------
    | Content Type Validation Rules
    |--------------------------------------------------------------------------
    |
    | This configuration defines the validation rules for each content type
    | including supported platforms and media requirements.
    |
    */

    'post' => [
        'platforms' => ['instagram', 'threads', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
        'media' => [
            'required' => false,
            'min_count' => 0,
            'max_count' => 10,
            'types' => ['image', 'video'],
        ],
    ],

    'reel' => [
        'platforms' => ContentTypes::REEL_COMPATIBLE_PLATFORMS,
        'media' => [
            'required' => true,
            'min_count' => 1,
            'max_count' => 1,
            'types' => ['video'],
        ],
    ],

    'story' => [
        'platforms' => ['instagram', 'threads', 'facebook', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
        'media' => [
            'required' => true,
            'min_count' => 1,
            'max_count' => 1,
            'types' => ['image', 'video'],
        ],
    ],

    'carousel' => [
        'platforms' => ['instagram', 'threads', 'facebook', 'linkedin', 'twitter', 'youtube', 'pinterest', 'tiktok'],
        'media' => [
            'required' => true,
            'min_count' => 2,
            'max_count' => 10,
            'types' => ['image', 'video'],
        ],
    ],

    'poll' => [
        'platforms' => ['twitter', 'threads', 'facebook', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
        'media' => [
            'required' => false,
            'min_count' => 0,
            'max_count' => 4,
            'types' => ['image', 'video'],
        ],
    ],
];
