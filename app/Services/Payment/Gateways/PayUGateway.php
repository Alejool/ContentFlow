<?php

namespace App\Services\Payment\Gateways;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * Gateway de PayU usando API REST directa
 * Documentación: https://developers.payulatam.com/
 */
class PayUGateway implements PaymentGatewayInterface
{
    private bool $testMode;
    private string $apiUrl;
    private string $merchantId;
    private string $apiKey;
    private string $apiLogin;
    private string $accountId;

    public function __construct()
    {
        $this->testMode = config('services.payu.test_mode', true);
        $this->merchantId = config('services.payu.merchant_id', '');
        $this->apiKey = config('services.payu.api_key', '');
        $this->apiLogin = config('services.payu.api_login', '');
        $this->accountId = config('services.payu.account_id', '');
        
        // URL según ambiente
        $this->apiUrl = $this->testMode 
            ? 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi'
            : 'https://api.payulatam.com/payments-api/4.0/service.cgi';
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
            $referenceCode = "SUB_{$workspace->id}_{$plan}_" . time();
            $amount = $this->convertUsdToLocal($planConfig['price'], 'CO');

            // Crear formulario de pago con PayU
            $signature = $this->generateSignature($referenceCode, $amount, 'COP');
            
            // URL del formulario de pago
            $paymentUrl = $this->testMode 
                ? 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/'
                : 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

            // Parámetros del formulario
            $params = [
                'merchantId' => $this->merchantId,
                'accountId' => $this->accountId,
                'description' => "Plan {$planConfig['name']} - Intellipost",
                'referenceCode' => $referenceCode,
                'amount' => $amount,
                'tax' => 0,
                'taxReturnBase' => 0,
                'currency' => 'COP',
                'signature' => $signature,
                'test' => $this->testMode ? '1' : '0',
                'buyerEmail' => $user->email,
                'buyerFullName' => $user->name,
                'responseUrl' => url('/subscription/success') . '?gateway=payu&plan=' . $plan,
                'confirmationUrl' => url('/api/webhooks/payu'),
                'extra1' => (string)$workspace->id,
                'extra2' => (string)$user->id,
                'extra3' => $plan,
            ];

            // Construir URL con parámetros
            $url = $paymentUrl . '?' . http_build_query($params);

            return [
                'url' => $url,
                'reference' => $referenceCode,
                'gateway' => 'payu',
            ];
        } catch (\Exception $e) {
            Log::error('PayU: Failed to create checkout', [
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
            $referenceCode = "ADDON_{$workspace->id}_{$addonData['sku']}_" . time();
            $amount = $this->convertUsdToLocal($addonData['price'], 'CO');

            $signature = $this->generateSignature($referenceCode, $amount, 'COP');
            
            $paymentUrl = $this->testMode 
                ? 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/'
                : 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

            $params = [
                'merchantId' => $this->merchantId,
                'accountId' => $this->accountId,
                'description' => "{$addonData['name']} - {$addonData['amount']} {$addonData['unit']}",
                'referenceCode' => $referenceCode,
                'amount' => $amount,
                'tax' => 0,
                'taxReturnBase' => 0,
                'currency' => 'COP',
                'signature' => $signature,
                'test' => $this->testMode ? '1' : '0',
                'buyerEmail' => $user->email,
                'buyerFullName' => $user->name,
                'responseUrl' => url('/subscription/addons') . '?success=true&gateway=payu',
                'confirmationUrl' => url('/api/webhooks/payu'),
                'extra1' => (string)$workspace->id,
                'extra2' => (string)$user->id,
                'extra3' => $addonData['sku'],
            ];

            $url = $paymentUrl . '?' . http_build_query($params);

            return [
                'url' => $url,
                'reference' => $referenceCode,
                'gateway' => 'payu',
            ];
        } catch (\Exception $e) {
            Log::error('PayU: Failed to create addon checkout', [
                'workspace_id' => $workspace->id,
                'addon_sku' => $addonData['sku'],
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function cancelSubscription(string $subscriptionId): bool
    {
        // PayU maneja suscripciones mediante planes recurrentes
        Log::warning('PayU: Cancel subscription not applicable for one-time payments', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function resumeSubscription(string $subscriptionId): bool
    {
        Log::warning('PayU: Resume subscription not applicable', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function swapSubscription(string $subscriptionId, string $newPriceId): bool
    {
        Log::warning('PayU: Swap subscription not applicable', [
            'subscription_id' => $subscriptionId,
            'new_price_id' => $newPriceId,
        ]);
        return false;
    }

    public function getSubscription(string $subscriptionId): ?array
    {
        try {
            // Consultar estado de una transacción usando API REST
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post($this->apiUrl, [
                'language' => 'es',
                'command' => 'ORDER_DETAIL_BY_REFERENCE_CODE',
                'merchant' => [
                    'apiLogin' => $this->apiLogin,
                    'apiKey' => $this->apiKey,
                ],
                'details' => [
                    'referenceCode' => $subscriptionId,
                ],
                'test' => $this->testMode,
            ]);

            if (!$response->successful()) {
                Log::error('PayU: Failed to get transaction', [
                    'subscription_id' => $subscriptionId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            
            if (isset($data['result']['payload'])) {
                $payload = $data['result']['payload'][0] ?? null;
                
                return [
                    'id' => $payload['id'] ?? null,
                    'status' => $payload['status'] ?? null,
                    'gateway' => 'payu',
                ];
            }

            return null;
        } catch (\Exception $e) {
            Log::error('PayU: Failed to get transaction', [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        // PayU envía signature en el payload
        // La verificación se hace en el webhook controller
        return true;
    }

    public function processWebhookEvent(array $event): void
    {
        Log::info('PayU: Webhook event received', [
            'reference' => $event['reference_sale'] ?? 'unknown',
            'state' => $event['state_pol'] ?? 'unknown',
        ]);
    }

    public function getName(): string
    {
        return 'payu';
    }

    public function isAvailable(): bool
    {
        return !empty(config('services.payu.api_key')) && 
               !empty(config('services.payu.api_login')) && 
               !empty(config('services.payu.merchant_id')) &&
               !empty(config('services.payu.account_id'));
    }

    /**
     * Generar firma MD5 para PayU
     * Formato: "ApiKey~merchantId~referenceCode~amount~currency"
     */
    private function generateSignature(string $referenceCode, float $amount, string $currency): string
    {
        $amountFormatted = number_format($amount, 1, '.', '');
        $string = "{$this->apiKey}~{$this->merchantId}~{$referenceCode}~{$amountFormatted}~{$currency}";
        
        return md5($string);
    }

    /**
     * Convertir USD a moneda local
     */
    private function convertUsdToLocal(float $usd, string $countryCode): float
    {
        $rates = config('services.payu.exchange_rates', [
            'CO' => 4000, // COP
            'MX' => 20,   // MXN
            'PE' => 3.8,  // PEN
            'AR' => 350,  // ARS
            'BR' => 5,    // BRL
            'CL' => 900,  // CLP
            'PA' => 1,    // USD
        ]);

        $rate = $rates[$countryCode] ?? 1;
        return round($usd * $rate, 2);
    }
}
