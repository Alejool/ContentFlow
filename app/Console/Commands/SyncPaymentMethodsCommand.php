<?php

namespace App\Console\Commands;

use App\Models\SystemSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncPaymentMethodsCommand extends Command
{
    protected $signature = 'payment:sync-methods';
    
    protected $description = 'Sincroniza los métodos de pago desde config/payment.php a system_settings';

    public function handle()
    {
        $this->info('Sincronizando métodos de pago desde config/payment.php...');

        // Obtener métodos disponibles desde la configuración
        $availableMethods = config('payment.available_methods', []);

        if (empty($availableMethods)) {
            $this->error('No hay métodos de pago configurados en config/payment.php');
            return 1;
        }

        $this->info('Métodos encontrados: ' . implode(', ', array_keys($availableMethods)));

        DB::beginTransaction();

        try {
            // Obtener métodos de pago existentes
            $existingMethods = SystemSetting::where('category', 'payment_methods')
                ->pluck('key')
                ->map(fn($key) => str_replace('payment.', '', str_replace('.enabled', '', $key)))
                ->toArray();

            // Agregar o actualizar métodos de pago desde config
            foreach ($availableMethods as $methodKey => $methodConfig) {
                $settingKey = "payment.{$methodKey}.enabled";
                $existing = SystemSetting::where('key', $settingKey)->first();

                if (!$existing) {
                    // Crear nuevo método
                    SystemSetting::create([
                        'key' => $settingKey,
                        'value' => $methodConfig['enabled_by_default'] ? 'true' : 'false',
                        'type' => 'boolean',
                        'category' => 'payment_methods',
                        'label' => $methodConfig['name'],
                        'description' => "Habilitar/deshabilitar pagos con {$methodConfig['name']} ({$methodConfig['description']})",
                    ]);

                    $status = $methodConfig['enabled_by_default'] ? '✅' : '❌';
                    $this->info("{$status} Agregado: {$methodConfig['name']} (" . ($methodConfig['enabled_by_default'] ? 'habilitado' : 'deshabilitado') . ")");
                } else {
                    // Actualizar descripción y label si cambiaron
                    $newDescription = "Habilitar/deshabilitar pagos con {$methodConfig['name']} ({$methodConfig['description']})";
                    $updated = false;
                    
                    if ($existing->description !== $newDescription || $existing->label !== $methodConfig['name']) {
                        $existing->update([
                            'label' => $methodConfig['name'],
                            'description' => $newDescription,
                        ]);
                        $updated = true;
                    }
                    
                    if ($updated) {
                        $this->info("↻ Actualizado: {$methodConfig['name']}");
                    }
                }
            }

            // Eliminar métodos que ya no están en config
            $configuredMethods = array_keys($availableMethods);
            foreach ($existingMethods as $method) {
                if (!in_array($method, $configuredMethods)) {
                    SystemSetting::where('key', "payment.{$method}.enabled")->delete();
                    $this->warn("✗ Eliminado: {$method} (no está en config/payment.php)");
                }
            }

            DB::commit();
            $this->info('✓ Sincronización completada exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error al sincronizar: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
