<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;

echo "=== HABILITANDO MÉTODOS DE PAGO POR DEFECTO ===\n\n";

$configMethods = config('payment.available_methods', []);

if (empty($configMethods)) {
    echo "❌ No hay métodos configurados en config/payment.php\n";
    exit(1);
}

DB::beginTransaction();

try {
    $updated = 0;
    $skipped = 0;
    
    foreach ($configMethods as $methodKey => $methodConfig) {
        $settingKey = "payment.{$methodKey}.enabled";
        $shouldBeEnabled = $methodConfig['enabled_by_default'];
        
        $setting = SystemSetting::where('key', $settingKey)->first();
        
        if (!$setting) {
            echo "⚠️  No se encontró: {$methodKey}\n";
            continue;
        }
        
        $currentValue = $setting->value === 'true';
        
        if ($currentValue === $shouldBeEnabled) {
            echo "⏭️  {$methodConfig['name']}: Ya está " . ($shouldBeEnabled ? 'habilitado' : 'deshabilitado') . "\n";
            $skipped++;
            continue;
        }
        
        $setting->value = $shouldBeEnabled ? 'true' : 'false';
        $setting->save();
        
        $status = $shouldBeEnabled ? '✅ Habilitado' : '❌ Deshabilitado';
        echo "{$status}: {$methodConfig['name']}\n";
        $updated++;
    }
    
    DB::commit();
    
    echo "\n" . str_repeat("=", 80) . "\n";
    echo "Resumen:\n";
    echo "  Actualizados: {$updated}\n";
    echo "  Sin cambios: {$skipped}\n";
    echo "  Total: " . ($updated + $skipped) . "\n";
    
    if ($updated > 0) {
        echo "\n✅ Métodos de pago actualizados correctamente\n";
        echo "💡 Limpia la caché: php artisan cache:clear\n";
    } else {
        echo "\n✅ Todos los métodos ya estaban configurados correctamente\n";
    }
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "\n❌ Error: {$e->getMessage()}\n";
    echo "   Archivo: {$e->getFile()}:{$e->getLine()}\n";
    exit(1);
}
