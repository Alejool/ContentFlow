<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Subscription\WorkspaceSubscription;
use App\Models\Subscription\WorkspaceAddon;
use App\Models\WebhookEvent;
use App\Models\Workspace\Workspace;
use App\Services\AddonUsageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Webhook Controller para Wompi (Bancolombia)
 * 
 * Documentación: https://docs.wompi.co/docs/en/eventos
 * 
 * Eventos principales:
 * - transaction.updated: Cuando cambia el estado de una transacción
 */
class WompiWebhookController extends Controller
{
    public function __construct(
        private AddonUsageService $addonUsageService
    ) {}

    public function handle(Request $request)
    {
        Log::info('Wompi Webhook received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
        ]);

        // Verificar firma del webhook
        $signature = $request->header('X-Event-Checksum');
        $payload = $request->getContent();

        if (!$this->verifySignature($payload, $signature)) {
            Log::error('Wompi: Invalid webhook signature');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $event = $request->input('event');
        $data  = $request->input('data');

        // Wompi no envía un event_id global, usamos el transaction id como identificador
        $transactionId = $data['transaction']['id'] ?? null;
        $eventKey      = $transactionId ? "{$event}:{$transactionId}" : null;

        if ($eventKey && !WebhookEvent::registerOrFail('wompi', $eventKey, $event)) {
            Log::info('Wompi: webhook already processed, skipping', [
                'event'          => $event,
                'transaction_id' => $transactionId,
            ]);
            return response()->json(['status' => 'already_processed']);
        }

        try {
            switch ($event) {
                case 'transaction.updated':
                    $this->handleTransactionUpdated($data);
                    break;

                default:
                    Log::info('Wompi: Unhandled event type', ['event' => $event]);
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Wompi: Webhook processing failed', [
                'event' => $event,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    private function handleTransactionUpdated(array $data): void
    {
        $transaction = $data['transaction'] ?? [];
        $status = $transaction['status'] ?? null;
        $reference = $transaction['reference'] ?? null;
        $transactionId = $transaction['id'] ?? null;

        Log::info('Wompi: Transaction updated', [
            'transaction_id' => $transactionId,
            'reference' => $reference,
            'status' => $status,
        ]);

        // Solo procesar transacciones aprobadas
        if ($status !== 'APPROVED') {
            Log::info('Wompi: Transaction not approved, skipping', [
                'status' => $status,
                'reference' => $reference,
            ]);
            return;
        }

        // Extraer metadata
        $metadata = $transaction['metadata'] ?? [];
        $type = $metadata['type'] ?? null;

        if ($type === 'subscription') {
            $this->handleSubscriptionPayment($transaction, $metadata);
        } elseif ($type === 'addon') {
            $this->handleAddonPayment($transaction, $metadata);
        } else {
            Log::warning('Wompi: Unknown payment type', [
                'type' => $type,
                'reference' => $reference,
            ]);
        }
    }

    private function handleSubscriptionPayment(array $transaction, array $metadata): void
    {
        $workspaceId = $metadata['workspace_id'] ?? null;
        $userId = $metadata['user_id'] ?? null;
        $plan = $metadata['plan'] ?? null;

        if (!$workspaceId || !$userId || !$plan) {
            Log::error('Wompi: Missing subscription metadata', [
                'metadata' => $metadata,
            ]);
            return;
        }

        $workspace = Workspace::find($workspaceId);
        if (!$workspace) {
            Log::error('Wompi: Workspace not found', ['workspace_id' => $workspaceId]);
            return;
        }

        // Crear o actualizar suscripción
        $subscription = WorkspaceSubscription::updateOrCreate(
            ['workspace_id' => $workspaceId],
            [
                'stripe_subscription_id' => 'wompi_' . $transaction['id'],
                'plan' => $plan,
                'status' => 'active',
                'stripe_status' => 'active',
                'trial_ends_at' => null,
                'ends_at' => null,
                'renews_at' => now()->addMonth(),
                'payment_gateway' => 'wompi',
                'payment_id' => $transaction['id'],
                'purchased_by' => $userId,
            ]
        );

        Log::info('Wompi: Subscription created/updated', [
            'workspace_id' => $workspaceId,
            'plan' => $plan,
            'subscription_id' => $subscription->id,
        ]);
    }

    private function handleAddonPayment(array $transaction, array $metadata): void
    {
        $workspaceId = $metadata['workspace_id'] ?? null;
        $userId = $metadata['user_id'] ?? null;
        $addonSku = $metadata['addon_sku'] ?? null;
        $addonAmount = $metadata['addon_amount'] ?? null;
        $addonType = $metadata['addon_type'] ?? null;

        if (!$workspaceId || !$userId || !$addonSku || !$addonAmount) {
            Log::error('Wompi: Missing addon metadata', [
                'metadata' => $metadata,
            ]);
            return;
        }

        $workspace = Workspace::find($workspaceId);
        if (!$workspace) {
            Log::error('Wompi: Workspace not found', ['workspace_id' => $workspaceId]);
            return;
        }

        // Obtener configuración del addon
        $addonConfig = config("addons.{$addonSku}");
        if (!$addonConfig) {
            Log::error('Wompi: Addon config not found', ['sku' => $addonSku]);
            return;
        }

        // Calcular fecha de expiración
        $expiresAt = null;
        if (isset($addonConfig['expires_in_days'])) {
            $expiresAt = now()->addDays($addonConfig['expires_in_days']);
        }

        // Crear addon usando el servicio
        $addon = $this->addonUsageService->purchaseAddon(
            workspace: $workspace,
            addonType: $addonType,
            amount: (int) $addonAmount,
            price: $transaction['amount_in_cents'] / 100, // Convertir de centavos
            stripePaymentIntentId: 'wompi_' . $transaction['id'],
            currency: 'COP',
            expiresAt: $expiresAt
        );

        Log::info('Wompi: Addon purchased', [
            'workspace_id' => $workspaceId,
            'addon_type' => $addonType,
            'amount' => $addonAmount,
            'addon_id' => $addon->id,
        ]);
    }

    private function verifySignature(string $payload, ?string $signature): bool
    {
        if (empty($signature)) {
            return false;
        }

        $eventSecret = config('services.wompi.event_secret');
        if (empty($eventSecret)) {
            Log::warning('Wompi: Event secret not configured, skipping signature verification');
            return true; // En desarrollo, permitir sin verificación
        }

        $expectedSignature = hash_hmac('sha256', $payload, $eventSecret);
        
        return hash_equals($expectedSignature, $signature);
    }
}
