<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\StripeInvoice;
use Stripe\StripeClient;

class SyncStripeInvoices extends Command
{
    protected $signature = 'stripe:sync-invoices {workspace_id?}';
    protected $description = 'Sincroniza las facturas de Stripe a la base de datos local';

    public function handle()
    {
        $workspaceId = $this->argument('workspace_id');
        
        if ($workspaceId) {
            $workspaces = Workspace::where('id', $workspaceId)->get();
        } else {
            // Sincronizar todos los workspaces que tengan stripe_id
            $workspaces = Workspace::whereNotNull('stripe_id')->get();
        }

        if ($workspaces->isEmpty()) {
            $this->warn('No se encontraron workspaces con Stripe ID');
            return 0;
        }

        $stripe = new StripeClient(config('cashier.secret'));
        $totalSynced = 0;

        foreach ($workspaces as $workspace) {
            $this->info("Sincronizando facturas para: {$workspace->name} (ID: {$workspace->id})");
            
            try {
                $stripeInvoicesResponse = $stripe->invoices->all([
                    'customer' => $workspace->stripe_id,
                    'limit' => 100,
                ]);
                
                $synced = 0;
                foreach ($stripeInvoicesResponse->data as $stripeInvoice) {
                    $this->syncInvoice($workspace, $stripeInvoice);
                    $synced++;
                }
                
                $this->info("  ✓ Sincronizadas {$synced} facturas");
                $totalSynced += $synced;
                
            } catch (\Exception $e) {
                $this->error("  ✗ Error: " . $e->getMessage());
            }
        }

        $this->line('');
        $this->info("Total de facturas sincronizadas: {$totalSynced}");
        
        return 0;
    }

    private function syncInvoice(Workspace $workspace, $stripeInvoice)
    {
        // Extraer información del plan
        $planName = 'N/A';
        $description = 'Suscripción';
        
        try {
            if ($stripeInvoice->lines && $stripeInvoice->lines->data) {
                $firstLine = $stripeInvoice->lines->data[0] ?? null;
                if ($firstLine) {
                    $description = $firstLine->description ?? 'Suscripción';
                    if (isset($firstLine->price->metadata->plan_name)) {
                        $planName = $firstLine->price->metadata->plan_name;
                    } elseif (isset($firstLine->plan->nickname)) {
                        $planName = $firstLine->plan->nickname;
                    } elseif (isset($firstLine->price->nickname)) {
                        $planName = $firstLine->price->nickname;
                    }
                }
            }
        } catch (\Exception $e) {
            // Ignorar errores de extracción
        }

        StripeInvoice::updateOrCreate(
            [
                'stripe_invoice_id' => $stripeInvoice->id,
            ],
            [
                'workspace_id' => $workspace->id,
                'stripe_customer_id' => $stripeInvoice->customer,
                'stripe_subscription_id' => $stripeInvoice->subscription ?? null,
                'invoice_number' => $stripeInvoice->number ?? null,
                'status' => $stripeInvoice->status,
                'subtotal' => ($stripeInvoice->subtotal ?? 0) / 100,
                'tax' => ($stripeInvoice->tax ?? 0) / 100,
                'total' => $stripeInvoice->total / 100,
                'currency' => strtoupper($stripeInvoice->currency ?? 'usd'),
                'plan_name' => $planName,
                'description' => $description,
                'invoice_pdf' => $stripeInvoice->invoice_pdf ?? null,
                'hosted_invoice_url' => $stripeInvoice->hosted_invoice_url ?? null,
                'invoice_date' => date('Y-m-d H:i:s', $stripeInvoice->created),
                'period_start' => $stripeInvoice->period_start ? date('Y-m-d H:i:s', $stripeInvoice->period_start) : null,
                'period_end' => $stripeInvoice->period_end ? date('Y-m-d H:i:s', $stripeInvoice->period_end) : null,
            ]
        );
    }
}
