<?php

namespace App\Jobs;

use App\Models\Workspace\Workspace;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class SyncStripeInvoiceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [5, 10, 30]; // Reintentar después de 5, 10 y 30 segundos

    public function __construct(
        private int $workspaceId,
        private ?string $invoiceId = null
    ) {}

    public function handle(): void
    {
        $workspace = Workspace::find($this->workspaceId);

        if (!$workspace || !$workspace->stripe_id) {
            Log::warning('Workspace not found or missing Stripe ID for invoice sync', [
                'workspace_id' => $this->workspaceId,
            ]);
            return;
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));

            // Si tenemos un invoice_id específico, sincronizar solo ese
            if ($this->invoiceId) {
                $invoice = $stripe->invoices->retrieve($this->invoiceId);
                $this->syncInvoice($workspace, $invoice);
                
                Log::info('Specific invoice synced via job', [
                    'workspace_id' => $workspace->id,
                    'invoice_id' => $this->invoiceId,
                ]);
            } else {
                // Sincronizar las últimas 10 facturas
                $invoices = $stripe->invoices->all([
                    'customer' => $workspace->stripe_id,
                    'limit' => 10,
                ]);

                foreach ($invoices->data as $invoice) {
                    $this->syncInvoice($workspace, $invoice);
                }

                Log::info('Recent invoices synced via job', [
                    'workspace_id' => $workspace->id,
                    'count' => count($invoices->data),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error syncing invoices in job', [
                'workspace_id' => $workspace->id,
                'invoice_id' => $this->invoiceId,
                'error' => $e->getMessage(),
            ]);
            
            throw $e; // Re-throw para que el job se reintente
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
    }
}
