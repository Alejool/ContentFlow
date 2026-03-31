<?php

/**
 * ============================================================================
 * CONFIGURACIÓN DE ADD-ONS - Intellipost
 * ============================================================================
 *
 * Este archivo define los paquetes adicionales (add-ons) disponibles para compra.
 * Los usuarios pueden comprar créditos de IA y almacenamiento adicional.
 *
 * TIPOS DE ADD-ONS:
 * -----------------
 * - ai_credits: Paquetes de solicitudes de IA adicionales
 * - storage: Paquetes de almacenamiento adicional (GB)
 *
 * CONFIGURACIÓN:
 * --------------
 * - sku: Identificador único del paquete
 * - name: Nombre descriptivo
 * - amount: Cantidad de créditos/GB incluidos
 * - price: Precio en USD
 * - stripe_price_id: ID del precio en Stripe
 * - enabled: Si el paquete está disponible para compra
 * - expires_days: Días hasta que expire (null = no expira)
 * - popular: Marcar como opción popular
 *
 * ============================================================================
 */

return [
    'ai_credits' => [
        'enabled' => true,
        'packages' => [
            'ai_100' => [
                'sku' => 'ai_100',
                'name' => '100 Créditos IA',
                'description' => 'Paquete de 100 solicitudes de IA adicionales',
                'amount' => 100,
                'unit' => 'créditos',
                'price' => 9.99,
                'stripe_price_id' => env('STRIPE_AI_100_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null, // No expira
                'popular' => false,
                'savings_percentage' => 0,
            ],
            'ai_500' => [
                'sku' => 'ai_500',
                'name' => '500 Créditos IA',
                'description' => 'Paquete de 500 solicitudes de IA adicionales',
                'amount' => 500,
                'unit' => 'créditos',
                'price' => 39.99,
                'stripe_price_id' => env('STRIPE_AI_500_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => true,
                'savings_percentage' => 20, // 20% de ahorro vs comprar 5x100
            ],
            'ai_1000' => [
                'sku' => 'ai_1000',
                'name' => '1,000 Créditos IA',
                'description' => 'Paquete de 1,000 solicitudes de IA adicionales',
                'amount' => 1000,
                'unit' => 'créditos',
                'price' => 69.99,
                'stripe_price_id' => env('STRIPE_AI_1000_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => false,
                'savings_percentage' => 30, // 30% de ahorro
            ],
            'ai_5000' => [
                'sku' => 'ai_5000',
                'name' => '5,000 Créditos IA',
                'description' => 'Paquete de 5,000 solicitudes de IA adicionales',
                'amount' => 5000,
                'unit' => 'créditos',
                'price' => 299.99,
                'stripe_price_id' => env('STRIPE_AI_5000_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => false,
                'savings_percentage' => 40, // 40% de ahorro
            ],
        ],
    ],

    'storage' => [
        'enabled' => true,
        'packages' => [
            'storage_10gb' => [
                'sku' => 'storage_10gb',
                'name' => '10 GB Almacenamiento',
                'description' => '10 GB de almacenamiento adicional',
                'amount' => 10, // GB
                'unit' => 'GB',
                'price' => 4.99,
                'stripe_price_id' => env('STRIPE_STORAGE_10GB_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null, // No expira
                'popular' => false,
                'savings_percentage' => 0,
            ],
            'storage_50gb' => [
                'sku' => 'storage_50gb',
                'name' => '50 GB Almacenamiento',
                'description' => '50 GB de almacenamiento adicional',
                'amount' => 50, // GB
                'unit' => 'GB',
                'price' => 19.99,
                'stripe_price_id' => env('STRIPE_STORAGE_50GB_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => true,
                'savings_percentage' => 20, // 20% de ahorro
            ],
            'storage_100gb' => [
                'sku' => 'storage_100gb',
                'name' => '100 GB Almacenamiento',
                'description' => '100 GB de almacenamiento adicional',
                'amount' => 100, // GB
                'unit' => 'GB',
                'price' => 34.99,
                'stripe_price_id' => env('STRIPE_STORAGE_100GB_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => false,
                'savings_percentage' => 30, // 30% de ahorro
            ],
            'storage_500gb' => [
                'sku' => 'storage_500gb',
                'name' => '500 GB Almacenamiento',
                'description' => '500 GB de almacenamiento adicional',
                'amount' => 500, // GB
                'unit' => 'GB',
                'price' => 149.99,
                'stripe_price_id' => env('STRIPE_STORAGE_500GB_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => false,
                'savings_percentage' => 40, // 40% de ahorro
            ],
        ],
    ],

    'team_members' => [
        'enabled' => true,
        'packages' => [
            'members_5' => [
                'sku' => 'members_5',
                'name' => '5 Miembros Adicionales',
                'description' => 'Agrega 5 miembros más a tu equipo',
                'amount' => 5,
                'unit' => 'miembros',
                'price' => 14.99,
                'stripe_price_id' => env('STRIPE_MEMBERS_5_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => false,
                'savings_percentage' => 0,
            ],
            'members_10' => [
                'sku' => 'members_10',
                'name' => '10 Miembros Adicionales',
                'description' => 'Agrega 10 miembros más a tu equipo',
                'amount' => 10,
                'unit' => 'miembros',
                'price' => 24.99,
                'stripe_price_id' => env('STRIPE_MEMBERS_10_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => true,
                'savings_percentage' => 17, // ~17% de ahorro
            ],
            'members_25' => [
                'sku' => 'members_25',
                'name' => '25 Miembros Adicionales',
                'description' => 'Agrega 25 miembros más a tu equipo',
                'amount' => 25,
                'unit' => 'miembros',
                'price' => 49.99,
                'stripe_price_id' => env('STRIPE_MEMBERS_25_PRICE_ID'),
                'enabled' => true,
                'expires_days' => null,
                'popular' => false,
                'savings_percentage' => 33, // 33% de ahorro
            ],
        ],
    ],

    'publications' => [
        'enabled' => true,
        'packages' => [
            'posts_50' => [
                'sku' => 'posts_50',
                'name' => '50 Publicaciones',
                'description' => '50 publicaciones adicionales este mes',
                'amount' => 50,
                'unit' => 'publicaciones',
                'price' => 9.99,
                'stripe_price_id' => env('STRIPE_POSTS_50_PRICE_ID'),
                'enabled' => true,
                'expires_days' => 30, // Expira en 30 días
                'popular' => false,
                'savings_percentage' => 0,
            ],
            'posts_100' => [
                'sku' => 'posts_100',
                'name' => '100 Publicaciones',
                'description' => '100 publicaciones adicionales este mes',
                'amount' => 100,
                'unit' => 'publicaciones',
                'price' => 17.99,
                'stripe_price_id' => env('STRIPE_POSTS_100_PRICE_ID'),
                'enabled' => true,
                'expires_days' => 30,
                'popular' => true,
                'savings_percentage' => 10, // 10% de ahorro
            ],
            'posts_250' => [
                'sku' => 'posts_250',
                'name' => '250 Publicaciones',
                'description' => '250 publicaciones adicionales este mes',
                'amount' => 250,
                'unit' => 'publicaciones',
                'price' => 39.99,
                'stripe_price_id' => env('STRIPE_POSTS_250_PRICE_ID'),
                'enabled' => true,
                'expires_days' => 30,
                'popular' => false,
                'savings_percentage' => 20, // 20% de ahorro
            ],
            'posts_500' => [
                'sku' => 'posts_500',
                'name' => '500 Publicaciones',
                'description' => '500 publicaciones adicionales este mes',
                'amount' => 500,
                'unit' => 'publicaciones',
                'price' => 69.99,
                'stripe_price_id' => env('STRIPE_POSTS_500_PRICE_ID'),
                'enabled' => true,
                'expires_days' => 30,
                'popular' => false,
                'savings_percentage' => 30, // 30% de ahorro
            ],
        ],
    ],

    /**
     * Configuración general de add-ons
     */
    'settings' => [
        // Permitir múltiples compras del mismo paquete
        'allow_multiple_purchases' => true,

        // Acumular créditos de múltiples paquetes
        'accumulate_credits' => true,

        // Usar add-ons antes que los límites del plan
        'use_addons_first' => true,

        // Notificar cuando los add-ons estén por agotarse
        'notify_low_balance' => true,
        'low_balance_threshold' => 0.2, // 20% restante

        // Permitir reembolsos
        'allow_refunds' => true,
        'refund_days' => 7, // Días para solicitar reembolso
    ],
];
