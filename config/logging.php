<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;
use App\Logging\JsonFormatter;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Log Channel
    |--------------------------------------------------------------------------
    */

    'default' => env('LOG_CHANNEL', 'daily'),

    /*
    |--------------------------------------------------------------------------
    | Deprecations Log Channel
    |--------------------------------------------------------------------------
    */

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'daily'),
        'trace' => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Log Channels
    |--------------------------------------------------------------------------
    */

    'channels' => [

        'stack' => [
            'driver' => 'stack',
            'channels' => explode(',', env('LOG_STACK', 'single')),
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => env('LOG_DAILY_DAYS', 14),
            'replace_placeholders' => true,
        ],

        // ========================================
        // LOGS ESTRUCTURADOS POR MÓDULO (JSON)
        // ========================================

        'uploads' => [
            'driver' => 'daily',
            'path' => storage_path('logs/uploads.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'publications' => [
            'driver' => 'daily',
            'path' => storage_path('logs/publications.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'campaigns' => [
            'driver' => 'daily',
            'path' => storage_path('logs/campaigns.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'billing' => [
            'driver' => 'daily',
            'path' => storage_path('logs/billing.log'),
            'level' => env('LOG_LEVEL', 'info'),
            'days' => 90, // Mantener más tiempo por auditoría
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/api.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'jobs' => [
            'driver' => 'daily',
            'path' => storage_path('logs/jobs.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'auth' => [
            'driver' => 'daily',
            'path' => storage_path('logs/auth.log'),
            'level' => env('LOG_LEVEL', 'info'),
            'days' => 90, // Mantener más tiempo por seguridad
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'social' => [
            'driver' => 'daily',
            'path' => storage_path('logs/social.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'errors' => [
            'driver' => 'daily',
            'path' => storage_path('logs/errors.log'),
            'level' => 'error',
            'days' => 60,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'performance' => [
            'driver' => 'daily',
            'path' => storage_path('logs/performance.log'),
            'level' => env('LOG_LEVEL', 'info'),
            'days' => 14,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        'security' => [
            'driver' => 'daily',
            'path' => storage_path('logs/security.log'),
            'level' => env('LOG_LEVEL', 'warning'),
            'days' => 90,
            'tap' => [App\Logging\CustomizeFormatter::class],
        ],

        // ========================================
        // CANALES EXTERNOS
        // ========================================

        'slack' => [
            'driver' => 'slack',
            'url' => env('LOG_SLACK_WEBHOOK_URL'),
            'username' => env('LOG_SLACK_USERNAME', 'ContentFlow'),
            'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
            'level' => env('LOG_LEVEL', 'critical'),
            'replace_placeholders' => true,
        ],

        'papertrail' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => env('LOG_PAPERTRAIL_HANDLER', SyslogUdpHandler::class),
            'handler_with' => [
                'host' => env('PAPERTRAIL_URL'),
                'port' => env('PAPERTRAIL_PORT'),
                'connectionString' => 'tls://'.env('PAPERTRAIL_URL').':'.env('PAPERTRAIL_PORT'),
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'with' => [
                'stream' => 'php://stderr',
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'syslog' => [
            'driver' => 'syslog',
            'level' => env('LOG_LEVEL', 'debug'),
            'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
            'replace_placeholders' => true,
        ],

        'errorlog' => [
            'driver' => 'errorlog',
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'null' => [
            'driver' => 'monolog',
            'handler' => NullHandler::class,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],

        'deprecations' => [
            'driver' => 'single',
            'path' => storage_path('logs/deprecations.log'),
            'level' => 'warning',
        ],

    ],

];
