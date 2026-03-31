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
    | IMPORTANT: Platform compatibility is defined in App\Constants\ContentTypes
    | to ensure consistency between frontend and backend.
    |
    */

    'post' => [
        'platforms' => ContentTypes::POST_COMPATIBLE_PLATFORMS,
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
        'platforms' => ContentTypes::STORY_COMPATIBLE_PLATFORMS,
        'media' => [
            'required' => true,
            'min_count' => 1,
            'max_count' => 1,
            'types' => ['image', 'video'],
        ],
    ],

    'carousel' => [
        'platforms' => ContentTypes::CAROUSEL_COMPATIBLE_PLATFORMS,
        'media' => [
            'required' => true,
            'min_count' => 2,
            'max_count' => 10,
            'types' => ['image', 'video'],
        ],
    ],

    'poll' => [
        'platforms' => ContentTypes::POLL_COMPATIBLE_PLATFORMS,
        'media' => [
            'required' => false,
            'min_count' => 0,
            'max_count' => 4,
            'types' => ['image', 'video'],
        ],
    ],
];
