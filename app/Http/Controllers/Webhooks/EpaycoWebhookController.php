<?php

namespace App\Http\Controllers\Webhooks;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Models\WebhookEvent;
use App\Models\Workspace\Workspace;
use App\Models\User;
use App\Services\SubscriptionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EpaycoWebhookController extends Controller
{
    public function __construct(
        private SubscriptionTrackingService $subscriptionTracking
    ) {}

    public function handle(Request $request)
    {
        Log::info('ePayco webhook received', [
            'payload' => $request->all(),
        ]);

        // Verificar signature
        $signature = $request->header('x-signature');
        if (!$this->verifySignature($request->getContent(), $signature)) {
            Log::warning('ePayco: Invalid signature');
            return response()->json(['status' => 'invalid_signature'], 400);
        }

        try {
            $status = $request->input('x_transaction_state');

            // Deduplicación por referencia de ePayco
            $refPayco = $request->input('x_ref_payco');
            if ($refPayco && !WebhookEvent::registerOrFail('epayco', $refPayco, $status ?? 'unknown')) {
                Log::info('ePayco: webhook already processed, skipping', ['ref_payco' => $refPayco]);
                return response()->json(['status' => 'already_processed'], 200);
            }
            
            if ($status === 'Aceptada') {
                $this->handleApprovedPayment($request);
            } else {
                Log::info('ePayco: Payment not approved', [
                    'status' => $status,
                    'reference' => $request->input('x_ref_payco'),
                ]);
            }

            return response()->json(['status' => 'success'], 200);
        } catch (\Exception $e) {
            Log::error('ePayco webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['status' => 'error'], 500);
        }
    }

    private function verifySignature($payload, $signature)
    {
        $privateKey = config('services.epayco.private_key');
        $calculatedSignature = hash('sha256', $privateKey . '^' . $payload);
        return hash_equals($calculatedSignature, $signature);
    }

    private function handleApprovedPayment(Request $request)
    {
        $workspaceId = $request->input('x_extra1');
        $userId = $request->input('x_extra2');
        $planOrSku = $request->input('x_extra3');
        $type = $request->input('x_extra4'); // 'subscription' o 'addon'

        if ($type === 'subscription') {
            $this->processSubscription($workspaceId, $userId, $planOrSku, $request);
        } elseif ($type === 'addon') {
            $this->processAddon($workspaceId, $userId, $planOrSku, $request);
        }
    }

    private function processSubscription($workspaceId, $userId, $plan, Request $request)
    {
        $workspace = Workspace::find($workspaceId);
        $user = User::find($userId);

        if (!$workspace || !$user) {
            Log::error('ePayco: Workspace or user not found', [
                'workspace_id' => $workspaceId,
                'user_id' => $userId,
            ]);
            return;
        }

        $planConfig = config("plans.{$plan}");
        $reference = $request->input('x_ref_payco');

        // Actualizar suscripción
        $workspace->subscription()->updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'stripe_subscription_id' => 'epayco_' . $reference,
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
            reason: 'epayco_payment_completed',
            metadata: [
                'reference' => $reference,
                'gateway' => 'epayco',
                'workspace_id' => $workspaceId,
            ]
        );

        // Actualizar current_plan del usuario
        $user->update(['current_plan' => $plan]);

        Log::info('ePayco: Subscription activated', [
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'plan' => $plan,
            'reference' => $reference,
        ]);
    }

    private function processAddon($workspaceId, $userId, $addonSku, Request $request)
    {
        $workspace = Workspace::find($workspaceId);
        $user = User::find($userId);

        if (!$workspace || !$user) {
            return;
        }

        // Obtener configuración del addon
        $addon = AddonHelper::findBySku($addonSku);

        if (!$addon) {
            Log::error('ePayco: Addon not found', ['sku' => $addonSku]);
            return;
        }

        $workspace->addonPurchases()->create([
            'addon_type' => $addon['type'],
            'addon_sku' => $addonSku,
            'amount' => $addon['amount'],
            'price_paid' => $request->input('x_amount'),
            'currency' => $request->input('x_currency_code', 'COP'),
            'payment_gateway' => 'epayco',
            'payment_id' => $request->input('x_ref_payco'),
            'purchased_by' => $userId,
            'expires_at' => isset($addon['expires_days']) 
                ? now()->addDays($addon['expires_days']) 
                : null,
        ]);

        Log::info('ePayco: Addon purchased', [
            'workspace_id' => $workspaceId,
            'addon_sku' => $addonSku,
            'reference' => $request->input('x_ref_payco'),
        ]);
    }
}
