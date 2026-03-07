<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use Stripe\StripeClient;

class DiagnoseStripeInvoices extends Command
{
    protected $signature = 'stripe:diagnose-invoices {workspace_id?}';
    protected $description = 'Diagnostica las facturas de Stripe para un workspace';

    public function handle()
    {
        $workspaceId = $this->argument('workspace_id');
        
        if (!$workspaceId) {
            $workspaceId = $this->ask('ID del Workspace');
        }

        $workspace = Workspace::find($workspaceId);

        if (!$workspace) {
            $this->error('Workspace no encontrado');
            return 1;
        }

        $this->info("Diagnosticando facturas para workspace: {$workspace->name} (ID: {$workspace->id})");
        $this->line('');

        // Verificar stripe_id
        $this->info('1. Verificando Stripe Customer ID:');
        if (!$workspace->stripe_id) {
            $this->error('   ✗ El workspace NO tiene stripe_id');
            return 1;
        }
        $this->info("   ✓ Stripe Customer ID: {$workspace->stripe_id}");
        $this->line('');

        // Verificar suscripción
        $this->info('2. Verificando suscripción:');
        $subscription = $workspace->subscription;
        if (!$subscription) {
            $this->warn('   ⚠ No hay suscripción en la base de datos local');
        } else {
            $this->info("   ✓ Suscripción ID: {$subscription->stripe_id}");
            $this->info("   ✓ Estado: {$subscription->stripe_status}");
        }
        $this->line('');

        // Intentar obtener facturas usando Cashier
        $this->info('3. Obteniendo facturas usando Laravel Cashier:');
        try {
            $invoices = $workspace->invoices();
            $this->info("   ✓ Total de facturas encontradas: " . count($invoices));
            
            if (count($invoices) > 0) {
                $this->line('');
                $this->info('   Últimas 5 facturas:');
                foreach (array_slice($invoices, 0, 5) as $invoice) {
                    $this->line("   - ID: {$invoice->id}");
                    $this->line("     Fecha: " . $invoice->date()->format('Y-m-d'));
                    $this->line("     Total: $" . ($invoice->total() / 100));
                    $this->line("     Estado: {$invoice->status}");
                    $this->line("     PDF: " . ($invoice->invoice_pdf ?? 'N/A'));
                    $this->line('');
                }
            }
        } catch (\Exception $e) {
            $this->error("   ✗ Error al obtener facturas con Cashier: " . $e->getMessage());
        }
        $this->line('');

        // Intentar obtener facturas directamente de Stripe API
        $this->info('4. Obteniendo facturas directamente de Stripe API:');
        try {
            $stripe = new StripeClient(config('cashier.secret'));
            $stripeInvoices = $stripe->invoices->all([
                'customer' => $workspace->stripe_id,
                'limit' => 100,
            ]);

            $this->info("   ✓ Total de facturas en Stripe: " . count($stripeInvoices->data));
            
            if (count($stripeInvoices->data) > 0) {
                $this->line('');
                $this->info('   Últimas 5 facturas:');
                foreach (array_slice($stripeInvoices->data, 0, 5) as $invoice) {
                    $this->line("   - ID: {$invoice->id}");
                    $this->line("     Número: " . ($invoice->number ?? 'N/A'));
                    $this->line("     Fecha: " . date('Y-m-d', $invoice->created));
                    $this->line("     Total: $" . ($invoice->total / 100));
                    $this->line("     Estado: {$invoice->status}");
                    $this->line("     PDF: " . ($invoice->invoice_pdf ?? 'N/A'));
                    $this->line("     Hosted URL: " . ($invoice->hosted_invoice_url ?? 'N/A'));
                    $this->line('');
                }
            } else {
                $this->warn('   ⚠ No se encontraron facturas en Stripe para este cliente');
            }
        } catch (\Exception $e) {
            $this->error("   ✗ Error al obtener facturas de Stripe API: " . $e->getMessage());
        }

        return 0;
    }
}
