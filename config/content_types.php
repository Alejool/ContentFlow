<?php

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
        'platforms' => ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'],
        'media' => [
            'required' => false,
            'min_count' => 0,
            'max_count' => 10,
            'types' => ['image', 'video'],
        ],
    ],

    'reel' => [
        'platforms' => ['instagram', 'tiktok', 'youtube', 'facebook'],
        'media' => [
            'required' => true,
            'min_count' => 1,
            'max_count' => 1,
            'types' => ['video'],
        ],
    ],

    'story' => [
        'platforms' => ['instagram', 'facebook'],
        'media' => [
            'required' => true,
            'min_count' => 1,
            'max_count' => 1,
            'types' => ['image', 'video'],
        ],
    ],

    'carousel' => [
        'platforms' => ['instagram', 'facebook', 'linkedin'],
        'media' => [
            'required' => true,
            'min_count' => 2,
            'max_count' => 10,
            'types' => ['image', 'video'],
        ],
    ],

    'poll' => [
        'platforms' => ['twitter'],
        'media' => [
            'required' => false,
            'min_count' => 0,
            'max_count' => 4,
            'types' => ['image', 'video'],
        ],
    ],
];
