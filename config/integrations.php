<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Integrations Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for third-party integrations
    |
    */

    'enabled' => env('INTEGRATIONS_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | RSS Feed Integration
    |--------------------------------------------------------------------------
    */
    'rss' => [
        'enabled' => env('RSS_IMPORT_ENABLED', true),
        'max_feeds_per_workspace' => env('RSS_MAX_FEEDS', 10),
        'import_frequency' => env('RSS_IMPORT_FREQUENCY', 'hourly'), // hourly, daily, weekly
        'max_items_per_import' => env('RSS_MAX_ITEMS_PER_IMPORT', 50),
        'auto_publish' => env('RSS_AUTO_PUBLISH', false),
        'timeout' => 30, // seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Zapier/Make Integration
    |--------------------------------------------------------------------------
    */
    'zapier' => [
        'enabled' => env('ZAPIER_ENABLED', true),
        'webhook_secret' => env('ZAPIER_WEBHOOK_SECRET'),
        'rate_limit' => env('API_RATE_LIMIT', 60), // requests per minute
    ],

    /*
    |--------------------------------------------------------------------------
    | Cloud Storage Integration
    |--------------------------------------------------------------------------
    */
    'cloud_storage' => [
        'google_drive' => [
            'enabled' => env('GOOGLE_DRIVE_ENABLED', true),
            'client_id' => env('GOOGLE_DRIVE_CLIENT_ID'),
            'client_secret' => env('GOOGLE_DRIVE_CLIENT_SECRET'),
            'redirect_uri' => env('GOOGLE_DRIVE_REDIRECT_URI'),
            'scopes' => ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
        ],
        'dropbox' => [
            'enabled' => env('DROPBOX_ENABLED', true),
            'app_key' => env('DROPBOX_APP_KEY'),
            'app_secret' => env('DROPBOX_APP_SECRET'),
            'redirect_uri' => env('DROPBOX_REDIRECT_URI'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Canva Integration
    |--------------------------------------------------------------------------
    */
    'canva' => [
        'enabled' => env('CANVA_ENABLED', false),
        'client_id' => env('CANVA_CLIENT_ID'),
        'client_secret' => env('CANVA_CLIENT_SECRET'),
        'redirect_uri' => env('CANVA_REDIRECT_URI'),
        'scopes' => ['design:read', 'design:write'],
    ],

    /*
    |--------------------------------------------------------------------------
    | E-commerce Integration
    |--------------------------------------------------------------------------
    */
    'ecommerce' => [
        'shopify' => [
            'enabled' => env('SHOPIFY_ENABLED', false),
            'api_key' => env('SHOPIFY_API_KEY'),
            'api_secret' => env('SHOPIFY_API_SECRET'),
            'scopes' => env('SHOPIFY_SCOPES', 'read_products,write_products'),
        ],
        'woocommerce' => [
            'enabled' => env('WOOCOMMERCE_ENABLED', false),
            'url' => env('WOOCOMMERCE_URL'),
            'consumer_key' => env('WOOCOMMERCE_CONSUMER_KEY'),
            'consumer_secret' => env('WOOCOMMERCE_CONSUMER_SECRET'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | CRM Integration
    |--------------------------------------------------------------------------
    */
    'crm' => [
        'hubspot' => [
            'enabled' => env('HUBSPOT_ENABLED', false),
            'client_id' => env('HUBSPOT_CLIENT_ID'),
            'client_secret' => env('HUBSPOT_CLIENT_SECRET'),
            'redirect_uri' => env('HUBSPOT_REDIRECT_URI'),
        ],
        'salesforce' => [
            'enabled' => env('SALESFORCE_ENABLED', false),
            'client_id' => env('SALESFORCE_CLIENT_ID'),
            'client_secret' => env('SALESFORCE_CLIENT_SECRET'),
            'redirect_uri' => env('SALESFORCE_REDIRECT_URI'),
            'instance_url' => env('SALESFORCE_INSTANCE_URL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Communication Integration
    |--------------------------------------------------------------------------
    */
    'communication' => [
        'slack' => [
            'enabled' => env('SLACK_ENABLED', true),
            'bot_token' => env('SLACK_BOT_TOKEN'),
            'signing_secret' => env('SLACK_SIGNING_SECRET'),
            'app_id' => env('SLACK_APP_ID'),
        ],
        'teams' => [
            'enabled' => env('TEAMS_ENABLED', false),
            'app_id' => env('TEAMS_APP_ID'),
            'app_password' => env('TEAMS_APP_PASSWORD'),
            'tenant_id' => env('TEAMS_TENANT_ID'),
        ],
    ],

];
