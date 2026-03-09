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

    'google_calendar' => [
        'client_id' => env('GOOGLE_CALENDAR_CLIENT_ID', env('GOOGLE_CLIENT_ID')),
        'client_secret' => env('GOOGLE_CALENDAR_CLIENT_SECRET', env('GOOGLE_CLIENT_SECRET')),
        'redirect_uri' => env('GOOGLE_CALENDAR_REDIRECT_URI', env('APP_URL') . '/auth/google-calendar/callback'),
    ],

    'outlook_calendar' => [
        'client_id' => env('OUTLOOK_CALENDAR_CLIENT_ID'),
        'client_secret' => env('OUTLOOK_CALENDAR_CLIENT_SECRET'),
        'redirect_uri' => env('OUTLOOK_CALENDAR_REDIRECT_URI'),
        'tenant_id' => env('OUTLOOK_CALENDAR_TENANT_ID', 'common'),
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
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
        'public' => env('STRIPE_PUBLISH'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    'mercadopago' => [
        'access_token' => env('MERCADOPAGO_ACCESS_TOKEN'),
        'public_key' => env('MERCADOPAGO_PUBLIC_KEY'),
        'api_url' => env('MERCADOPAGO_API_URL', 'https://api.mercadopago.com'),
        'usd_to_cop_rate' => env('MERCADOPAGO_USD_TO_COP_RATE', 4000),
        'webhook_secret' => env('MERCADOPAGO_WEBHOOK_SECRET'),
    ],

    'epayco' => [
        'public_key' => env('EPAYCO_PUBLIC_KEY'),
        'private_key' => env('EPAYCO_PRIVATE_KEY'),
        'test_mode' => env('EPAYCO_TEST_MODE', true),
        'usd_to_cop_rate' => env('EPAYCO_USD_TO_COP_RATE', 4000),
        'webhook_secret' => env('EPAYCO_WEBHOOK_SECRET'),
    ],

    'payu' => [
        'api_key' => env('PAYU_API_KEY'),
        'api_login' => env('PAYU_API_LOGIN'),
        'merchant_id' => env('PAYU_MERCHANT_ID'),
        'account_id' => env('PAYU_ACCOUNT_ID'),
        'test_mode' => env('PAYU_TEST_MODE', true),
        'webhook_secret' => env('PAYU_WEBHOOK_SECRET'),
        'exchange_rates' => [
            'CO' => env('PAYU_USD_TO_COP_RATE', 4000),
            'MX' => env('PAYU_USD_TO_MXN_RATE', 20),
            'PE' => env('PAYU_USD_TO_PEN_RATE', 3.8),
            'AR' => env('PAYU_USD_TO_ARS_RATE', 350),
            'BR' => env('PAYU_USD_TO_BRL_RATE', 5),
            'CL' => env('PAYU_USD_TO_CLP_RATE', 900),
            'PA' => 1, // USD
        ],
    ],

    'wompi' => [
        'public_key' => env('WOMPI_PUBLIC_KEY'),
        'private_key' => env('WOMPI_PRIVATE_KEY'),
        'event_secret' => env('WOMPI_EVENT_SECRET'),
        'test_mode' => env('WOMPI_TEST_MODE', true),
    ],
];
