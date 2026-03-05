<?php

return [
    'demo' => [
        'name' => 'Demo',
        'price' => 0,
        'stripe_price_id' => null,
        'enabled' => env('DEMO_PLAN_ENABLED', true),
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
    
    'free' => [
        'name' => 'Free',
        'price' => 0,
        'stripe_price_id' => null,
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
