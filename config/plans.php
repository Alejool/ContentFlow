<?php

/**
 * ============================================================================
 * CONFIGURACIÓN DE PLANES - ContentFlow (Backend)
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
            'social_accounts' => 20,
            'storage_gb' => 50,
            'ai_requests_per_month' => 500,
            'team_members' => 10,
            'external_integrations' => 3,
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type' => 'advanced',
            'advanced_scheduling' => true,
            'calendar_sync' => true,
            'bulk_operations' => true,
            'custom_branding' => false,
            'white_label' => false,
            'api_access' => false,
            'support_type' => 'email',
            'demo_badge' => true,
        ],
        'description' => 'Plan temporal para demos y pruebas. Acceso completo por 30 días.',
    ],
    
    // ========================================
    // PLAN FREE - Gratis para siempre
    // ========================================
    // COMENTAR TODO ESTE BLOQUE PARA OCULTAR EL PLAN FREE
    // free: [
    //     'name' => 'Free',
    //     'price' => 0,
    //     'stripe_price_id' => null,
    //     'enabled' => false, // ← Plan oculto
    //     'billing_cycle' => 'monthly',
    //     'limits' => [
    //         'publications_per_month' => 3,
    //         'social_accounts' => 2,
    //         'storage_gb' => 1,
    //         'ai_requests_per_month' => 10,
    //         'team_members' => 1,
    //         'external_integrations' => 0,
    //         'reels_watermark' => true,
    //     ],
    //     'features' => [
    //         'analytics_type' => 'basic',
    //         'advanced_scheduling' => false,
    //         'calendar_sync' => false,
    //         'bulk_operations' => false,
    //         'custom_branding' => false,
    //         'white_label' => false,
    //         'api_access' => false,
    //         'support_type' => 'email',
    //     ],
    //     'description' => 'Plan gratuito para comenzar.',
    // ],

    // O SIMPLEMENTE CAMBIAR enabled A false:
    'free' => [
        'name' => 'Free',
        'price' => 0,
        'stripe_price_id' => null,
        'enabled' => false, // ← Cambiar a false para ocultar
        'billing_cycle' => 'monthly',
        'limits' => [
            // Límites por workspace
            'publications_per_month' => 3,
            'social_accounts' => 2,
            'storage_gb' => 1,
            'ai_requests_per_month' => 10,
            'team_members' => 1,
            'external_integrations' => 0,
            'reels_watermark' => true,
        ],
        'features' => [
            'analytics_type' => 'basic',
            'advanced_scheduling' => false,
            'calendar_sync' => false,
            'bulk_operations' => false,
            'custom_branding' => false,
            'white_label' => false,
            'api_access' => false,
            'support_type' => 'email',
        ],
        'description' => 'Plan gratuito para comenzar.',
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
            'social_accounts' => 10,
            'storage_gb' => 10,
            'ai_requests_per_month' => 100,
            'team_members' => 3,
            'external_integrations' => 2,
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type' => 'basic',
            'advanced_scheduling' => true,
            'calendar_sync' => true,
            'bulk_operations' => false,
            'custom_branding' => false,
            'white_label' => false,
            'api_access' => false,
            'support_type' => 'email',
        ],
        'description' => 'Perfecto para pequeños equipos y emprendedores.',
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
            'social_accounts' => 50,
            'storage_gb' => 100,
            'ai_requests_per_month' => -1, // unlimited
            'team_members' => 10,
            'external_integrations' => 10,
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type' => 'advanced',
            'advanced_scheduling' => true,
            'calendar_sync' => true,
            'bulk_operations' => true,
            'custom_branding' => true,
            'white_label' => false,
            'api_access' => false,
            'support_type' => 'priority',
        ],
        'description' => 'Para equipos profesionales que necesitan más poder.',
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
            'ai_requests_per_month' => -1, // unlimited
            'team_members' => -1, // unlimited
            'external_integrations' => -1, // unlimited
            'reels_watermark' => false,
        ],
        'features' => [
            'analytics_type' => 'advanced',
            'advanced_scheduling' => true,
            'calendar_sync' => true,
            'bulk_operations' => true,
            'custom_branding' => true,
            'white_label' => true,
            'api_access' => true,
            'custom_integrations' => true,
            'sla_guarantee' => true,
            'support_type' => 'dedicated',
        ],
        'description' => 'Solución completa para grandes organizaciones.',
    ],
];
