<?php

namespace App\Services\Billing;

use App\Models\Subscription\Invoice;
use App\Models\Workspace\Workspace;
use App\Jobs\Billing\SyncStripeInvoiceJob;
use Illuminate\Support\Facades\Log;

/**
 * Service for orchestrating invoice synchronization across payment providers.
 * 
 * This service acts as a factory and coordinator for provider-specific sync jobs,
 * dispatching the appropriate job based on the payment provider and managing
 * invoice sync status updates.
 */
class InvoiceSyncService
{
    /**
     * Dispatch sync job for a specific invoice.
     * 
     * @param Workspace $workspace The workspace that owns the invoice
     * @param string $provider The payment provider ('stripe' or 'mercadopago')
     * @param string $invoiceId The provider-specific invoice ID
     * @return void
     */
    public function syncInvoice(Workspace $workspace, string $provider, string $invoiceId): void
    {
        $jobClass = $this->getJobClass($provider);
        
        Log::info('Dispatching invoice sync job', [
            'workspace_id' => $workspace->id,
            'provider' => $provider,
            'invoice_id' => $invoiceId,
            'job_class' => $jobClass,
        ]);
        
        // Mark invoice as syncing before dispatching job
        $this->markAsSyncing($provider, $invoiceId);
        
        // Dispatch the provider-specific sync job
        $jobClass::dispatch($workspace->id, $invoiceId);
    }

    /**
     * Dispatch bulk sync job for a workspace.
     * 
     * This method dispatches a job to sync multiple invoices for a workspace,
     * typically used for scheduled bulk synchronization or manual refresh.
     * 
     * @param Workspace $workspace The workspace to sync invoices for
     * @param string $provider The payment provider ('stripe' or 'mercadopago')
     * @return void
     */
    public function syncWorkspaceInvoices(Workspace $workspace, string $provider): void
    {
        $jobClass = $this->getJobClass($provider);
        
        Log::info('Dispatching bulk invoice sync job', [
            'workspace_id' => $workspace->id,
            'provider' => $provider,
            'job_class' => $jobClass,
        ]);
        
        // Dispatch job without specific invoice ID for bulk sync
        $jobClass::dispatch($workspace->id, null);
    }

    /**
     * Get the appropriate job class for a provider.
     * 
     * Factory method that returns the correct sync job class based on
     * the payment provider type.
     * 
     * @param string $provider The payment provider ('stripe' or 'mercadopago')
     * @return string The fully qualified job class name
     * @throws \InvalidArgumentException If provider is not supported
     */
    private function getJobClass(string $provider): string
    {
        return match ($provider) {
            'stripe' => SyncStripeInvoiceJob::class,
            'mercadopago' => throw new \InvalidArgumentException("MercadoPago invoice sync not yet implemented"),
            default => throw new \InvalidArgumentException("Unsupported provider: {$provider}"),
        };
    }

    /**
     * Mark invoice as syncing.
     * 
     * Updates the invoice sync_status to 'syncing' to indicate that
     * a sync operation is in progress.
     * 
     * @param string $provider The payment provider
     * @param string $invoiceId The provider-specific invoice ID
     * @return void
     */
    public function markAsSyncing(string $provider, string $invoiceId): void
    {
        Invoice::where('provider', $provider)
            ->where('provider_invoice_id', $invoiceId)
            ->update([
                'sync_status' => 'syncing',
            ]);
        
        Log::debug('Marked invoice as syncing', [
            'provider' => $provider,
            'invoice_id' => $invoiceId,
        ]);
    }

    /**
     * Mark invoice as completed.
     * 
     * Updates the invoice sync_status to 'completed' and sets the
     * last_synced_at timestamp to indicate successful synchronization.
     * 
     * @param string $provider The payment provider
     * @param string $invoiceId The provider-specific invoice ID
     * @return void
     */
    public function markAsCompleted(string $provider, string $invoiceId): void
    {
        Invoice::where('provider', $provider)
            ->where('provider_invoice_id', $invoiceId)
            ->update([
                'sync_status' => 'completed',
                'last_synced_at' => now(),
                'sync_error' => null,
            ]);
        
        Log::info('Marked invoice as completed', [
            'provider' => $provider,
            'invoice_id' => $invoiceId,
        ]);
    }

    /**
     * Mark invoice as failed.
     * 
     * Updates the invoice sync_status to 'failed' and stores the error
     * message for debugging and display purposes.
     * 
     * @param string $provider The payment provider
     * @param string $invoiceId The provider-specific invoice ID
     * @param string $error The error message describing the failure
     * @return void
     */
    public function markAsFailed(string $provider, string $invoiceId, string $error): void
    {
        Invoice::where('provider', $provider)
            ->where('provider_invoice_id', $invoiceId)
            ->update([
                'sync_status' => 'failed',
                'sync_error' => $error,
            ]);
        
        Log::error('Marked invoice as failed', [
            'provider' => $provider,
            'invoice_id' => $invoiceId,
            'error' => $error,
        ]);
    }
}
