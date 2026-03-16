<?php

namespace App\Http\Controllers\Webhooks;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Models\WebhookEvent;
use App\Models\Workspace\Workspace;
use App\Models\WorkspaceAddon;
use App\Services\AddonUsageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeAddonWebhookController extends Controller
{
    public function __construct(
        private AddonUsageService $addonUsageService
    ) {}

    /**
     * Manejar webhooks de Stripe para compras de addons
     */
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        // Log TODOS los intentos de webhook
        Log::info('Stripe addon webhook received', [
            'method' => $request->method(),
            'has_signature' => !empty($sigHeader),
            'has_secret' => !empty($webhookSecret),
            'content_type' => $request->header('Content-Type'),
            'user_agent' => $request->header('User-Agent'),
            'body_size' => strlen($payload),
            'ip' => $request->ip(),
            'headers' => $request->headers->all(),
            'payload_preview' => substr($payload, 0, 200), // Primeros 200 chars
        ]);

        // Si no hay webhook secret configurado, procesar sin verificación (SOLO PARA DEBUG)
        if (empty($webhookSecret)) {
            Log::warning('Stripe webhook secret not configured - processing without verification');
            
            try {
                $event = json_decode($payload, true);
                if (!$event || !isset($event['type'])) {
                    Log::error('Invalid webhook payload - not valid JSON or missing type');
                    return response()->json(['error' => 'Invalid payload'], 400);
                }
                
                Log::info('Processing webhook without signature verification', [
                    'event_type' => $event['type'],
                    'event_id' => $event['id'] ?? 'unknown',
                ]);
                
                // Procesar el evento
                $this->processEvent($event);
                
                return response()->json(['status' => 'success']);
            } catch (\Exception $e) {
                Log::error('Error processing webhook without verification', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return response()->json(['error' => 'Processing failed'], 500);
            }
        }

        // Verificación normal con signature
        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            Log::info('Stripe webhook signature verified', [
                'event_type' => $event['type'],
                'event_id' => $event['id'],
            ]);
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        try {
            $this->processEvent($event);
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Stripe webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    /**
     * Procesar el evento del webhook
     */
    private function processEvent($event)
        {
            $eventId   = $event['id'] ?? null;
            $eventType = $event['type'] ?? 'unknown';

            // Deduplicación: si ya procesamos este evento, ignorar
            if ($eventId && !WebhookEvent::registerOrFail('stripe', $eventId, $eventType)) {
                Log::info('Stripe webhook already processed, skipping', [
                    'event_id'   => $eventId,
                    'event_type' => $eventType,
                ]);
                return;
            }

            switch ($eventType) {
                case 'checkout.session.completed':
                    $this->handleCheckoutSessionCompleted($event['data']['object']);
                    break;

                case 'payment_intent.succeeded':
                    $this->handlePaymentIntentSucceeded($event['data']['object']);
                    break;

                case 'charge.refunded':
                    $this->handleChargeRefunded($event['data']['object']);
                    break;

                default:
                    Log::info('Unhandled Stripe webhook event', [
                        'type' => $eventType,
                    ]);
            }
        }

    /**
     * Manejar checkout session completado (para Stripe Checkout)
     */
    private function handleCheckoutSessionCompleted($session)
    {
        // Convertir a array si es objeto
        if (is_object($session)) {
            $session = json_decode(json_encode($session), true);
        }

        $metadata = $session['metadata'] ?? [];

        // Verificar que sea una compra de addon
        if (!isset($metadata['addon_sku']) || !isset($metadata['workspace_id'])) {
            Log::warning('Checkout session without addon metadata', [
                'session_id' => $session['id'] ?? 'unknown',
                'metadata' => $metadata,
            ]);
            return;
        }

        Log::info('Processing addon checkout session', [
            'session_id' => $session['id'],
            'addon_sku' => $metadata['addon_sku'],
            'workspace_id' => $metadata['workspace_id'],
        ]);

        $workspace = Workspace::find($metadata['workspace_id']);
        
        if (!$workspace) {
            Log::error('Workspace not found for addon purchase', [
                'workspace_id' => $metadata['workspace_id'],
                'session_id' => $session['id'],
            ]);
            return;
        }

        // Obtener configuración del addon
        $addonConfig = AddonHelper::findBySku($metadata['addon_sku']);

        if (!$addonConfig) {
            Log::error('Addon configuration not found', [
                'sku' => $metadata['addon_sku'],
                'session_id' => $session['id'],
            ]);
            return;
        }

        // Determinar el tipo de addon basado en el SKU
        $addonType = $this->getAddonTypeFromSku($metadata['addon_sku']);
        
        if (!$addonType) {
            Log::error('Could not determine addon type', [
                'sku' => $metadata['addon_sku'],
                'session_id' => $session['id'],
            ]);
            return;
        }

        // Calcular fecha de expiración si aplica
        $expiresAt = null;
        if (isset($addonConfig['expires_days']) && $addonConfig['expires_days'] > 0) {
            $expiresAt = now()->addDays($addonConfig['expires_days']);
        }

        // Obtener la cantidad del metadata o usar 1 por defecto
        $quantity = isset($metadata['quantity']) ? (int)$metadata['quantity'] : 1;
        $totalAmount = $addonConfig['amount'] * $quantity;

        // Registrar la compra
        $addon = $this->addonUsageService->recordPurchase(
            workspace: $workspace,
            sku: $metadata['addon_sku'],
            type: $addonType,
            amount: $totalAmount,
            price: ($session['amount_total'] ?? 0) / 100, // Stripe usa centavos
            stripePaymentIntentId: $session['payment_intent'] ?? null,
            expiresAt: $expiresAt
        );

        // Guardar el session_id para poder encontrar el addon en la página de éxito
        $addon->update([
            'stripe_session_id' => $session['id'],
        ]);

        Log::info('Addon purchase recorded from checkout session', [
            'addon_id' => $addon->id,
            'workspace_id' => $workspace->id,
            'sku' => $metadata['addon_sku'],
            'type' => $addonType,
            'amount' => $totalAmount,
            'quantity' => $quantity,
            'price' => ($session['amount_total'] ?? 0) / 100,
            'session_id' => $session['id'],
        ]);

        // TODO: Enviar notificación al usuario
        // TODO: Registrar en audit log
    }

    /**
     * Manejar pago exitoso de addon
     */
    private function handlePaymentIntentSucceeded($paymentIntent)
    {
        // Convertir a array si es objeto
        if (is_object($paymentIntent)) {
            $paymentIntent = json_decode(json_encode($paymentIntent), true);
        }

        $metadata = $paymentIntent['metadata'] ?? [];

        // Verificar que sea una compra de addon
        if (!isset($metadata['addon_sku']) || !isset($metadata['workspace_id'])) {
            Log::warning('Payment intent without addon metadata', [
                'payment_intent_id' => $paymentIntent['id'] ?? 'unknown',
            ]);
            return;
        }

        $workspace = Workspace::find($metadata['workspace_id']);
        
        if (!$workspace) {
            Log::error('Workspace not found for addon purchase', [
                'workspace_id' => $metadata['workspace_id'],
                'payment_intent_id' => $paymentIntent['id'],
            ]);
            return;
        }

        // Obtener configuración del addon
        $addonConfig = AddonHelper::findBySku($metadata['addon_sku']);

        if (!$addonConfig) {
            Log::error('Addon configuration not found', [
                'sku' => $metadata['addon_sku'],
                'payment_intent_id' => $paymentIntent['id'],
            ]);
            return;
        }

        // Determinar el tipo de addon basado en el SKU
        $addonType = $this->getAddonTypeFromSku($metadata['addon_sku']);
        
        if (!$addonType) {
            Log::error('Could not determine addon type', [
                'sku' => $metadata['addon_sku'],
                'payment_intent_id' => $paymentIntent['id'],
            ]);
            return;
        }

        // Calcular fecha de expiración si aplica
        $expiresAt = null;
        if (isset($addonConfig['expires_days']) && $addonConfig['expires_days'] > 0) {
            $expiresAt = now()->addDays($addonConfig['expires_days']);
        }

        // Registrar la compra
        $addon = $this->addonUsageService->recordPurchase(
            workspace: $workspace,
            sku: $metadata['addon_sku'],
            type: $addonType,
            amount: $addonConfig['amount'],
            price: ($paymentIntent['amount'] ?? 0) / 100, // Stripe usa centavos
            stripePaymentIntentId: $paymentIntent['id'],
            expiresAt: $expiresAt
        );

        Log::info('Addon purchase recorded', [
            'addon_id' => $addon->id,
            'workspace_id' => $workspace->id,
            'sku' => $metadata['addon_sku'],
            'type' => $addonType,
            'amount' => $addonConfig['amount'],
            'price' => ($paymentIntent['amount'] ?? 0) / 100,
        ]);

        // TODO: Enviar notificación al usuario
        // TODO: Registrar en audit log
    }

    /**
     * Manejar reembolso de addon
     */
    private function handleChargeRefunded($charge)
    {
        $paymentIntentId = $charge->payment_intent;

        if (!$paymentIntentId) {
            return;
        }

        // Buscar el addon asociado
        $addon = WorkspaceAddon::where('stripe_payment_intent_id', $paymentIntentId)
            ->first();

        if (!$addon) {
            Log::warning('Addon not found for refunded charge', [
                'payment_intent_id' => $paymentIntentId,
            ]);
            return;
        }

        // Marcar como inactivo
        $addon->update(['is_active' => false]);

        Log::info('Addon refunded', [
            'addon_id' => $addon->id,
            'workspace_id' => $addon->workspace_id,
            'sku' => $addon->addon_sku,
        ]);

        // TODO: Enviar notificación al usuario
        // TODO: Registrar en audit log
    }

    /**
     * Determinar el tipo de addon basado en el SKU
     */
    private function getAddonTypeFromSku(string $sku): ?string
    {
        // Mapear prefijos de SKU a tipos de addon
        if (str_starts_with($sku, 'ai_')) {
            return 'ai_credits';
        }
        
        if (str_starts_with($sku, 'storage_')) {
            return 'storage';
        }
        
        if (str_starts_with($sku, 'publications_')) {
            return 'publications';
        }
        
        if (str_starts_with($sku, 'members_')) {
            return 'team_members';
        }
        
        return null;
    }
}