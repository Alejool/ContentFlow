<?php

namespace App\Http\Controllers\Webhooks;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Models\Workspace;
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

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Manejar diferentes tipos de eventos
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;

            case 'charge.refunded':
                $this->handleChargeRefunded($event->data->object);
                break;

            default:
                Log::info('Unhandled Stripe webhook event', [
                    'type' => $event->type,
                ]);
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Manejar pago exitoso de addon
     */
    private function handlePaymentIntentSucceeded($paymentIntent)
    {
        $metadata = $paymentIntent->metadata ?? [];

        // Verificar que sea una compra de addon
        if (!isset($metadata->addon_sku) || !isset($metadata->workspace_id)) {
            Log::warning('Payment intent without addon metadata', [
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        $workspace = Workspace::find($metadata->workspace_id);
        
        if (!$workspace) {
            Log::error('Workspace not found for addon purchase', [
                'workspace_id' => $metadata->workspace_id,
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        // Obtener configuración del addon
        $addonConfig = AddonHelper::findBySku($metadata->addon_sku);

        if (!$addonConfig) {
            Log::error('Addon configuration not found', [
                'sku' => $metadata->addon_sku,
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        // Calcular fecha de expiración si aplica
        $expiresAt = null;
        if (isset($addonConfig['expires_in_days']) && $addonConfig['expires_in_days'] > 0) {
            $expiresAt = now()->addDays($addonConfig['expires_in_days']);
        }

        // Registrar la compra
        $addon = $this->addonUsageService->recordPurchase(
            workspace: $workspace,
            sku: $metadata->addon_sku,
            type: $addonConfig['type'],
            amount: $addonConfig['amount'],
            price: $paymentIntent->amount / 100, // Stripe usa centavos
            stripePaymentIntentId: $paymentIntent->id,
            expiresAt: $expiresAt
        );

        Log::info('Addon purchase recorded', [
            'addon_id' => $addon->id,
            'workspace_id' => $workspace->id,
            'sku' => $metadata->addon_sku,
            'amount' => $addonConfig['amount'],
            'price' => $paymentIntent->amount / 100,
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
}
