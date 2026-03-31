<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use Stripe\StripeClient;
use Illuminate\Support\Facades\Log;

class SyncWorkspaceInvoices extends Command
{
    protected $signature = 'stripe:sync-workspace-invoices {workspace_id : ID del workspace}';
    
    protected $description = 'Sincroniza las facturas de Stripe para un workspace específico';

    public function handle()
    {
        $workspaceId = $this->argument('workspace_id');
        
        $workspace = Workspace::find($workspaceId);
        
        if (!$workspace) {
            $this->error("Workspace con ID {$workspaceId} no encontrado");
            return 1;
        }

        if (!$workspace->stripe_id) {
            $this->error("Workspace no tiene Stripe Customer ID");
            return 1;
        }

        $this->info("Sincronizando facturas para workspace: {$workspace->name}");
        $this->info("Stripe Customer ID: {$workspace->stripe_id}");
        $this->newLine();

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            
            // Obtener todas las facturas del cliente
            $invoices = $stripe->invoices->all([
                'customer' => $workspace->stripe_id,
                'limit' => 100,
            ]);

            $synced = 0;
            $errors = 0;

            foreach ($invoices->data as $invoice) {
                try {
                    $this->syncInvoice($workspace, $invoice);
                    $synced++;
                    $this->line("✓ Factura sincronizada: {$invoice->id}");
                } catch (\Exception $e) {
                    $errors++;
                    $this->error("✗ Error sincronizando factura {$invoice->id}: {$e->getMessage()}");
                }
            }

            $this->newLine();
            $this->info("Sincronización completada:");
            $this->info("  ✓ Facturas sincronizadas: {$synced}");
            if ($errors > 0) {
                $this->warn("  ✗ Errores: {$errors}");
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Error al obtener facturas de Stripe: {$e->getMessage()}");
            return 1;
        }
    }

    private function syncInvoice(Workspace $workspace, $invoiceData): void
    {
        // Extraer información del plan
        $planName = 'N/A';
        $description = 'Suscripción';
        
        if (isset($invoiceData->lines->data[0])) {
            $firstLine = $invoiceData->lines->data[0];
            $description = $firstLine->description ?? 'Suscripción';
            
            if (isset($firstLine->price->metadata->plan_name)) {
                $planName = $firstLine->price->metadata->plan_name;
            } elseif (isset($firstLine->plan->nickname)) {
                $planName = $firstLine->plan->nickname;
            } elseif (isset($firstLine->price->nickname)) {
                $planName = $firstLine->price->nickname;
            }
        }

        \App\Models\Subscription\StripeInvoice::updateOrCreate(
            [
                'stripe_invoice_id' => $invoiceData->id,
            ],
            [
                'workspace_id' => $workspace->id,
                'stripe_customer_id' => $invoiceData->customer,
                'stripe_subscription_id' => $invoiceData->subscription ?? null,
                'invoice_number' => $invoiceData->number ?? null,
                'status' => $invoiceData->status,
                'subtotal' => ($invoiceData->subtotal ?? 0) / 100,
                'tax' => ($invoiceData->tax ?? 0) / 100,
                'total' => $invoiceData->total / 100,
                'currency' => strtoupper($invoiceData->currency ?? 'usd'),
                'plan_name' => $planName,
                'description' => $description,
                'invoice_pdf' => $invoiceData->invoice_pdf ?? null,
                'hosted_invoice_url' => $invoiceData->hosted_invoice_url ?? null,
                'invoice_date' => date('Y-m-d H:i:s', $invoiceData->created),
                'period_start' => isset($invoiceData->period_start) ? date('Y-m-d H:i:s', $invoiceData->period_start) : null,
                'period_end' => isset($invoiceData->period_end) ? date('Y-m-d H:i:s', $invoiceData->period_end) : null,
            ]
        );

        Log::info('Invoice synced via command', [
            'workspace_id' => $workspace->id,
            'invoice_id' => $invoiceData->id,
        ]);
    }
}
