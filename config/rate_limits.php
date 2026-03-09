<?php

/**
 * ============================================================================
 * CONFIGURACIÓN DE LÍMITES GRANULARES - ContentFlow
 * ============================================================================
 *
 * Este archivo define límites adicionales más específicos para cada plan.
 * Complementa los límites básicos definidos en config/plans.php
 *
 * TIPOS DE LÍMITES:
 * -----------------
 * 1. Límites diarios: Evitar uso abusivo en períodos cortos
 * 2. Límites de concurrencia: Máximo de operaciones simultáneas
 * 3. Rate limiting: Requests por minuto/hora
 * 4. Límites de recursos: Campañas, workflows, integraciones
 *
 * ============================================================================
 */

return [
    'demo' => [
        // Límites de publicaciones
        'publications_per_day' => 20,
        'publications_simultaneous' => 10,
        
        // Rate limiting API
        'api_requests_per_minute' => 60,
        'api_requests_per_hour' => 1000,
        
        // Límites de recursos
        'active_campaigns' => 10,
        'approval_workflows' => 5,
        'external_integrations' => [
            'discord_webhooks' => 5,
            'slack_webhooks' => 5,
            'custom_webhooks' => 10,
        ],
        
        // Límites de exportación
        'exports_per_month' => 50,
        'export_max_rows' => 10000,
        
        // Límites de workspace
        'workspaces_per_user' => 5,
        
        // Límites de media
        'max_file_size_mb' => 500,
        'max_video_duration_minutes' => 30,
    ],

    'free' => [
        // Límites de publicaciones
        'publications_per_day' => 1,
        'publications_simultaneous' => 1,
        
        // Rate limiting API
        'api_requests_per_minute' => 10,
        'api_requests_per_hour' => 100,
        
        // Límites de recursos
        'active_campaigns' => 1,
        'approval_workflows' => 0,
        'external_integrations' => [
            'discord_webhooks' => 0,
            'slack_webhooks' => 0,
            'custom_webhooks' => 0,
        ],
        
        // Límites de exportación
        'exports_per_month' => 5,
        'export_max_rows' => 1000,
        
        // Límites de workspace
        'workspaces_per_user' => 1,
        
        // Límites de media
        'max_file_size_mb' => 50,
        'max_video_duration_minutes' => 5,
    ],

    'starter' => [
        // Límites de publicaciones
        'publications_per_day' => 10,
        'publications_simultaneous' => 3,
        
        // Rate limiting API
        'api_requests_per_minute' => 30,
        'api_requests_per_hour' => 500,
        
        // Límites de recursos
        'active_campaigns' => 5,
        'approval_workflows' => 2,
        'external_integrations' => [
            'discord_webhooks' => 1,
            'slack_webhooks' => 1,
            'custom_webhooks' => 2,
        ],
        
        // Límites de exportación
        'exports_per_month' => 20,
        'export_max_rows' => 5000,
        
        // Límites de workspace
        'workspaces_per_user' => 2,
        
        // Límites de media
        'max_file_size_mb' => 100,
        'max_video_duration_minutes' => 10,
    ],

    'professional' => [
        // Límites de publicaciones
        'publications_per_day' => 50,
        'publications_simultaneous' => 10,
        
        // Rate limiting API
        'api_requests_per_minute' => 120,
        'api_requests_per_hour' => 5000,
        
        // Límites de recursos
        'active_campaigns' => 20,
        'approval_workflows' => 10,
        'external_integrations' => [
            'discord_webhooks' => 5,
            'slack_webhooks' => 5,
            'custom_webhooks' => 10,
        ],
        
        // Límites de exportación
        'exports_per_month' => 100,
        'export_max_rows' => 50000,
        
        // Límites de workspace
        'workspaces_per_user' => 5,
        
        // Límites de media
        'max_file_size_mb' => 500,
        'max_video_duration_minutes' => 30,
    ],

    'enterprise' => [
        // Límites de publicaciones
        'publications_per_day' => -1, // unlimited
        'publications_simultaneous' => 50,
        
        // Rate limiting API
        'api_requests_per_minute' => 300,
        'api_requests_per_hour' => 20000,
        
        // Límites de recursos
        'active_campaigns' => -1, // unlimited
        'approval_workflows' => -1, // unlimited
        'external_integrations' => [
            'discord_webhooks' => -1,
            'slack_webhooks' => -1,
            'custom_webhooks' => -1,
        ],
        
        // Límites de exportación
        'exports_per_month' => -1, // unlimited
        'export_max_rows' => -1, // unlimited
        
        // Límites de workspace
        'workspaces_per_user' => -1, // unlimited
        
        // Límites de media
        'max_file_size_mb' => 2000, // 2GB
        'max_video_duration_minutes' => 120, // 2 hours
    ],
];
