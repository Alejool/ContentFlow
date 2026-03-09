<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Agregar configuraciones de métodos de pago (solo si no existen)
        $settings = [
            [
                'key' => 'payment.stripe.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'Stripe',
                'description' => 'Habilitar/deshabilitar pagos con Stripe (tarjetas de crédito/débito internacionales)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.wompi.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'Wompi',
                'description' => 'Habilitar/deshabilitar pagos con Wompi (Colombia - PSE, Nequi, tarjetas)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.mercadopago.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'Mercado Pago',
                'description' => 'Habilitar/deshabilitar pagos con Mercado Pago (América Latina)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.payu.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'PayU',
                'description' => 'Habilitar/deshabilitar pagos con PayU (Latinoamérica)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.epayco.enabled',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'ePayco',
                'description' => 'Habilitar/deshabilitar pagos con ePayco (Colombia)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    public function down(): void
    {
        DB::table('system_settings')
            ->where('category', 'payment_methods')
            ->delete();
    }
};
