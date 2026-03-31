<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\StripeClient;

class ConfigureStripeBillingPortal extends Command
{
    protected $signature = 'stripe:configure-portal';
    protected $description = 'Configura el portal de facturación de Stripe para permitir actualización de métodos de pago';

    public function handle()
    {
        try {
            $stripe = new StripeClient(config('cashier.secret'));
            
            $this->info('Configurando el portal de facturación de Stripe...');
            
            // Crear o actualizar la configuración del portal
            $configuration = $stripe->billingPortal->configurations->create([
                'business_profile' => [
                    'headline' => 'Gestiona tu suscripción',
                ],
                'features' => [
                    'customer_update' => [
                        'enabled' => false,
                    ],
                    'invoice_history' => [
                        'enabled' => true,
                    ],
                    'payment_method_update' => [
                        'enabled' => true,
                    ],
                    'subscription_cancel' => [
                        'enabled' => true,
                        'mode' => 'immediately',
                    ],
                    'subscription_pause' => [
                        'enabled' => false,
                    ],
                ],
            ]);
            
            $this->info('✓ Configuración del portal creada exitosamente');
            $this->info('ID de configuración: ' . $configuration->id);
            $this->line('');
            $this->info('Funcionalidades habilitadas:');
            $this->line('  - Actualización de método de pago');
            $this->line('  - Historial de facturas');
            $this->line('  - Cancelación de suscripción (inmediata)');
            $this->line('');
            $this->info('Funcionalidades deshabilitadas:');
            $this->line('  - Actualización de información del cliente');
            $this->line('');
            $this->warn('IMPORTANTE: Guarda este ID de configuración si quieres usarlo específicamente.');
            $this->warn('También puedes establecerlo como predeterminado en el dashboard de Stripe.');
            
            return 0;
        } catch (\Exception $e) {
            $this->error('Error al configurar el portal: ' . $e->getMessage());
            return 1;
        }
    }
}
