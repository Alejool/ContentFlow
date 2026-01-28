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

  'paths' => ['api/*', 'sanctum/csrf-cookie'],

  'allowed_methods' => ['*'],

  'allowed_origins' => [
    'http://localhost:5173',
    'http://localhost',
    'http://127.0.0.1:5173',
    'http://100.125.246.50:5173',
    'http://leviathan-port.tail4af8a1.ts.net',
    'https://leviathan-port.tail4af8a1.ts.net',
    'https://contenflow.fly.dev',
  ],

  'allowed_origins_patterns' => [],

  'allowed_headers' => ['*'],

  'exposed_headers' => [],

  'max_age' => 0,

  'supports_credentials' => true,

];
