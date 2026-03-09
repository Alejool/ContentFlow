<?php

namespace App\Console\Commands;

use App\Models\SystemSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetPaymentMethodsCommand extends Command
{
    protected $signature = 'payment:reset-methods {--force : Forzar reset sin confirmación}';
    
    protected $description = 'Resetea los métodos de pago a sus valores por defecto desde config/payment.php';

    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('¿Estás seguro de resetear todos los métodos de pago a sus valores por defecto?')) {
                $this->info('Operación cancelada');
                return 0;
            }
        }

        $this->info('Reseteando métodos de pago a valores por defecto...');

        $configMethods = config('payment.available_methods', []);

        if (empty($configMethods)) {
            $this->error('No hay métodos configurados en config/payment.php');
            return 1;
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
                    $this->warn("No se encontró: {$methodKey}");
                    continue;
                }
                
                $currentValue = $setting->value === 'true';
                
                if ($currentValue === $shouldBeEnabled) {
                    $this->line("⏭️  {$methodConfig['name']}: Ya está " . ($shouldBeEnabled ? 'habilitado' : 'deshabilitado'));
                    $skipped++;
                    continue;
                }
                
                $setting->value = $shouldBeEnabled ? 'true' : 'false';
                $setting->updated_by = null; // Reset automático
                $setting->save();
                
                $status = $shouldBeEnabled ? '✅ Habilitado' : '❌ Deshabilitado';
                $this->info("{$status}: {$methodConfig['name']}");
                $updated++;
            }
            
            DB::commit();
            
            $this->newLine();
            $this->info('Resumen:');
            $this->line("  Actualizados: {$updated}");
            $this->line("  Sin cambios: {$skipped}");
            $this->line("  Total: " . ($updated + $skipped));
            
            if ($updated > 0) {
                $this->newLine();
                $this->info('✓ Métodos de pago reseteados correctamente');
                $this->comment('💡 Limpia la caché: php artisan cache:clear');
            } else {
                $this->newLine();
                $this->info('✓ Todos los métodos ya estaban en sus valores por defecto');
            }

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error al resetear: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
