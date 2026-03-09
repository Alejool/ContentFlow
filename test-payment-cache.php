<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Services\PaymentMethodService;

echo "=== PRUEBA DE CACHÉ DE MÉTODOS DE PAGO ===\n\n";

// 1. Estado inicial
echo "1. Estado inicial:\n";
echo str_repeat("-", 80) . "\n";

$methods = PaymentMethodService::getAvailableMethods();
echo "Métodos disponibles: " . count($methods) . "\n";
foreach ($methods as $key => $method) {
    echo "  ✓ {$method['name']} ({$key})\n";
}
echo "\n";

// 2. Deshabilitar Wompi
echo "2. Deshabilitando Wompi...\n";
echo str_repeat("-", 80) . "\n";

$setting = SystemSetting::where('key', 'payment.wompi.enabled')->first();
if ($setting) {
    $setting->value = 'false';
    $setting->save();
    echo "✅ Wompi DESHABILITADO en DB\n\n";
}

// 3. Verificar INMEDIATAMENTE (sin esperar)
echo "3. Verificando INMEDIATAMENTE (sin caché):\n";
echo str_repeat("-", 80) . "\n";

$methods = PaymentMethodService::getAvailableMethods();
echo "Métodos disponibles: " . count($methods) . "\n";
foreach ($methods as $key => $method) {
    echo "  ✓ {$method['name']} ({$key})\n";
}

if (!isset($methods['wompi'])) {
    echo "\n✅ ÉXITO: Wompi NO aparece (cambio instantáneo)\n\n";
} else {
    echo "\n❌ ERROR: Wompi todavía aparece (hay caché)\n\n";
}

// 4. Verificar para Colombia específicamente
echo "4. Verificando para Colombia:\n";
echo str_repeat("-", 80) . "\n";

$coMethods = PaymentMethodService::getAvailableMethods('CO');
echo "Métodos disponibles para CO: " . count($coMethods) . "\n";
foreach ($coMethods as $key => $method) {
    echo "  ✓ {$method['name']} ({$key})\n";
}

if (!isset($coMethods['wompi'])) {
    echo "\n✅ ÉXITO: Wompi NO aparece en CO (cambio instantáneo)\n\n";
} else {
    echo "\n❌ ERROR: Wompi todavía aparece en CO (hay caché)\n\n";
}

// 5. Verificar con isMethodAvailable
echo "5. Verificando con isMethodAvailable:\n";
echo str_repeat("-", 80) . "\n";

$isAvailable = PaymentMethodService::isMethodAvailable('wompi', 'CO');
echo "Wompi disponible en CO: " . ($isAvailable ? '✅ SÍ' : '❌ NO') . "\n";

if (!$isAvailable) {
    echo "✅ ÉXITO: isMethodAvailable retorna false (cambio instantáneo)\n\n";
} else {
    echo "❌ ERROR: isMethodAvailable retorna true (hay caché)\n\n";
}

// 6. Habilitar Wompi nuevamente
echo "6. Habilitando Wompi nuevamente...\n";
echo str_repeat("-", 80) . "\n";

$setting = SystemSetting::where('key', 'payment.wompi.enabled')->first();
if ($setting) {
    $setting->value = 'true';
    $setting->save();
    echo "✅ Wompi HABILITADO en DB\n\n";
}

// 7. Verificar INMEDIATAMENTE
echo "7. Verificando INMEDIATAMENTE:\n";
echo str_repeat("-", 80) . "\n";

$methods = PaymentMethodService::getAvailableMethods();
echo "Métodos disponibles: " . count($methods) . "\n";
foreach ($methods as $key => $method) {
    echo "  ✓ {$method['name']} ({$key})\n";
}

if (isset($methods['wompi'])) {
    echo "\n✅ ÉXITO: Wompi aparece nuevamente (cambio instantáneo)\n\n";
} else {
    echo "\n❌ ERROR: Wompi no aparece (hay caché)\n\n";
}

// 8. Resumen
echo "8. Resumen:\n";
echo str_repeat("-", 80) . "\n";

$allPassed = true;

// Test 1: Deshabilitar
$setting->value = 'false';
$setting->save();
$methods = PaymentMethodService::getAvailableMethods();
$test1 = !isset($methods['wompi']);
echo "Test 1 (Deshabilitar): " . ($test1 ? '✅ PASÓ' : '❌ FALLÓ') . "\n";
$allPassed = $allPassed && $test1;

// Test 2: Habilitar
$setting->value = 'true';
$setting->save();
$methods = PaymentMethodService::getAvailableMethods();
$test2 = isset($methods['wompi']);
echo "Test 2 (Habilitar): " . ($test2 ? '✅ PASÓ' : '❌ FALLÓ') . "\n";
$allPassed = $allPassed && $test2;

// Test 3: isMethodAvailable
$setting->value = 'false';
$setting->save();
$test3 = !PaymentMethodService::isMethodAvailable('wompi', 'CO');
echo "Test 3 (isMethodAvailable): " . ($test3 ? '✅ PASÓ' : '❌ FALLÓ') . "\n";
$allPassed = $allPassed && $test3;

// Restaurar
$setting->value = 'true';
$setting->save();

echo "\n";
if ($allPassed) {
    echo "🎉 TODOS LOS TESTS PASARON - Sin caché, cambios instantáneos\n";
} else {
    echo "❌ ALGUNOS TESTS FALLARON - Revisar caché\n";
}

echo "\n=== PRUEBA COMPLETADA ===\n";
