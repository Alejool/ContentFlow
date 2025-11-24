#!/usr/bin/env php
<?php

/**
 * Script de Verificación de Configuración OAuth
 * 
 * Este script verifica que todas las configuraciones necesarias
 * para el sistema de autenticación de redes sociales estén correctas.
 */

echo "\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║  Verificación de Configuración OAuth - Redes Sociales       ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n";
echo "\n";

// Cargar Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$errors = [];
$warnings = [];
$success = [];

// Verificar variables de entorno
echo "📋 Verificando Variables de Entorno...\n";
echo str_repeat("-", 60) . "\n";

$platforms = [
    'Facebook' => [
        'FACEBOOK_CLIENT_ID',
        'FACEBOOK_CLIENT_SECRET',
        'FACEBOOK_REDIRECT_URI'
    ],
    'Instagram' => [
        'INSTAGRAM_CLIENT_ID',
        'INSTAGRAM_CLIENT_SECRET',
        'INSTAGRAM_REDIRECT_URI'
    ],
    'Twitter' => [
        'TWITTER_CLIENT_ID',
        'TWITTER_CLIENT_SECRET',
        'TWITTER_REDIRECT_URI'
    ],
    'Google/YouTube' => [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI'
    ],
    'TikTok' => [
        'TIKTOK_CLIENT_KEY',
        'TIKTOK_CLIENT_SECRET',
        'TIKTOK_REDIRECT_URI'
    ]
];

foreach ($platforms as $platform => $vars) {
    echo "\n{$platform}:\n";
    $platformConfigured = true;
    
    foreach ($vars as $var) {
        $value = env($var);
        if (empty($value)) {
            echo "  ❌ {$var}: NO CONFIGURADO\n";
            $errors[] = "{$platform}: {$var} no está configurado";
            $platformConfigured = false;
        } else {
            // Ocultar valores sensibles
            $displayValue = substr($value, 0, 10) . '...';
            echo "  ✅ {$var}: {$displayValue}\n";
        }
    }
    
    if ($platformConfigured) {
        $success[] = "{$platform} está completamente configurado";
    }
}

// Verificar configuración de servicios
echo "\n\n📦 Verificando Configuración de Servicios...\n";
echo str_repeat("-", 60) . "\n";

$serviceConfigs = [
    'facebook' => ['client_id', 'client_secret', 'redirect'],
    'instagram' => ['client_id', 'client_secret', 'redirect'],
    'twitter' => ['client_id', 'client_secret', 'redirect'],
    'google' => ['client_id', 'client_secret', 'redirect'],
    'tiktok' => ['client_key', 'client_secret', 'redirect']
];

foreach ($serviceConfigs as $service => $keys) {
    $config = config("services.{$service}");
    
    if (!$config) {
        echo "❌ Configuración de {$service} no encontrada en config/services.php\n";
        $errors[] = "Configuración de {$service} no encontrada";
        continue;
    }
    
    $serviceConfigured = true;
    foreach ($keys as $key) {
        if (empty($config[$key])) {
            $serviceConfigured = false;
            break;
        }
    }
    
    if ($serviceConfigured) {
        echo "✅ {$service}: Configurado correctamente\n";
    } else {
        echo "❌ {$service}: Configuración incompleta\n";
        $errors[] = "{$service} tiene configuración incompleta";
    }
}

// Verificar rutas
echo "\n\n🛣️  Verificando Rutas...\n";
echo str_repeat("-", 60) . "\n";

$routes = [
    'api.social-accounts.index' => 'GET /api/social-accounts',
    'api.social-accounts.auth-url' => 'GET /api/social-accounts/auth-url/{platform}',
    'api.social-accounts.store' => 'POST /api/social-accounts',
    'api.social-accounts.destroy' => 'DELETE /api/social-accounts/{id}'
];

$router = app('router');
$allRoutes = $router->getRoutes();

foreach ($routes as $name => $description) {
    // Verificar si la ruta existe
    $routeExists = false;
    foreach ($allRoutes as $route) {
        if (str_contains($route->uri(), 'social-accounts')) {
            $routeExists = true;
            break;
        }
    }
    
    if ($routeExists) {
        echo "✅ {$description}\n";
    } else {
        echo "⚠️  {$description} - Verificar manualmente\n";
        $warnings[] = "Ruta {$description} no encontrada automáticamente";
    }
}

// Verificar callbacks
$callbacks = [
    '/auth/facebook/callback',
    '/auth/instagram/callback',
    '/auth/twitter/callback',
    '/auth/youtube/callback',
    '/auth/tiktok/callback'
];

echo "\n📞 Callbacks OAuth:\n";
foreach ($callbacks as $callback) {
    $callbackExists = false;
    foreach ($allRoutes as $route) {
        if ($route->uri() === ltrim($callback, '/')) {
            $callbackExists = true;
            break;
        }
    }
    
    if ($callbackExists) {
        echo "✅ {$callback}\n";
    } else {
        echo "❌ {$callback}\n";
        $errors[] = "Callback {$callback} no está registrado";
    }
}

