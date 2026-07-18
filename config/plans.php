<?php

/**
 * ============================================================================
 * CONFIGURACIÓN DE PLANES - Intellipost (Backend)
 * ============================================================================
 *
 * Este archivo define los planes de suscripción disponibles en el sistema.
 *
 * CÓMO OCULTAR UN PLAN:
 * ---------------------
 * Cambiar 'enabled' => true a 'enabled' => false
 *
 * EJEMPLO - Ocultar el plan Enterprise:
 *
 *   'enterprise' => [
 *       'enabled' => false,  // ← Cambiar a false
 *       ...
 *   ]
 *
 * IMPORTANTE:
 * -----------
 * - Los planes con enabled => false NO aparecerán en la página de precios
 * - Los usuarios existentes con ese plan mantendrán su suscripción
 * - Los límites y características se mantienen para usuarios existentes
 * - El plan Free siempre debe estar habilitado (es el plan por defecto)
 *
 * SINCRONIZACIÓN:
 * ---------------
 * Este archivo debe estar sincronizado con:
 * - Frontend: resources/js/constants/plans.ts
 * - Stripe Dashboard: Precios y productos
 * - Variables de entorno: STRIPE_*_PRICE_ID
 *
 * ============================================================================
 */

return [
    'demo' => [
        'name' => 'Demo',
        'price' => 0,
        'stripe_price_id' => null,
        'enabled' => env('DEMO_PLAN_ENABLED', true), // ← Cambiar a false para ocultar
        'trial_days' => 30,
        'billing_cycle' => 'trial',
        'limits' => [
            // Límites por workspace (compartidos entre miembros)
            'publications_per_month' => 100,
            'social_accounts' => -1, // unlimited en demo
            'storage_gb' => 50,
            'team_members' => 10,
            'discord_channels' => 5,
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type'        => 'advanced',
            'advanced_scheduling'   => true,
            'scheduling_recurrence' => true,
            'queue_publishing'      => true,
            'optimal_times'         => true,
            'calendar_sync'         => true,
            'bulk_operations'       => true,
            'custom_branding'       => false,
            'white_label'           => false,
            'api_access'            => false,
            'support_type'          => 'email',
            'demo_badge'            => true,
            'approval_workflows'    => 'basic',   // demo gets basic approvals
            'history_days'          => 90,         // 90 days for demo
        ],
        'description' => 'Acceso completo a la plataforma durante 30 días: publicaciones, analytics avanzados y aprobaciones para evaluar todo el producto.',
    ],

    // ========================================
    // PLAN FREE - Gratis para siempre
    // ========================================
    'free' => [
        'name' => 'Free',
        'price' => 0,
        'stripe_price_id' => null,
        'enabled' => true, // ← Cambiar a false para ocultar
        'billing_cycle' => 'monthly',
        'limits' => [
            // Límites por workspace
            'publications_per_month' => 3,
            'social_accounts' => 1,
            'storage_gb' => 1,
            'team_members' => 1,
            'discord_channels' => 0,
            'reels_watermark' => true,
        ],
        'features' => [
            'analytics_type'        => 'basic',
            'advanced_scheduling'   => false,
            'scheduling_recurrence' => false,
            'queue_publishing'      => false,
            'optimal_times'         => false,
            'calendar_sync'         => false,
            'bulk_operations'       => false,
            'custom_branding'       => false,
            'white_label'           => false,
            'api_access'            => false,
            'support_type'          => 'email',
            'approval_workflows'    => false,
            'history_days'          => 30,
        ],
        'description' => 'Empieza gratis: 3 publicaciones al mes, 1 cuenta social y 1 GB de almacenamiento para conocer la plataforma.',
    ],

    'starter' => [
        'name' => 'Starter',
        'price' => 19,
        'stripe_price_id' => env('STRIPE_STARTER_PRICE_ID'),
        'enabled' => true, // ← Cambiar a false para ocultar
        'billing_cycle' => 'monthly',
        'limits' => [
            // Límites por workspace
            'publications_per_month' => 50,
            'social_accounts' => 3,
            'storage_gb' => 10,
            'team_members' => 3,
            'discord_channels' => 1,
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type'        => 'basic',
            'advanced_scheduling'   => true,
            'scheduling_recurrence' => false,  // basic scheduling only
            'queue_publishing'      => false,
            'optimal_times'         => false,
            'calendar_sync'         => true,
            'bulk_operations'       => false,
            'custom_branding'       => false,
            'white_label'           => false,
            'api_access'            => false,
            'support_type'          => 'email',
            'approval_workflows'    => false,  // no approvals on starter
            'history_days'          => 30,
        ],
        'description' => 'Para emprendedores y equipos pequeños: 50 publicaciones al mes, 3 cuentas sociales, programación avanzada y sincronización de calendario.',
    ],

    'growth' => [
        'name' => 'Growth',
        'price' => 35,
        'stripe_price_id' => env('STRIPE_GROWTH_PRICE_ID'),
        'enabled' => true, // ← Cambiar a false para ocultar
        'billing_cycle' => 'monthly',
        'limits' => [
            // Límites por workspace
            'publications_per_month' => 100,
            'social_accounts' => 5,
            'storage_gb' => 50,
            'team_members' => 5,
            'discord_channels' => 2,
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type'        => 'advanced',
            'advanced_scheduling'   => true,
            'scheduling_recurrence' => true,
            'queue_publishing'      => false,
            'optimal_times'         => true,
            'calendar_sync'         => true,
            'bulk_operations'       => false,
            'custom_branding'       => false,
            'white_label'           => false,
            'api_access'            => false,
            'support_type'          => 'email',
            'approval_workflows'    => false,  // Growth NO tiene aprobaciones
            'history_days'          => 60,
        ],
        'description' => 'Para equipos en crecimiento: 100 publicaciones al mes, 5 cuentas sociales, analytics avanzados, recurrencia y horarios óptimos.',
    ],

    'professional' => [
        'name' => 'Professional',
        'price' => 49,
        'stripe_price_id' => env('STRIPE_PROFESSIONAL_PRICE_ID'),
        'enabled' => true, // ← Cambiar a false para ocultar
        'billing_cycle' => 'monthly',
        'limits' => [
            // Límites por workspace
            'publications_per_month' => 200,
            'social_accounts' => 8,
            'storage_gb' => 100,
            'team_members' => 10,
            'discord_channels' => 5,
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type'        => 'advanced',
            'advanced_scheduling'   => true,
            'scheduling_recurrence' => true,
            'queue_publishing'      => true,
            'optimal_times'         => true,
            'calendar_sync'         => true,
            'bulk_operations'       => true,
            'custom_branding'       => true,
            'white_label'           => false,
            'api_access'            => false,
            'support_type'          => 'priority',
            'approval_workflows'    => 'basic',   // single-level approvals
            'history_days'          => 90,
        ],
        'description' => 'Para equipos profesionales: 200 publicaciones al mes, 8 cuentas sociales, cola de publicación, operaciones masivas, branding propio y aprobaciones.',
    ],

    'enterprise' => [
        'name' => 'Enterprise',
        'price' => 199,
        'stripe_price_id' => env('STRIPE_ENTERPRISE_PRICE_ID'),
        'enabled' => true, // ← Cambiar a false para ocultar
        'billing_cycle' => 'monthly',
        'limits' => [
            // Límites por workspace
            'publications_per_month' => -1, // unlimited
            'social_accounts' => -1, // unlimited
            'storage_gb' => 1000, // 1TB
            'team_members' => -1, // unlimited
            'discord_channels' => -1, // unlimited
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type'        => 'advanced',
            'advanced_scheduling'   => true,
            'scheduling_recurrence' => true,
            'queue_publishing'      => true,
            'optimal_times'         => true,
            'calendar_sync'         => true,
            'bulk_operations'       => true,
            'custom_branding'       => true,
            'white_label'           => true,
            'api_access'            => true,
            'custom_integrations'   => true,
            'sla_guarantee'         => true,
            'support_type'          => 'dedicated',
            'approval_workflows'    => 'advanced', // multi-level approvals
            'history_days'          => 365,
        ],
        'description' => 'Para grandes organizaciones: publicaciones y cuentas ilimitadas, 1 TB de almacenamiento, white label, API, SLA y aprobaciones multinivel.',
    ],
];
