<?php

namespace App\Services\Payment\Gateways;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Gateway de Mercado Pago usando HTTP directo (sin SDK)
 * Documentación: https://www.mercadopago.com.co/developers/es/reference/preferences/_checkout_preferences/post
 */
class MercadoPagoManualGateway implements PaymentGatewayInterface
{
    private string $accessToken;
    private string $apiUrl;

    public function __construct()
    {
        $this->accessToken = config('services.mercadopago.access_token', '') ?? '';
        $this->apiUrl = config('services.mercadopago.api_url', 'https://api.mercadopago.com');
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

        // Construir URLs de retorno completas
        $successUrl = url('/subscription/success') . '?plan=' . $plan . '&gateway=mercadopago';
        $failureUrl = url('/subscription/cancel') . '?gateway=mercadopago';
        $pendingUrl = url('/subscription/pending') . '?gateway=mercadopago';

        $preferenceData = [
            'items' => [
                [
                    'title' => "Plan {$planConfig['name']} - Intellipost",
                    'description' => $planConfig['description'] ?? '',
                    'quantity' => 1,
                    'currency_id' => 'COP',
                    'unit_price' => $this->convertUsdToCop($planConfig['price']),
                ]
            ],
            'back_urls' => [
                'success' => $successUrl,
                'failure' => $failureUrl,
                'pending' => $pendingUrl,
            ],
            'external_reference' => "workspace_{$workspace->id}_plan_{$plan}",
            'metadata' => array_merge([
                'workspace_id' => (string) $workspace->id,
                'user_id' => (string) $user->id,
                'plan' => $plan,
                'gateway' => 'mercadopago',
            ], $metadata),
            'payer' => [
                'email' => $user->email,
                'name' => $user->name,
            ],
            'notification_url' => url('/api/webhooks/mercadopago'),
        ];

        return $this->createPreference($preferenceData, $workspace, $plan);
    }

    public function createAddonCheckout(
        Workspace $workspace,
        User $user,
        array $addonData,
        array $metadata = []
    ): array {
        $quantity = $metadata['quantity'] ?? 1;
        
        // Construir URLs de retorno completas
        $successUrl = url('/subscription/addons') . '?success=true&gateway=mercadopago';
        $failureUrl = url('/subscription/addons') . '?canceled=true&gateway=mercadopago';
        $pendingUrl = url('/subscription/addons') . '?pending=true&gateway=mercadopago';
        
        $preferenceData = [
            'items' => [
                [
                    'title' => $addonData['name'],
                    'description' => "Addon: {$addonData['amount']} {$addonData['unit']}",
                    'quantity' => $quantity,
                    'currency_id' => 'COP',
                    'unit_price' => $this->convertUsdToCop($addonData['price']),
                ]
            ],
            'back_urls' => [
                'success' => $successUrl,
                'failure' => $failureUrl,
                'pending' => $pendingUrl,
            ],
            'external_reference' => "workspace_{$workspace->id}_addon_{$addonData['sku']}_" . time(),
            'metadata' => [
                'addon_sku' => $addonData['sku'],
                'addon_amount' => (string) $addonData['amount'],
                'addon_type' => $this->getAddonType($addonData['sku']),
                'workspace_id' => (string) $workspace->id,
                'user_id' => (string) $user->id,
                'gateway' => 'mercadopago',
                'quantity' => (string) $quantity,
            ],
            'payer' => [
                'email' => $user->email,
                'name' => $user->name,
            ],
            'notification_url' => url('/api/webhooks/mercadopago'),
        ];

        return $this->createPreference($preferenceData, $workspace, $addonData['sku']);
    }

    /**
     * Crear preferencia de pago usando HTTP directo
     */
    private function createPreference(array $data, Workspace $workspace, string $reference): array
    {
        try {
            Log::info('MercadoPago Manual: Creating preference', [
                'workspace_id' => $workspace->id,
                'reference' => $reference,
                'access_token_length' => strlen($this->accessToken),
                'api_url' => $this->apiUrl,
                'back_urls' => $data['back_urls'] ?? 'not set',
                'auto_return' => $data['auto_return'] ?? 'not set',
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ])->post("{$this->apiUrl}/checkout/preferences", $data);

            Log::info('MercadoPago Manual: API Response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'has_init_point' => isset($response->json()['init_point']),
                'has_id' => isset($response->json()['id']),
            ]);

            if (!$response->successful()) {
                Log::error('MercadoPago Manual: Failed to create preference', [
                    'workspace_id' => $workspace->id,
                    'reference' => $reference,
                    'status' => $response->status(),
                    'error' => $response->json(),
                    'body' => $response->body(),
                ]);

                throw new \Exception('MercadoPago API error: ' . $response->body());
            }

            $responseData = $response->json();

            if (!isset($responseData['init_point']) || !isset($responseData['id'])) {
                Log::error('MercadoPago Manual: Invalid response structure', [
                    'response' => $responseData,
                ]);
                throw new \Exception('Invalid response from MercadoPago API');
            }

            Log::info('MercadoPago Manual: Preference created successfully', [
                'preference_id' => $responseData['id'],
                'init_point' => $responseData['init_point'],
            ]);

            return [
                'url' => $responseData['init_point'],
                'preference_id' => $responseData['id'],
                'gateway' => 'mercadopago',
            ];
        } catch (\Exception $e) {
            Log::error('MercadoPago Manual: Exception creating preference', [
                'workspace_id' => $workspace->id,
                'reference' => $reference,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Determinar el tipo de addon basado en el SKU
     */
    private function getAddonType(string $sku): string
    {
        if (str_starts_with($sku, 'ai_')) {
            return 'ai_credits';
        } elseif (str_starts_with($sku, 'storage_')) {
            return 'storage';
        } elseif (str_starts_with($sku, 'posts_')) {
            return 'publications';
        } elseif (str_starts_with($sku, 'members_')) {
            return 'team_members';
        }
        
        return 'unknown';
    }

    public function cancelSubscription(string $subscriptionId): bool
    {
        Log::warning('MercadoPago Manual: Cancel subscription not applicable for one-time payments', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function resumeSubscription(string $subscriptionId): bool
    {
        Log::warning('MercadoPago Manual: Resume subscription not applicable', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function swapSubscription(string $subscriptionId, string $newPriceId): bool
    {
        Log::warning('MercadoPago Manual: Swap subscription not applicable', [
            'subscription_id' => $subscriptionId,
            'new_price_id' => $newPriceId,
        ]);
        return false;
    }

    public function getSubscription(string $subscriptionId): ?array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
            ])->get("{$this->apiUrl}/v1/payments/{$subscriptionId}");

            if (!$response->successful()) {
                return null;
            }

            $payment = $response->json();

            return [
                'id' => $payment['id'],
                'status' => $payment['status'],
                'gateway' => 'mercadopago',
            ];
        } catch (\Exception $e) {
            Log::error('MercadoPago Manual: Failed to get payment', [
                'payment_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        return true;
    }

    public function processWebhookEvent(array $event): void
    {
        Log::info('MercadoPago Manual: Webhook event received', [
            'type' => $event['type'] ?? 'unknown',
        ]);
    }

    public function getName(): string
    {
        return 'mercadopago';
    }

    public function isAvailable(): bool
    {
        return !empty($this->accessToken);
    }

    /**
     * Convertir USD a COP (Peso colombiano)
     */
    private function convertUsdToCop(float $usd): float
    {
        $exchangeRate = config('services.mercadopago.usd_to_cop_rate', 4000);
        return round($usd * $exchangeRate, 2);
    }
}
