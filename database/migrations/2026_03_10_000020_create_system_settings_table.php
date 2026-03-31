<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('boolean'); // boolean, string, json, integer
            $table->string('category'); // plans, addons, features, integrations, general
            $table->string('label');
            $table->text('description')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['category', 'key']);
        });

        // Insertar configuraciones por defecto
        DB::table('system_settings')->insert([
            // PLANES
            [
                'key' => 'plan.free.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'plans',
                'label' => 'Plan Free',
                'description' => 'Habilitar/deshabilitar el plan gratuito en todo el sistema',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'plan.starter.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'plans',
                'label' => 'Plan Starter',
                'description' => 'Habilitar/deshabilitar el plan Starter',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'plan.growth.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'plans',
                'label' => 'Plan Growth',
                'description' => 'Habilitar/deshabilitar el plan Growth',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'plan.professional.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'plans',
                'label' => 'Plan Professional',
                'description' => 'Habilitar/deshabilitar el plan Professional',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'plan.enterprise.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'plans',
                'label' => 'Plan Enterprise',
                'description' => 'Habilitar/deshabilitar el plan Enterprise',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'plan.demo.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'plans',
                'label' => 'Plan Demo',
                'description' => 'Habilitar/deshabilitar el plan Demo',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // ADDONS
            [
                'key' => 'addon.ai_credits.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'addons',
                'label' => 'Add-ons de Créditos IA',
                'description' => 'Habilitar/deshabilitar todos los paquetes de créditos IA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'addon.storage.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'addons',
                'label' => 'Add-ons de Almacenamiento',
                'description' => 'Habilitar/deshabilitar todos los paquetes de almacenamiento',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'addon.team_members.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'addons',
                'label' => 'Add-ons de Miembros',
                'description' => 'Habilitar/deshabilitar paquetes de miembros adicionales',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'addon.publications.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'addons',
                'label' => 'Add-ons de Publicaciones',
                'description' => 'Habilitar/deshabilitar paquetes de publicaciones adicionales',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // CARACTERÍSTICAS
            [
                'key' => 'feature.ai.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'features',
                'label' => 'Inteligencia Artificial',
                'description' => 'Habilitar/deshabilitar todas las funciones de IA en el sistema',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'feature.analytics.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'features',
                'label' => 'Analytics',
                'description' => 'Habilitar/deshabilitar el módulo de analíticas',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'feature.reels.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'features',
                'label' => 'Generación de Reels',
                'description' => 'Habilitar/deshabilitar la generación de reels',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'feature.approval_workflows.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'features',
                'label' => 'Flujos de Aprobación',
                'description' => 'Habilitar/deshabilitar los flujos de aprobación',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'feature.calendar_sync.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'features',
                'label' => 'Sincronización de Calendario',
                'description' => 'Habilitar/deshabilitar la sincronización con calendarios externos',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'feature.bulk_operations.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'features',
                'label' => 'Operaciones en Lote',
                'description' => 'Habilitar/deshabilitar operaciones masivas',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'feature.white_label.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'features',
                'label' => 'White Label',
                'description' => 'Habilitar/deshabilitar funcionalidad de marca blanca',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // INTEGRACIONES
            [
                'key' => 'integration.rss.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'integrations',
                'label' => 'Integración RSS',
                'description' => 'Habilitar/deshabilitar importación de feeds RSS',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'integration.zapier.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'integrations',
                'label' => 'Zapier/Make',
                'description' => 'Habilitar/deshabilitar integración con Zapier y Make',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'integration.google_drive.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'integrations',
                'label' => 'Google Drive',
                'description' => 'Habilitar/deshabilitar integración con Google Drive',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'integration.dropbox.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'integrations',
                'label' => 'Dropbox',
                'description' => 'Habilitar/deshabilitar integración con Dropbox',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'integration.slack.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'integrations',
                'label' => 'Slack',
                'description' => 'Habilitar/deshabilitar integración con Slack',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // MÉTODOS DE PAGO
            [
                'key' => 'payment.stripe.enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'Stripe',
                'description' => 'Habilitar/deshabilitar pagos con Stripe (tarjetas de crédito/débito)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.paypal.enabled',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'PayPal',
                'description' => 'Habilitar/deshabilitar pagos con PayPal',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.mercadopago.enabled',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'Mercado Pago',
                'description' => 'Habilitar/deshabilitar pagos con Mercado Pago (América Latina)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.bank_transfer.enabled',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'Transferencia Bancaria',
                'description' => 'Habilitar/deshabilitar pagos por transferencia bancaria',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.crypto.enabled',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'payment_methods',
                'label' => 'Criptomonedas',
                'description' => 'Habilitar/deshabilitar pagos con criptomonedas',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // GENERAL
            [
                'key' => 'system.maintenance_mode',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'general',
                'label' => 'Modo Mantenimiento',
                'description' => 'Activar modo de mantenimiento (solo super admins pueden acceder)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'system.new_registrations',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'general',
                'label' => 'Nuevos Registros',
                'description' => 'Permitir nuevos registros de usuarios',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
