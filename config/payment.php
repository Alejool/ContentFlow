<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway
    |--------------------------------------------------------------------------
    |
    | Gateway por defecto cuando no se puede determinar por país
    |
    */
    'default_gateway' => env('PAYMENT_DEFAULT_GATEWAY', 'stripe'),

    /*
    |--------------------------------------------------------------------------
    | Gateway por País (Principal)
    |--------------------------------------------------------------------------
    |
    | Mapeo de código de país ISO 3166-1 alpha-2 a gateway preferido
    |
    */
    'country_gateways' => [
        // Colombia - Pasarelas locales
        'CO' => env('PAYMENT_GATEWAY_CO', 'wompi'), // wompi, mercadopago, epayco, payu

        // Otros países latinoamericanos
        'MX' => 'mercadopago', // México
        'AR' => 'mercadopago', // Argentina
        'BR' => 'mercadopago', // Brasil
        'CL' => 'mercadopago', // Chile
        'PE' => 'payu',        // Perú
        'PA' => 'payu',        // Panamá

        // Países con Stripe
        'US' => 'stripe',
        'CA' => 'stripe',
        'GB' => 'stripe',
        'AU' => 'stripe',
        'NZ' => 'stripe',
        'IE' => 'stripe',
        'FR' => 'stripe',
        'DE' => 'stripe',
        'ES' => 'stripe',
        'IT' => 'stripe',
        'NL' => 'stripe',
        'BE' => 'stripe',
        'AT' => 'stripe',
        'CH' => 'stripe',
        'SE' => 'stripe',
        'NO' => 'stripe',
        'DK' => 'stripe',
        'FI' => 'stripe',
        'PT' => 'stripe',
        'PL' => 'stripe',
        'CZ' => 'stripe',
        'GR' => 'stripe',
        'RO' => 'stripe',
        'BG' => 'stripe',
        'HU' => 'stripe',
        'SK' => 'stripe',
        'SI' => 'stripe',
        'HR' => 'stripe',
        'LT' => 'stripe',
        'LV' => 'stripe',
        'EE' => 'stripe',
        'CY' => 'stripe',
        'MT' => 'stripe',
        'LU' => 'stripe',
        'JP' => 'stripe',
        'SG' => 'stripe',
        'HK' => 'stripe',
        'MY' => 'stripe',
        'TH' => 'stripe',
        'ID' => 'stripe',
        'PH' => 'stripe',
        'IN' => 'stripe',
        'AE' => 'stripe',
        'SA' => 'stripe',
        'IL' => 'stripe',
        'ZA' => 'stripe',
    ],

    /*
    |--------------------------------------------------------------------------
    | Múltiples Gateways por País (Opcional)
    |--------------------------------------------------------------------------
    |
    | Permite ofrecer múltiples opciones de pago al usuario
    |
    */
    'country_gateways_multiple' => [
        'CO' => ['wompi', 'mercadopago', 'epayco', 'payu'], // Colombia: 4 opciones
        'MX' => ['mercadopago', 'payu'],
        'PE' => ['payu', 'mercadopago'],
        'AR' => ['mercadopago'],
        'BR' => ['mercadopago'],
        'CL' => ['mercadopago'],
        'PA' => ['payu'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Países Soportados por Stripe
    |--------------------------------------------------------------------------
    |
    | Lista completa de países donde Stripe está disponible
    | https://stripe.com/global
    |
    */
    'stripe_countries' => [
        'US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL',
        'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PT', 'PL', 'CZ', 'GR',
        'RO', 'BG', 'HU', 'SK', 'SI', 'HR', 'LT', 'LV', 'EE', 'CY', 'MT',
        'LU', 'JP', 'SG', 'HK', 'MY', 'TH', 'ID', 'PH', 'IN', 'AE', 'SA',
        'IL', 'ZA',
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Monedas
    |--------------------------------------------------------------------------
    |
    | Monedas soportadas por país
    |
    */
    'currencies' => [
        'CO' => 'COP', // Peso colombiano
        'MX' => 'MXN', // Peso mexicano
        'AR' => 'ARS', // Peso argentino
        'BR' => 'BRL', // Real brasileño
        'CL' => 'CLP', // Peso chileno
        'PE' => 'PEN', // Sol peruano
        'PA' => 'USD', // Dólar (Panamá usa USD)
        'US' => 'USD',
        'CA' => 'CAD',
        'GB' => 'GBP',
        'EU' => 'EUR',
        'AU' => 'AUD',
        'JP' => 'JPY',
        'IN' => 'INR',
    ],

    /*
    |--------------------------------------------------------------------------
    | Tasas de Cambio (USD base)
    |--------------------------------------------------------------------------
    |
    | Tasas de cambio aproximadas. Actualizar periódicamente o usar API
    |
    */
    'exchange_rates' => [
        'COP' => 4000,  // 1 USD = 4000 COP
        'MXN' => 20,    // 1 USD = 20 MXN
        'ARS' => 350,   // 1 USD = 350 ARS
        'BRL' => 5,     // 1 USD = 5 BRL
        'CLP' => 900,   // 1 USD = 900 CLP
        'PEN' => 3.8,   // 1 USD = 3.8 PEN
        'CAD' => 1.35,  // 1 USD = 1.35 CAD
        'GBP' => 0.79,  // 1 USD = 0.79 GBP
        'EUR' => 0.92,  // 1 USD = 0.92 EUR
        'AUD' => 1.52,  // 1 USD = 1.52 AUD
        'JPY' => 149,   // 1 USD = 149 JPY
        'INR' => 83,    // 1 USD = 83 INR
    ],

    /*
    |--------------------------------------------------------------------------
    | Detección de País
    |--------------------------------------------------------------------------
    |
    | Métodos para detectar el país del usuario
    |
    */
    'country_detection' => [
        'enabled' => true,
        'methods' => [
            'user_profile',  // Desde perfil de usuario
            'ip_geolocation', // Desde IP (usar servicio como ipapi.co)
            'browser_locale', // Desde navegador
        ],
        'default_country' => 'US', // País por defecto si no se puede detectar
    ],

    /*
    |--------------------------------------------------------------------------
    | Métodos de Pago Disponibles
    |--------------------------------------------------------------------------
    |
    | Define qué métodos de pago están disponibles en el sistema.
    | Solo los métodos listados aquí podrán ser habilitados en system_settings.
    |
    */
    'available_methods' => [
        'stripe' => [
            'name' => 'Stripe',
            'description' => 'Tarjetas de crédito/débito internacionales',
            'countries' => ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PT', 'PL', 'CZ', 'GR', 'RO', 'BG', 'HU', 'SK', 'SI', 'HR', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'JP', 'SG', 'HK', 'MY', 'TH', 'ID', 'PH', 'IN', 'AE', 'SA', 'IL', 'ZA'],
            'enabled_by_default' => true,
        ],
        'wompi' => [
            'name' => 'Wompi',
            'description' => 'PSE, Nequi, tarjetas (Colombia)',
            'countries' => ['CO'],
            'enabled_by_default' => true,
        ],
        'mercadopago' => [
            'name' => 'Mercado Pago',
            'description' => 'Pagos en América Latina',
            'countries' => ['MX', 'AR', 'BR', 'CL', 'CO', 'PE'],
            'enabled_by_default' => true,
        ],
        'payu' => [
            'name' => 'PayU',
            'description' => 'Pagos en Latinoamérica',
            'countries' => ['CO', 'MX', 'PE', 'PA', 'AR', 'BR', 'CL'],
            'enabled_by_default' => true,
        ],
        'epayco' => [
            'name' => 'ePayco',
            'description' => 'Pagos en Colombia',
            'countries' => ['CO'],
            'enabled_by_default' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Webhooks
    |--------------------------------------------------------------------------
    |
    | Configuración de webhooks por gateway
    |
    */
    'webhooks' => [
        'stripe' => [
            'path' => '/webhooks/stripe',
            'secret' => env('STRIPE_WEBHOOK_SECRET'),
        ],
        'mercadopago' => [
            'path' => '/webhooks/mercadopago',
            'secret' => env('MERCADOPAGO_WEBHOOK_SECRET'),
        ],
        'epayco' => [
            'path' => '/webhooks/epayco',
            'secret' => env('EPAYCO_WEBHOOK_SECRET'),
        ],
        'payu' => [
            'path' => '/webhooks/payu',
            'secret' => env('PAYU_WEBHOOK_SECRET'),
        ],
        'wompi' => [
            'path' => '/webhooks/wompi',
            'secret' => env('WOMPI_EVENT_SECRET'),
        ],
    ],
];
