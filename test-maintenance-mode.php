<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;

echo "=== PRUEBA DE MODO MANTENIMIENTO ===\n\n";

// 1. Estado actual
echo "1. Estado actual del sistema:\n";
echo str_repeat("-", 80) . "\n";

$maintenanceMode = SystemSetting::getFresh('system.maintenance_mode', false);
$newRegistrations = SystemSetting::getFresh('system.new_registrations', true);

echo "Modo Mantenimiento: " . ($maintenanceMode ? '🔴 ACTIVO' : '✅ Desactivado') . "\n";
echo "Nuevos Registros: " . ($newRegistrations ? '✅ Permitidos' : '🔴 Bloqueados') . "\n\n";

// 2. Activar modo mantenimiento
echo "2. Activando modo mantenimiento...\n";
echo str_repeat("-", 80) . "\n";

$setting = SystemSetting::where('key', 'system.maintenance_mode')->first();
if ($setting) {
    $setting->value = 'true';
    $setting->save();
    echo "✅ Modo mantenimiento ACTIVADO\n\n";
} else {
    echo "❌ No se encontró la configuración\n\n";
}

// 3. Verificar cambio
echo "3. Verificando cambio (sin caché):\n";
echo str_repeat("-", 80) . "\n";

$maintenanceMode = SystemSetting::getFresh('system.maintenance_mode', false);
echo "Modo Mantenimiento: " . ($maintenanceMode ? '🔴 ACTIVO' : '✅ Desactivado') . "\n\n";

// 4. Desactivar nuevos registros
echo "4. Desactivando nuevos registros...\n";
echo str_repeat("-", 80) . "\n";

$setting = SystemSetting::where('key', 'system.new_registrations')->first();
if ($setting) {
    $setting->value = 'false';
    $setting->save();
    echo "✅ Nuevos registros BLOQUEADOS\n\n";
} else {
    echo "❌ No se encontró la configuración\n\n";
}

// 5. Verificar cambio
echo "5. Verificando cambio (sin caché):\n";
echo str_repeat("-", 80) . "\n";

$newRegistrations = SystemSetting::getFresh('system.new_registrations', true);
echo "Nuevos Registros: " . ($newRegistrations ? '✅ Permitidos' : '🔴 Bloqueados') . "\n\n";

// 6. Restaurar valores
echo "6. Restaurando valores por defecto...\n";
echo str_repeat("-", 80) . "\n";

$maintenanceSetting = SystemSetting::where('key', 'system.maintenance_mode')->first();
if ($maintenanceSetting) {
    $maintenanceSetting->value = 'false';
    $maintenanceSetting->save();
}

$registrationsSetting = SystemSetting::where('key', 'system.new_registrations')->first();
if ($registrationsSetting) {
    $registrationsSetting->value = 'true';
    $registrationsSetting->save();
}

echo "✅ Valores restaurados\n\n";

// 7. Verificar final
echo "7. Estado final:\n";
echo str_repeat("-", 80) . "\n";

$maintenanceMode = SystemSetting::getFresh('system.maintenance_mode', false);
$newRegistrations = SystemSetting::getFresh('system.new_registrations', true);

echo "Modo Mantenimiento: " . ($maintenanceMode ? '🔴 ACTIVO' : '✅ Desactivado') . "\n";
echo "Nuevos Registros: " . ($newRegistrations ? '✅ Permitidos' : '🔴 Bloqueados') . "\n\n";

echo "=== PRUEBA COMPLETADA ===\n";
echo "\n💡 Ahora puedes probar desde el panel de admin:\n";
echo "   1. Ir a /admin/system-settings\n";
echo "   2. Pestaña 'General'\n";
echo "   3. Activar/desactivar los toggles\n";
echo "   4. Los cambios se reflejan INSTANTÁNEAMENTE (sin caché)\n";
