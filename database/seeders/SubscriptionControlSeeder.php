<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubscriptionControlSeeder extends Seeder
{
    /**
     * Seed the subscription control system settings.
     *
     * Uses updateOrInsert to preserve existing values while inserting missing keys.
     * This seeder is idempotent: running it multiple times produces the same result.
     */
    public function run(): void
    {
        $settings = [
            [
                'key'         => 'subscription.demo_mode',
                'value'       => 'false',
                'type'        => 'boolean',
                'category'    => 'subscription',
                'label'       => 'Modo Demo',
                'description' => 'Activa el modo demo: solo el plan gratuito está disponible para nuevas suscripciones.',
            ],
            [
                'key'         => 'subscription.purchases_enabled',
                'value'       => 'true',
                'type'        => 'boolean',
                'category'    => 'subscription',
                'label'       => 'Compras Habilitadas',
                'description' => 'Habilita o deshabilita el sistema de pagos de forma global (control de emergencia).',
            ],
            [
                'key'         => 'subscription.grace_period_days',
                'value'       => '3',
                'type'        => 'integer',
                'category'    => 'subscription',
                'label'       => 'Días de Período de Gracia',
                'description' => 'Número de días de gracia otorgados tras una renovación fallida antes del downgrade.',
            ],
            [
                'key'         => 'subscription.max_retry_attempts',
                'value'       => '3',
                'type'        => 'integer',
                'category'    => 'subscription',
                'label'       => 'Máximo de Reintentos de Cobro',
                'description' => 'Número máximo de reintentos de cobro antes de iniciar el período de gracia.',
            ],
            [
                'key'         => 'subscription.retry_interval_hours',
                'value'       => '24',
                'type'        => 'integer',
                'category'    => 'subscription',
                'label'       => 'Intervalo entre Reintentos (horas)',
                'description' => 'Horas de espera entre cada reintento de cobro de renovación.',
            ],
        ];

        foreach ($settings as $setting) {
            // updateOrInsert: only inserts if the key doesn't exist yet,
            // preserving any existing value that an admin may have changed.
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $this->command->info('SubscriptionControlSeeder: 5 registros de configuración de suscripciones insertados/verificados.');
    }
}
