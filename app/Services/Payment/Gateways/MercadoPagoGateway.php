<?php

namespace App\Services\Payment\Gateways;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Support\Facades\Log;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;

/**
 * Gateway de Mercado Pago usando SDK oficial v3
 * Documentación: https://www.mercadopago.com.co/developers/es/docs
 */
class MercadoPagoGateway implements PaymentGatewayInterface
{
    private string $accessToken;

    public function __construct()
    {
        $this->accessToken = config('services.mercadopago.access_token', '');
        
        if ($this->accessToken) {
            MercadoPagoConfig::setAccessToken($this->accessToken);
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
            $client = new PreferenceClient();

            $preference = $client->create([
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
                    'success' => url('/subscription/success') . '?plan=' . $plan . '&gateway=mercadopago',
                    'failure' => url('/subscription/cancel') . '?gateway=mercadopago',
                    'pending' => url('/subscription/pending') . '?gateway=mercadopago',
                ],
                'auto_return' => 'approved',
                'external_reference' => "workspace_{$workspace->id}_plan_{$plan}",
                'metadata' => array_merge([
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'plan' => $plan,
                    'gateway' => 'mercadopago',
                ], $metadata),
                'payer' => [
                    'email' => $user->email,
                    'name' => $user->name,
                ],
                'notification_url' => url('/api/webhooks/mercadopago'),
            ]);

            return [
                'url' => $preference->init_point,
                'preference_id' => $preference->id,
                'gateway' => 'mercadopago',
            ];
        } catch (MPApiException $e) {
            Log::error('MercadoPago: Failed to create checkout', [
                'workspace_id' => $workspace->id,
                'plan' => $plan,
                'error' => $e->getMessage(),
                'api_response' => $e->getApiResponse(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('MercadoPago: Failed to create checkout', [
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
            $client = new PreferenceClient();

            $preference = $client->create([
                'items' => [
                    [
                        'title' => $addonData['name'],
                        'description' => "Addon: {$addonData['amount']} {$addonData['unit']}",
                        'quantity' => $metadata['quantity'] ?? 1,
                        'currency_id' => 'COP',
                        'unit_price' => $this->convertUsdToCop($addonData['price']),
                    ]
                ],
                'back_urls' => [
                    'success' => url('/subscription/addons/success') . '?gateway=mercadopago',
                    'failure' => url('/subscription/addons/cancelled') . '?gateway=mercadopago',
                    'pending' => url('/subscription/addons') . '?pending=true&gateway=mercadopago',
                ],
                'auto_return' => 'approved',
                'external_reference' => "workspace_{$workspace->id}_addon_{$addonData['sku']}",
                'metadata' => array_merge([
                    'addon_sku' => $addonData['sku'],
                    'addon_amount' => $addonData['amount'],
                    'addon_type' => $this->getAddonType($addonData['sku']),
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'gateway' => 'mercadopago',
                ], $metadata),
                'payer' => [
                    'email' => $user->email,
                    'name' => $user->name,
                ],
                'notification_url' => url('/api/webhooks/mercadopago'),
            ]);

            return [
                'url' => $preference->init_point,
                'preference_id' => $preference->id,
                'gateway' => 'mercadopago',
            ];
        } catch (MPApiException $e) {
            Log::error('MercadoPago: Failed to create addon checkout', [
                'workspace_id' => $workspace->id,
                'addon_sku' => $addonData['sku'],
                'error' => $e->getMessage(),
                'api_response' => $e->getApiResponse(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('MercadoPago: Failed to create addon checkout', [
                'workspace_id' => $workspace->id,
                'addon_sku' => $addonData['sku'],
                'error' => $e->getMessage(),
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
        // MercadoPago maneja suscripciones de forma diferente
        // Para pagos únicos no hay cancelación
        Log::warning('MercadoPago: Cancel subscription not applicable for one-time payments', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function resumeSubscription(string $subscriptionId): bool
    {
        Log::warning('MercadoPago: Resume subscription not applicable', [
            'subscription_id' => $subscriptionId,
        ]);
        return false;
    }

    public function swapSubscription(string $subscriptionId, string $newPriceId): bool
    {
        Log::warning('MercadoPago: Swap subscription not applicable', [
            'subscription_id' => $subscriptionId,
            'new_price_id' => $newPriceId,
        ]);
        return false;
    }

    public function getSubscription(string $subscriptionId): ?array
    {
        try {
            // Para obtener información de un pago
            $payment = \MercadoPago\Payment::find_by_id($subscriptionId);

            if (!$payment) {
                return null;
            }

            return [
                'id' => $payment->id,
                'status' => $payment->status,
                'gateway' => 'mercadopago',
            ];
        } catch (\Exception $e) {
            Log::error('MercadoPago: Failed to get payment', [
                'payment_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        // MercadoPago usa x-signature header
        // La verificación se hace en el webhook controller
        return true;
    }

    public function processWebhookEvent(array $event): void
    {
        Log::info('MercadoPago: Webhook event received', [
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
