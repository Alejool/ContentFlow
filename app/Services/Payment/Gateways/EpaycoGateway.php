<?php

namespace App\Services\Payment\Gateways;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Support\Facades\Log;
use Epayco\Epayco;

/**
 * Gateway de ePayco usando SDK oficial
 * Documentación: https://docs.epayco.co/
 */
class EpaycoGateway implements PaymentGatewayInterface
{
    private ?Epayco $epayco = null;
    private bool $testMode;

    public function __construct()
    {
        $publicKey = config('services.epayco.public_key', '');
        $privateKey = config('services.epayco.private_key', '');
        $this->testMode = config('services.epayco.test_mode', true);

        if ($this->isAvailable()) {
            try {
                $this->epayco = new Epayco([
                    'apiKey' => $publicKey,
                    'privateKey' => $privateKey,
                    'lenguage' => 'ES',
                    'test' => $this->testMode
                ]);
            } catch (\Exception $e) {
                Log::warning('ePayco: Failed to initialize', [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    public function createSubscriptionCheckout(
        Workspace $workspace,
        User $user,
        string $plan,
        array $metadata = []
    ): array {
        $planConfig = config("plans.{$plan}");

        if (!$planConfig) {
            throw new \Exception('Invalid plan configuration');
        }

        try {
            $payment = $this->epayco->charge->create([
                'name' => "Plan {$planConfig['name']} - Intellipost",
                'description' => $planConfig['description'] ?? 'Suscripción mensual',
                'currency' => 'cop',
                'amount' => (string)$this->convertUsdToCop($planConfig['price']),
                'tax_base' => '0',
                'tax' => '0',
                'country' => 'co',
                'lang' => 'es',
                'external' => 'false',
                'extra1' => (string)$workspace->id,
                'extra2' => (string)$user->id,
                'extra3' => $plan,
                'extra4' => 'subscription',
                'confirmation' => url('/api/webhooks/epayco'),
                'response' => url('/subscription/success') . '?gateway=epayco&plan=' . $plan,
                'test' => $this->testMode ? 'true' : 'false',
                'email_billing' => $user->email,
                'name_billing' => $user->name,
            ]);

            if (!$payment->success) {
                throw new \Exception('ePayco error: ' . ($payment->data->description ?? 'Unknown error'));
            }

            return [
                'url' => $payment->data->urlbanco ?? null,
                'reference' => $payment->data->ref_payco ?? null,
                'gateway' => 'epayco',
            ];
        } catch (\Exception $e) {
            Log::error('ePayco: Failed to create checkout', [
                'workspace_id' => $workspace->id,
                'plan' => $plan,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function createAddonCheckout(
        Workspace $workspace,
        User $user,
        array $addonData,
        array $metadata = []
    ): array {
        try {
            $payment = $this->epayco->charge->create([
                'name' => $addonData['name'],
                'description' => "Addon: {$addonData['amount']} {$addonData['unit']}",
                'currency' => 'cop',
                'amount' => (string)$this->convertUsdToCop($addonData['price']),
                'tax_base' => '0',
                'tax' => '0',
                'country' => 'co',
                'lang' => 'es',
                'external' => 'false',
                'extra1' => (string)$workspace->id,
                'extra2' => (string)$user->id,
                'extra3' => $addonData['sku'],
                'extra4' => 'addon',
                'confirmation' => url('/api/webhooks/epayco'),
                'response' => url('/subscription/addons') . '?success=true&gateway=epayco',
                'test' => $this->testMode ? 'true' : 'false',
                'email_billing' => $user->email,
                'name_billing' => $user->name,
            ]);

            if (!$payment->success) {
                throw new \Exception('ePayco error: ' . ($payment->data->description ?? 'Unknown error'));
            }

            return [
                'url' => $payment->data->urlbanco ?? null,
                'reference' => $payment->data->ref_payco ?? null,
                'gateway' => 'epayco',
            ];
        } catch (\Exception $e) {
            Log::error('ePayco: Failed to create addon checkout', [
                'workspace_id' => $workspace->id,
                'addon_sku' => $addonData['sku'],
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function cancelSubscription(string $subscriptionId): bool
    {
        // ePayco maneja suscripciones mediante planes
        Log::warning('ePayco: Cancel subscription not applicable for one-time payments', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function resumeSubscription(string $subscriptionId): bool
    {
        Log::warning('ePayco: Resume subscription not applicable', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function swapSubscription(string $subscriptionId, string $newPriceId): bool
    {
        Log::warning('ePayco: Swap subscription not applicable', [
            'subscription_id' => $subscriptionId,
            'new_price_id' => $newPriceId,
        ]);
        return false;
    }

    public function getSubscription(string $subscriptionId): ?array
    {
        try {
            // Obtener información de una transacción
            $transaction = $this->epayco->charge->get($subscriptionId);

            if (!$transaction->success) {
                return null;
            }

            return [
                'id' => $transaction->data->ref_payco ?? null,
                'status' => $transaction->data->x_transaction_state ?? null,
                'gateway' => 'epayco',
            ];
        } catch (\Exception $e) {
            Log::error('ePayco: Failed to get transaction', [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $privateKey = config('services.epayco.private_key');
        $calculatedSignature = hash('sha256', $privateKey . '^' . $payload);
        return hash_equals($calculatedSignature, $signature);
    }

    public function processWebhookEvent(array $event): void
    {
        Log::info('ePayco: Webhook event received', [
            'reference' => $event['x_ref_payco'] ?? 'unknown',
            'status' => $event['x_transaction_state'] ?? 'unknown',
        ]);
    }

    public function getName(): string
    {
        return 'epayco';
    }

    public function isAvailable(): bool
    {
        $publicKey = config('services.epayco.public_key', '');
        $privateKey = config('services.epayco.private_key', '');
        
        return !empty($publicKey) && !empty($privateKey);
    }

    /**
     * Convertir USD a COP
     */
    private function convertUsdToCop(float $usd): float
    {
        $exchangeRate = config('services.epayco.usd_to_cop_rate', 4000);
        return round($usd * $exchangeRate, 2);
    }
}
