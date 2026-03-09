<?php

namespace App\Http\Controllers\Webhooks;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Models\Workspace\Workspace;
use App\Models\User;
use App\Services\SubscriptionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MercadoPagoWebhookController extends Controller
{
    public function __construct(
        private SubscriptionTrackingService $subscriptionTracking
    ) {}

    public function handle(Request $request)
    {
        Log::info('MercadoPago webhook received', [
            'payload' => $request->all(),
        ]);

        $type = $request->input('type');
        $data = $request->input('data');

        try {
            switch ($type) {
                case 'payment':
                    $this->handlePayment($data);
                    break;
                    
                default:
                    Log::info('MercadoPago: Unhandled webhook type', ['type' => $type]);
            }

            return response()->json(['status' => 'success'], 200);
        } catch (\Exception $e) {
            Log::error('MercadoPago webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['status' => 'error'], 500);
        }
    }

    private function handlePayment(array $data)
    {
        $paymentId = $data['id'] ?? null;

        if (!$paymentId) {
            return;
        }

        // Obtener detalles del pago desde MercadoPago API
        $accessToken = config('services.mercadopago.access_token');
        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => "Bearer {$accessToken}",
        ])->get("https://api.mercadopago.com/v1/payments/{$paymentId}");

        if ($response->failed()) {
            Log::error('MercadoPago: Failed to fetch payment details', [
                'payment_id' => $paymentId,
            ]);
            return;
        }

        $payment = $response->json();
        $status = $payment['status'] ?? null;
        $metadata = $payment['metadata'] ?? [];

        if ($status !== 'approved') {
            Log::info('MercadoPago: Payment not approved', [
                'payment_id' => $paymentId,
                'status' => $status,
            ]);
            return;
        }

        // Extraer información del metadata
        $workspaceId = $metadata['workspace_id'] ?? null;
        $userId = $metadata['user_id'] ?? null;
        $plan = $metadata['plan'] ?? null;
        $addonSku = $metadata['addon_sku'] ?? null;

        if ($plan) {
            // Es una suscripción
            $this->processSubscription($workspaceId, $userId, $plan, $payment);
        } elseif ($addonSku) {
            // Es un addon
            $this->processAddon($workspaceId, $userId, $addonSku, $payment);
        }
    }

    private function processSubscription($workspaceId, $userId, $plan, $payment)
    {
        $workspace = Workspace::find($workspaceId);
        $user = User::find($userId);

        if (!$workspace || !$user) {
            Log::error('MercadoPago: Workspace or user not found', [
                'workspace_id' => $workspaceId,
                'user_id' => $userId,
            ]);
            return;
        }

        $planConfig = config("plans.{$plan}");

        // Actualizar suscripción
        $workspace->subscription()->updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'stripe_subscription_id' => 'mp_' . $payment['id'],
                'plan' => $plan,
                'status' => 'active',
                'trial_ends_at' => null,
            ]
        );

        // Registrar en historial
        $this->subscriptionTracking->recordPlanChange(
            user: $user,
            newPlan: $plan,
            previousPlan: $user->current_plan ?? 'free',
            stripePriceId: null,
            price: $planConfig['price'] ?? 0,
            billingCycle: 'monthly',
            reason: 'mercadopago_payment_completed',
            metadata: [
                'payment_id' => $payment['id'],
                'gateway' => 'mercadopago',
                'workspace_id' => $workspaceId,
            ]
        );

        // Actualizar current_plan del usuario
        $user->update(['current_plan' => $plan]);

        Log::info('MercadoPago: Subscription activated', [
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'plan' => $plan,
            'payment_id' => $payment['id'],
        ]);
    }

    private function processAddon($workspaceId, $userId, $addonSku, $payment)
    {
        $workspace = Workspace::find($workspaceId);
        $user = User::find($userId);

        if (!$workspace || !$user) {
            return;
        }

        // Obtener configuración del addon
        $addon = AddonHelper::findBySku($addonSku);

        if (!$addon) {
            Log::error('MercadoPago: Addon not found', ['sku' => $addonSku]);
            return;
        }

        // Registrar compra de addon
        $workspace->addonPurchases()->create([
            'addon_type' => $addon['type'],
            'addon_sku' => $addonSku,
            'amount' => $addon['amount'],
            'price_paid' => $payment['transaction_amount'] ?? 0,
            'currency' => $payment['currency_id'] ?? 'COP',
            'payment_gateway' => 'mercadopago',
            'payment_id' => $payment['id'],
            'purchased_by' => $userId,
            'expires_at' => isset($addon['expires_days']) 
                ? now()->addDays($addon['expires_days']) 
                : null,
        ]);

        Log::info('MercadoPago: Addon purchased', [
            'workspace_id' => $workspaceId,
            'addon_sku' => $addonSku,
            'payment_id' => $payment['id'],
        ]);
    }
}
