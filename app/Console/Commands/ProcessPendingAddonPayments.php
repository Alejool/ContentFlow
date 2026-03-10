<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\StripeClient;
use App\Http\Controllers\Webhooks\StripeAddonWebhookController;
use Illuminate\Support\Facades\Log;

class ProcessPendingAddonPayments extends Command
{
    protected $signature = 'addons:process-pending-payments {--session-id= : Process specific session ID}';
    protected $description = 'Process pending addon payments from Stripe (useful when webhooks are not configured)';

    private StripeClient $stripe;

    public function __construct()
    {
        parent::__construct();
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    public function handle()
    {
        $sessionId = $this->option('session-id');

        if ($sessionId) {
            $this->info("Processing specific session: {$sessionId}");
            $this->processSession($sessionId);
        } else {
            $this->info('Fetching recent checkout sessions...');
            $this->processRecentSessions();
        }
    }

    private function processSession(string $sessionId)
    {
        try {
            $session = $this->stripe->checkout->sessions->retrieve($sessionId);
            
            if ($session->payment_status === 'paid') {
                $this->info("Session {$sessionId} is paid, processing...");
                
                // Simular el evento de webhook
                $event = [
                    'type' => 'checkout.session.completed',
                    'data' => [
                        'object' => $session->toArray()
                    ]
                ];
                
                $webhookController = new StripeAddonWebhookController(
                    app(\App\Services\AddonUsageService::class)
                );
                
                // Usar reflection para acceder al método privado
                $reflection = new \ReflectionClass($webhookController);
                $method = $reflection->getMethod('processEvent');
                $method->setAccessible(true);
                $method->invoke($webhookController, $event);
                
                $this->info("✅ Session {$sessionId} processed successfully");
            } else {
                $this->warn("Session {$sessionId} is not paid yet (status: {$session->payment_status})");
            }
        } catch (\Exception $e) {
            $this->error("Error processing session {$sessionId}: " . $e->getMessage());
            Log::error('Error processing addon session manually', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function processRecentSessions()
    {
        try {
            // Obtener sesiones de las últimas 24 horas
            $sessions = $this->stripe->checkout->sessions->all([
                'limit' => 100,
                'created' => [
                    'gte' => time() - (24 * 60 * 60), // Últimas 24 horas
                ],
            ]);

            $processed = 0;
            $skipped = 0;

            foreach ($sessions->data as $session) {
                // Solo procesar sesiones de addons (que tengan addon_sku en metadata)
                if (isset($session->metadata['addon_sku']) && $session->payment_status === 'paid') {
                    $this->info("Processing session: {$session->id}");
                    $this->processSession($session->id);
                    $processed++;
                } else {
                    $skipped++;
                }
            }

            $this->info("✅ Processed {$processed} sessions, skipped {$skipped}");
        } catch (\Exception $e) {
            $this->error("Error fetching recent sessions: " . $e->getMessage());
        }
    }
}