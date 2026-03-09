<?php

return [
    /*
    |--------------------------------------------------------------------------
    | PayU Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración para el gateway de pagos PayU
    |
    */

    'merchant_id' => env('PAYU_MERCHANT_ID'),
    'api_key' => env('PAYU_API_KEY'),
    'api_login' => env('PAYU_API_LOGIN'),
    'account_id' => env('PAYU_ACCOUNT_ID'),
    'test' => env('PAYU_TEST_MODE', true),
];
