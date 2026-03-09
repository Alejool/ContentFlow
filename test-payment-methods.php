<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Services\PaymentMethodService;

echo "=== VERIFICACIÓN DE MÉTODOS DE PAGO ===\n\n";

// 1. Verificar métodos en base de datos
echo "1. Métodos en system_settings:\n";
echo str_repeat("-", 80) . "\n";

$dbMethods = SystemSetting::where('category', 'payment_methods')
    ->orderBy('key')
    ->get(['key', 'value', 'label', 'description']);

if ($dbMethods->isEmpty()) {
    echo "❌ No hay métodos de pago en la base de datos\n";
    echo "   Ejecuta: php artisan payment:sync-methods\n\n";
} else {
    foreach ($dbMethods as $method) {
        $status = $method->value === 'true' ? '✅' : '❌';
        echo "{$status} {$method->label}\n";
        echo "   Key: {$method->key}\n";
        echo "   Estado: " . ($method->value === 'true' ? 'Habilitado' : 'Deshabilitado') . "\n";
        echo "   Descripción: {$method->description}\n\n";
    }
}

// 2. Verificar métodos en config
echo "\n2. Métodos en config/payment.php:\n";
echo str_repeat("-", 80) . "\n";

$configMethods = config('payment.available_methods', []);

if (empty($configMethods)) {
    echo "❌ No hay métodos configurados en config/payment.php\n\n";
} else {
    foreach ($configMethods as $key => $method) {
        echo "✓ {$method['name']} ({$key})\n";
        echo "   Descripción: {$method['description']}\n";
        echo "   Países: " . count($method['countries']) . " países\n";
        echo "   Habilitado por defecto: " . ($method['enabled_by_default'] ? 'Sí' : 'No') . "\n\n";
    }
}

// 3. Verificar sincronización
echo "\n3. Estado de sincronización:\n";
echo str_repeat("-", 80) . "\n";

$dbKeys = $dbMethods->pluck('key')->map(function($key) {
    return str_replace(['payment.', '.enabled'], '', $key);
})->toArray();

$configKeys = array_keys($configMethods);

$missing = array_diff($configKeys, $dbKeys);
$extra = array_diff($dbKeys, $configKeys);

if (empty($missing) && empty($extra)) {
    echo "✅ Base de datos y config están sincronizados\n\n";
} else {
    if (!empty($missing)) {
        echo "⚠️  Métodos en config pero NO en DB:\n";
        foreach ($missing as $method) {
            echo "   - {$method}\n";
        }
        echo "\n";
    }
    
    if (!empty($extra)) {
        echo "⚠️  Métodos en DB pero NO en config:\n";
        foreach ($extra as $method) {
            echo "   - {$method}\n";
        }
        echo "\n";
    }
    
    echo "💡 Ejecuta: php artisan payment:sync-methods\n\n";
}

// 4. Probar el servicio
echo "\n4. Prueba del PaymentMethodService:\n";
echo str_repeat("-", 80) . "\n";

try {
    // Métodos disponibles globalmente
    $allMethods = PaymentMethodService::getAvailableMethods();
    echo "Métodos disponibles (global): " . count($allMethods) . "\n";
    foreach ($allMethods as $key => $method) {
        echo "  ✓ {$method['name']} ({$key})\n";
    }
    echo "\n";
    
    // Métodos para Colombia
    $coMethods = PaymentMethodService::getAvailableMethods('CO');
    echo "Métodos disponibles para Colombia: " . count($coMethods) . "\n";
    foreach ($coMethods as $key => $method) {
        echo "  ✓ {$method['name']} ({$key})\n";
    }
    echo "\n";
    
    // Gateway preferido para Colombia
    $preferredCO = PaymentMethodService::getPreferredGateway('CO');
    echo "Gateway preferido para Colombia: {$preferredCO}\n\n";
    
    // Métodos para Estados Unidos
    $usMethods = PaymentMethodService::getAvailableMethods('US');
    echo "Métodos disponibles para Estados Unidos: " . count($usMethods) . "\n";
    foreach ($usMethods as $key => $method) {
        echo "  ✓ {$method['name']} ({$key})\n";
    }
    echo "\n";
    
    // Gateway preferido para Estados Unidos
    $preferredUS = PaymentMethodService::getPreferredGateway('US');
    echo "Gateway preferido para Estados Unidos: {$preferredUS}\n\n";
    
    // Validar método específico
    echo "Validaciones:\n";
    
    $validation1 = PaymentMethodService::canProcessPayment('stripe', ['country_code' => 'US']);
    echo "  Stripe en US: " . ($validation1['valid'] ? '✅ Válido' : '❌ Inválido') . "\n";
    if (!$validation1['valid']) {
        foreach ($validation1['errors'] as $error) {
            echo "    - {$error}\n";
        }
    }
    
    $validation2 = PaymentMethodService::canProcessPayment('wompi', ['country_code' => 'CO']);
    echo "  Wompi en CO: " . ($validation2['valid'] ? '✅ Válido' : '❌ Inválido') . "\n";
    if (!$validation2['valid']) {
        foreach ($validation2['errors'] as $error) {
            echo "    - {$error}\n";
        }
    }
    
    $validation3 = PaymentMethodService::canProcessPayment('wompi', ['country_code' => 'US']);
    echo "  Wompi en US: " . ($validation3['valid'] ? '✅ Válido' : '❌ Inválido') . "\n";
    if (!$validation3['valid']) {
        foreach ($validation3['errors'] as $error) {
            echo "    - {$error}\n";
        }
    }
    
} catch (\Exception $e) {
    echo "❌ Error al probar el servicio: {$e->getMessage()}\n";
    echo "   Archivo: {$e->getFile()}:{$e->getLine()}\n";
}

echo "\n=== FIN DE LA VERIFICACIÓN ===\n";
