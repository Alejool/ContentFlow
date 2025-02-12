<?php
return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Aquí puedes configurar la configuración de CORS (Compartición de Recursos
    | entre Orígenes). Esto determina qué operaciones de origen cruzado
    | pueden ejecutarse en los navegadores web. Puedes ajustar esta configuración
    | según sea necesario.
    |
    | Más información: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'],  // Puedes personalizar las rutas aquí

    'allowed_methods' => ['*'],  // Permite todos los métodos HTTP

    'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],  // Agrega las URLs de tus frontend

    'allowed_origins_patterns' => [],  // No es necesario, pero puedes agregar patrones aquí

    'allowed_headers' => ['*'],  // Permite todos los encabezados de solicitud

    'exposed_headers' => [],  // Permite exponer encabezados si es necesario (vacío por defecto)

    'max_age' => 0,  // El tiempo que el navegador puede almacenar en caché las respuestas CORS, en segundos.

    'supports_credentials' => false,  // Cambia a true si deseas enviar credenciales (cookies, etc.)

];
