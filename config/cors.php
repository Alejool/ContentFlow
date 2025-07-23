<?php
return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you can configure your settings for Cross-Origin Resource Sharing
    | (CORS). This determines what cross-origin operations can be executed
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'],  // You can customize the paths here

    'allowed_methods' => ['*'],  // Allows all HTTP methods

    'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],  // Add your frontend URLs

    'allowed_origins_patterns' => [],  // Not necessary, but you can add patterns here

    'allowed_headers' => ['*'],  // Allows all request headers

    'exposed_headers' => [],  // Allows exposing headers if necessary (empty by default)

    'max_age' => 0,  // The time the browser can cache CORS responses, in seconds.

    'supports_credentials' => true,  // Change to true if you want to send credentials (cookies, etc.)

];