// Verificar base de datos
echo "\n\n🗄️  Verificando Base de Datos...\n";
echo str_repeat("-", 60) . "\n";

try {
    $tableExists = Schema::hasTable('social_accounts');
    
    if ($tableExists) {
        echo "✅ Tabla 'social_accounts' existe\n";
        
        // Verificar columnas
        $requiredColumns = [
            'id', 'user_id', 'platform', 'account_id', 
            'access_token', 'refresh_token', 'token_expires_at',
            'created_at', 'updated_at'
        ];
        
        foreach ($requiredColumns as $column) {
            if (Schema::hasColumn('social_accounts', $column)) {
                echo "  ✅ Columna '{$column}' existe\n";
            } else {
                echo "  ❌ Columna '{$column}' NO existe\n";
                $errors[] = "Columna '{$column}' falta en la tabla social_accounts";
            }
        }
        
        // Contar cuentas conectadas
        $count = DB::table('social_accounts')->count();
        echo "\n📊 Cuentas conectadas: {$count}\n";
        
    } else {
        echo "❌ Tabla 'social_accounts' NO existe\n";
        echo "   Ejecuta: php artisan migrate\n";
        $errors[] = "Tabla social_accounts no existe";
    }
} catch (\Exception $e) {
    echo "❌ Error al verificar base de datos: " . $e->getMessage() . "\n";
    $errors[] = "Error de base de datos: " . $e->getMessage();
}

// Verificar archivos
echo "\n\n📁 Verificando Archivos...\n";
echo str_repeat("-", 60) . "\n";

$files = [
    'app/Http/Controllers/SocialAccountController.php' => 'Controlador',
    'app/Models/SocialAccount.php' => 'Modelo',
    'resources/views/oauth/callback.blade.php' => 'Vista de callback',
    'resources/js/Hooks/useSocialMediaAuth.js' => 'Hook de autenticación',
    'resources/js/Pages/Manage-content/Partials/SocialMediaAccounts.jsx' => 'Componente React'
];

foreach ($files as $file => $description) {
    if (file_exists(base_path($file))) {
        echo "✅ {$description}: {$file}\n";
    } else {
        echo "❌ {$description}: {$file} NO ENCONTRADO\n";
        $errors[] = "Archivo {$file} no existe";
    }
}

// Verificar sesiones
echo "\n\n🔐 Verificando Configuración de Sesiones...\n";
echo str_repeat("-", 60) . "\n";

$sessionDriver = config('session.driver');
echo "Driver de sesión: {$sessionDriver}\n";

if (in_array($sessionDriver, ['file', 'database', 'redis', 'memcached'])) {
    echo "✅ Driver de sesión válido\n";
} else {
    echo "⚠️  Driver de sesión '{$sessionDriver}' puede causar problemas con OAuth\n";
    $warnings[] = "Driver de sesión '{$sessionDriver}' no es óptimo para OAuth";
}

// Verificar Sanctum
echo "\n\n🛡️  Verificando Laravel Sanctum...\n";
echo str_repeat("-", 60) . "\n";

if (class_exists('Laravel\Sanctum\Sanctum')) {
    echo "✅ Laravel Sanctum está instalado\n";
    
    // Verificar configuración de Sanctum
    $statefulDomains = config('sanctum.stateful');
    echo "Dominios stateful: " . implode(', ', $statefulDomains) . "\n";
    
} else {
    echo "❌ Laravel Sanctum NO está instalado\n";
    $errors[] = "Laravel Sanctum no está instalado";
}

// Resumen final
echo "\n\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║                      RESUMEN FINAL                           ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n";
echo "\n";

echo "✅ Éxitos: " . count($success) . "\n";
echo "⚠️  Advertencias: " . count($warnings) . "\n";
echo "❌ Errores: " . count($errors) . "\n";

if (count($errors) > 0) {
    echo "\n🔴 ERRORES ENCONTRADOS:\n";
    foreach ($errors as $i => $error) {
        echo "  " . ($i + 1) . ". {$error}\n";
    }
}

if (count($warnings) > 0) {
    echo "\n🟡 ADVERTENCIAS:\n";
    foreach ($warnings as $i => $warning) {
        echo "  " . ($i + 1) . ". {$warning}\n";
    }
}

if (count($errors) === 0 && count($warnings) === 0) {
    echo "\n🎉 ¡Todo está configurado correctamente!\n";
    echo "   Puedes comenzar a conectar tus redes sociales.\n";
} else {
    echo "\n📖 Consulta SOCIAL_MEDIA_SETUP.md para más información.\n";
}

echo "\n";
exit(count($errors) > 0 ? 1 : 0);
