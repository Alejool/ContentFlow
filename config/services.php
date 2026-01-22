<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('FACEBOOK_REDIRECT_URI'),
    ],

    'instagram' => [
        'client_id' => env('INSTAGRAM_CLIENT_ID'),
        'client_secret' => env('INSTAGRAM_CLIENT_SECRET'),
        'redirect' => env('INSTAGRAM_REDIRECT_URI'),
    ],

    'twitter' => [
        'client_id' => env('TWITTER_CLIENT_ID'),
        'client_secret' => env('TWITTER_CLIENT_SECRET'),
        'redirect' => env('TWITTER_REDIRECT_URI'),
        'consumer_key' => env('TWITTER_CONSUMER_KEY'),
        'consumer_secret' => env('TWITTER_CONSUMER_SECRET'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'tiktok' => [
        'client_key' => env('TIKTOK_CLIENT_KEY'),
        'client_secret' => env('TIKTOK_CLIENT_SECRET'),
        'redirect' => env('TIKTOK_REDIRECT_URI'),
    ],
    'youtube' => [
        'client_id' => env('YOUTUBE_CLIENT_ID'),
        'client_secret' => env('YOUTUBE_CLIENT_SECRET'),
        'redirect' => env('YOUTUBE_REDIRECT_URI'),
    ],

    'openai' => [
        'enabled' => env('OPENAI_ENABLED', false),
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-3.5-turbo'),
        'temperature' => (float) env('OPENAI_TEMPERATURE', 0.7),
    ],

    'gemini' => [
        'enabled' => env('GEMINI_ENABLED', false),
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-pro'),
    ],
    'deepseek' => [
        'enabled' => env('DEEPSEEK_ENABLED', true),
        'api_key' => env('DEEPSEEK_API_KEY'),
        'model' => env('DEEPSEEK_MODEL', 'deepseek-chat'),
        'temperature' => (float) env('DEEPSEEK_TEMPERATURE', 0.3),
        'max_tokens' => (int) env('DEEPSEEK_MAX_TOKENS', 500),
        'timeout' => (int) env('DEEPSEEK_TIMEOUT', 90),
        'base_url' => 'https://api.deepseek.com/v1',
    ],
    'anthropic' => [
        'enabled' => env('ANTHROPIC_ENABLED', true),
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-haiku-4.5'),
        'temperature' => (float) env('ANTHROPIC_TEMPERATURE', 0.7),
        'base_url' => env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'),
    ],
];
