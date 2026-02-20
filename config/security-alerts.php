<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Security Alerts Configuration
    |--------------------------------------------------------------------------
    |
    | This file configures security monitoring and alerting for suspicious
    | activities. Alerts can be sent via email, Slack, Discord, or logged.
    |
    */

    'enabled' => env('SECURITY_ALERTS_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Alert Channels
    |--------------------------------------------------------------------------
    |
    | Configure which channels should receive security alerts.
    | Available: 'mail', 'slack', 'discord', 'database', 'log'
    |
    */

    'channels' => [
        'mail' => [
            'enabled' => env('SECURITY_ALERTS_MAIL_ENABLED', true),
            'recipients' => explode(',', env('SECURITY_ALERTS_MAIL_RECIPIENTS', 'security@example.com')),
        ],
        'slack' => [
            'enabled' => env('SECURITY_ALERTS_SLACK_ENABLED', false),
            'webhook_url' => env('SECURITY_ALERTS_SLACK_WEBHOOK'),
        ],
        'discord' => [
            'enabled' => env('SECURITY_ALERTS_DISCORD_ENABLED', false),
            'webhook_url' => env('SECURITY_ALERTS_DISCORD_WEBHOOK'),
        ],
        'database' => [
            'enabled' => true, // Always log to database
        ],
        'log' => [
            'enabled' => true, // Always log to file
            'channel' => 'security', // Uses config/logging.php channel
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Failed Authentication Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when multiple failed authentication attempts are detected.
    |
    */

    'failed_authentication' => [
        'enabled' => true,
        'threshold' => 5, // Alert after 5 failed attempts
        'window_minutes' => 15, // Within 15 minutes
        'severity' => 'high',
        'auto_block' => env('SECURITY_AUTO_BLOCK_FAILED_AUTH', false),
        'block_duration_minutes' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limit Violation Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when users repeatedly exceed rate limits.
    |
    */

    'rate_limit_violations' => [
        'enabled' => true,
        'threshold' => 10, // Alert after 10 violations
        'window_minutes' => 60, // Within 1 hour
        'severity' => 'medium',
        'auto_block' => env('SECURITY_AUTO_BLOCK_RATE_LIMIT', false),
        'block_duration_minutes' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Suspicious File Upload Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when suspicious file uploads are detected.
    |
    */

    'suspicious_file_uploads' => [
        'enabled' => true,
        'threshold' => 3, // Alert after 3 suspicious uploads
        'window_minutes' => 30, // Within 30 minutes
        'severity' => 'high',
        'alert_on_first' => true, // Alert immediately on first suspicious upload
        'blocked_extensions' => [
            'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 
            'jar', 'sh', 'php', 'py', 'rb', 'pl', 'asp', 'aspx'
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Token Decryption Failure Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when social token decryption fails (possible key compromise).
    |
    */

    'token_decryption_failures' => [
        'enabled' => true,
        'threshold' => 1, // Alert immediately
        'severity' => 'critical',
        'alert_on_first' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Dangerous Content Detection Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when AI-generated content contains dangerous elements.
    |
    */

    'dangerous_content_detected' => [
        'enabled' => true,
        'threshold' => 5, // Alert after 5 detections
        'window_minutes' => 60, // Within 1 hour
        'severity' => 'medium',
        'alert_on_first' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | Role Change Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when user roles are modified (especially elevation to admin).
    |
    */

    'role_changes' => [
        'enabled' => true,
        'severity' => 'high',
        'alert_on_admin_elevation' => true, // Always alert when user becomes admin
        'alert_on_any_change' => env('SECURITY_ALERT_ALL_ROLE_CHANGES', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration Change Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when system configuration is modified.
    |
    */

    'configuration_changes' => [
        'enabled' => true,
        'severity' => 'high',
        'alert_on_first' => true,
        'sensitive_keys' => [
            'app.key',
            'database.connections',
            'services.*.key',
            'services.*.secret',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Critical Data Deletion Alerts
    |--------------------------------------------------------------------------
    |
    | Alert when critical data is deleted.
    |
    */

    'critical_data_deletion' => [
        'enabled' => true,
        'severity' => 'high',
        'alert_on_first' => true,
        'models' => [
            'App\Models\User',
            'App\Models\SocialAccount',
            'App\Models\Workspace',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | 2FA Events Alerts
    |--------------------------------------------------------------------------
    |
    | Alert on 2FA-related security events.
    |
    */

    'two_factor_events' => [
        'enabled' => true,
        'alert_on_disable' => true, // Alert when 2FA is disabled
        'alert_on_failed_attempts' => true,
        'failed_attempts_threshold' => 5,
        'severity' => 'high',
    ],

    /*
    |--------------------------------------------------------------------------
    | Unusual Access Patterns
    |--------------------------------------------------------------------------
    |
    | Alert on unusual access patterns (e.g., access from new location).
    |
    */

    'unusual_access_patterns' => [
        'enabled' => env('SECURITY_UNUSUAL_ACCESS_ENABLED', false),
        'alert_on_new_ip' => true,
        'alert_on_new_country' => true,
        'alert_on_impossible_travel' => true, // Access from distant locations in short time
        'severity' => 'medium',
    ],

    /*
    |--------------------------------------------------------------------------
    | Alert Throttling
    |--------------------------------------------------------------------------
    |
    | Prevent alert spam by throttling repeated alerts.
    |
    */

    'throttling' => [
        'enabled' => true,
        'max_alerts_per_hour' => 10, // Maximum alerts per type per hour
        'cooldown_minutes' => 60, // Wait before sending same alert again
    ],

    /*
    |--------------------------------------------------------------------------
    | Alert Formatting
    |--------------------------------------------------------------------------
    |
    | Configure how alerts are formatted.
    |
    */

    'formatting' => [
        'include_user_details' => true,
        'include_ip_address' => true,
        'include_user_agent' => true,
        'include_timestamp' => true,
        'include_request_details' => true,
        'timezone' => env('APP_TIMEZONE', 'UTC'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Severity Levels
    |--------------------------------------------------------------------------
    |
    | Define what each severity level means for your organization.
    |
    */

    'severity_levels' => [
        'critical' => [
            'description' => 'Immediate action required',
            'color' => '#FF0000',
            'emoji' => '🚨',
        ],
        'high' => [
            'description' => 'Urgent attention needed',
            'color' => '#FF6B00',
            'emoji' => '⚠️',
        ],
        'medium' => [
            'description' => 'Should be reviewed soon',
            'color' => '#FFD700',
            'emoji' => '⚡',
        ],
        'low' => [
            'description' => 'Informational',
            'color' => '#00FF00',
            'emoji' => 'ℹ️',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Testing Mode
    |--------------------------------------------------------------------------
    |
    | When enabled, alerts are logged but not sent to external channels.
    |
    */

    'testing_mode' => env('SECURITY_ALERTS_TESTING_MODE', false),
];
