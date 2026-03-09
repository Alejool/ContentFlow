<?php

namespace App\Http\Controllers\Webhooks;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Models\Workspace\Workspace;
use App\Models\User;
use App\Services\SubscriptionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayUWebhookController extends Controller
{
    public function __construct(
        private SubscriptionTrackingService $subscriptionTracking
    ) {}

    public function handle(Request $request)
    {
        Log::info('PayU webhook received', [
            'payload' => $request->all(),
        ]);

        try {
            // Verificar signature
            if (!$this->verifySignature($request)) {
                Log::warning('PayU: Invalid signature');
                return response()->json(['status' => 'invalid_signature'], 400);
            }

            $state = $request->input('state_pol');
            
            // Estados de PayU:
            // 4 = Aprobada
            // 6 = Rechazada
            // 7 = Pendiente
            
            if ($state == 4) {
                $this->handleApprovedPayment($request);
            } else {
                Log::info('PayU: Payment not approved', [
                    'state' => $state,
                    'reference' => $request->input('reference_sale'),
                ]);
            }

            return response()->json(['status' => 'success'], 200);
        } catch (\Exception $e) {
            Log::error('PayU webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['status' => 'error'], 500);
        }
    }

    private function verifySignature(Request $request)
    {
        $apiKey = config('services.payu.api_key');
        $merchantId = config('services.payu.merchant_id');
        
        $referenceCode = $request->input('reference_sale');
        $value = $request->input('value');
        $currency = $request->input('currency');
        $statePol = $request->input('state_pol');
        $receivedSignature = $request->input('sign');

        $signature = md5("{$apiKey}~{$merchantId}~{$referenceCode}~{$value}~{$currency}~{$statePol}");

        return hash_equals($signature, $receivedSignature);
    }

    private function handleApprovedPayment(Request $request)
    {
        $reference = $request->input('reference_sale');
        
        // Extraer información del reference code
        // Formato: SUB_{workspaceId}_{plan}_{timestamp} o ADDON_{workspaceId}_{sku}_{timestamp}
        $parts = explode('_', $reference);
        
        if (count($parts) < 3) {
            Log::error('PayU: Invalid reference format', ['reference' => $reference]);
            return;
        }

        $type = $parts[0]; // SUB o ADDON
        $workspaceId = $parts[1];
        $planOrSku = $parts[2];

        if ($type === 'SUB') {
            $this->processSubscription($workspaceId, $planOrSku, $request);
        } elseif ($type === 'ADDON') {
            $this->processAddon($workspaceId, $planOrSku, $request);
        }
    }

    private function processSubscription($workspaceId, $plan, Request $request)
    {
        $workspace = Workspace::find($workspaceId);

        if (!$workspace) {
            Log::error('PayU: Workspace not found', ['workspace_id' => $workspaceId]);
            return;
        }

        $user = $workspace->creator;
        if (!$user) {
            Log::error('PayU: User not found for workspace', ['workspace_id' => $workspaceId]);
            return;
        }

        $planConfig = config("plans.{$plan}");
        $reference = $request->input('reference_sale');

        // Actualizar suscripción
        $workspace->subscription()->updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'stripe_subscription_id' => 'payu_' . $reference,
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
            reason: 'payu_payment_completed',
            metadata: [
                'reference' => $reference,
                'gateway' => 'payu',
                'workspace_id' => $workspaceId,
                'transaction_id' => $request->input('transaction_id'),
            ]
        );

        // Actualizar current_plan del usuario
        $user->update(['current_plan' => $plan]);

        Log::info('PayU: Subscription activated', [
            'workspace_id' => $workspaceId,
            'user_id' => $user->id,
            'plan' => $plan,
            'reference' => $reference,
        ]);
    }

    private function processAddon($workspaceId, $addonSku, Request $request)
    {
        $workspace = Workspace::find($workspaceId);

        if (!$workspace) {
            return;
        }

        $user = $workspace->creator;
        if (!$user) {
            return;
        }

        // Obtener configuración del addon
        $addon = AddonHelper::findBySku($addonSku);

        if (!$addon) {
            Log::error('PayU: Addon not found', ['sku' => $addonSku]);
            return;
        }

        $workspace->addonPurchases()->create([
            'addon_type' => $addon['type'],
            'addon_sku' => $addonSku,
            'amount' => $addon['amount'],
            'price_paid' => $request->input('value'),
            'currency' => $request->input('currency'),
            'payment_gateway' => 'payu',
            'payment_id' => $request->input('reference_sale'),
            'purchased_by' => $user->id,
            'expires_at' => isset($addon['expires_days']) 
                ? now()->addDays($addon['expires_days']) 
                : null,
        ]);

        Log::info('PayU: Addon purchased', [
            'workspace_id' => $workspaceId,
            'addon_sku' => $addonSku,
            'reference' => $request->input('reference_sale'),
        ]);
    }
}
