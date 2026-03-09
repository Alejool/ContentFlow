<?php

namespace App\Services\Payment\Gateways;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Wompi Gateway - Bancolombia
 * 
 * Documentación: https://docs.wompi.co/
 * 
 * Wompi es la pasarela de pagos de Bancolombia para Colombia.
 * Soporta tarjetas de crédito, débito, PSE, Nequi, Bancolombia Transfer, etc.
 */
class WompiGateway implements PaymentGatewayInterface
{
    private string $publicKey;
    private string $privateKey;
    private string $eventSecret;
    private bool $testMode;
    private string $baseUrl;

    public function __construct()
    {
        $this->publicKey = config('services.wompi.public_key', '');
        $this->privateKey = config('services.wompi.private_key', '');
        $this->eventSecret = config('services.wompi.event_secret', '');
        $this->testMode = config('services.wompi.test_mode', true);
        
        // Wompi usa la misma URL para producción y sandbox
        // La diferencia está en las keys (pub_test_ vs pub_prod_)
        $this->baseUrl = 'https://production.wompi.co/v1';
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

        // Calcular precio en centavos (Wompi usa centavos)
        $amountInCents = $this->convertToWompiAmount($planConfig['price']);

        // Crear referencia única
        $reference = 'SUB-' . $workspace->id . '-' . time();

        // Crear Payment Link (checkout hosted)
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->privateKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/payment_links', [
            'name' => "Suscripción {$planConfig['name']} - {$workspace->name}",
            'description' => "Plan {$planConfig['name']} - Suscripción mensual",
            'single_use' => true,
            'collect_shipping' => false,
            'currency' => 'COP',
            'amount_in_cents' => $amountInCents,
            'redirect_url' => url('/subscription/success') . '?reference=' . $reference . '&plan=' . $plan,
            'expires_at' => now()->addHours(24)->toIso8601String(),
            'metadata' => array_merge([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'plan' => $plan,
                'gateway' => 'wompi',
                'type' => 'subscription',
            ], $metadata),
        ]);

        if (!$response->successful()) {
            Log::error('Wompi: Failed to create payment link', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Failed to create Wompi payment link: ' . $response->body());
        }

        $data = $response->json()['data'] ?? [];

        return [
            'url' => $data['url'] ?? null,
            'payment_link_id' => $data['id'] ?? null,
            'reference' => $reference,
            'gateway' => 'wompi',
        ];
    }

    public function createAddonCheckout(
        Workspace $workspace,
        User $user,
        array $addonData,
        array $metadata = []
    ): array {
        // Calcular precio en centavos
        $amountInCents = $this->convertToWompiAmount($addonData['price']);

        // Crear referencia única
        $reference = 'ADDON-' . $workspace->id . '-' . $addonData['sku'] . '-' . time();

        // Crear Payment Link
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->privateKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/payment_links', [
            'name' => $addonData['name'],
            'description' => "{$addonData['amount']} {$addonData['unit']} - {$addonData['description']}",
            'single_use' => true,
            'collect_shipping' => false,
            'currency' => 'COP',
            'amount_in_cents' => $amountInCents,
            'redirect_url' => url('/subscription/addons') . '?success=true&reference=' . $reference,
            'expires_at' => now()->addHours(24)->toIso8601String(),
            'metadata' => array_merge([
                'addon_sku' => $addonData['sku'],
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'addon_name' => $addonData['name'],
                'addon_amount' => $addonData['amount'],
                'addon_type' => $this->getAddonType($addonData['sku']),
                'gateway' => 'wompi',
                'type' => 'addon',
            ], $metadata),
        ]);

        if (!$response->successful()) {
            Log::error('Wompi: Failed to create addon payment link', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Failed to create Wompi payment link: ' . $response->body());
        }

        $data = $response->json()['data'] ?? [];

        return [
            'url' => $data['url'] ?? null,
            'payment_link_id' => $data['id'] ?? null,
            'reference' => $reference,
            'gateway' => 'wompi',
        ];
    }

    /**
     * Obtener información de una transacción
     */
    public function getTransaction(string $transactionId): ?array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->publicKey,
        ])->get($this->baseUrl . '/transactions/' . $transactionId);

        if (!$response->successful()) {
            Log::error('Wompi: Failed to get transaction', [
                'transaction_id' => $transactionId,
                'status' => $response->status(),
            ]);
            return null;
        }

        return $response->json()['data'] ?? null;
    }

    /**
     * Wompi no soporta suscripciones recurrentes nativas
     * Se debe implementar lógica de cobro manual periódico
     */
    public function cancelSubscription(string $subscriptionId): bool
    {
        // Wompi no tiene suscripciones nativas
        // La cancelación se maneja a nivel de aplicación
        Log::info('Wompi: Subscription cancellation handled at application level', [
            'subscription_id' => $subscriptionId,
        ]);
        return true;
    }

    public function resumeSubscription(string $subscriptionId): bool
    {
        // Wompi no tiene suscripciones nativas
        Log::info('Wompi: Subscription resume handled at application level', [
            'subscription_id' => $subscriptionId,
        ]);
        return true;
    }

    public function swapSubscription(string $subscriptionId, string $newPriceId): bool
    {
        // Wompi no tiene suscripciones nativas
        Log::info('Wompi: Subscription swap handled at application level', [
            'subscription_id' => $subscriptionId,
            'new_price_id' => $newPriceId,
        ]);
        return true;
    }

    public function getSubscription(string $subscriptionId): ?array
    {
        // Wompi no tiene suscripciones nativas
        // Retornar información desde la base de datos local
        return null;
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        // Wompi usa HMAC SHA256 para firmar eventos
        // Signature viene en el header X-Event-Checksum
        $expectedSignature = hash_hmac('sha256', $payload, $this->eventSecret);
        
        $isValid = hash_equals($expectedSignature, $signature);
        
        if (!$isValid) {
            Log::warning('Wompi: Invalid webhook signature', [
                'expected' => $expectedSignature,
                'received' => $signature,
            ]);
        }
        
        return $isValid;
    }

    public function processWebhookEvent(array $event): void
    {
        // La lógica de procesamiento se maneja en el controlador de webhook
        Log::info('Wompi: Webhook event received', [
            'event' => $event['event'] ?? 'unknown',
            'transaction_id' => $event['data']['transaction']['id'] ?? null,
        ]);
    }

    public function getName(): string
    {
        return 'wompi';
    }

    public function isAvailable(): bool
    {
        return !empty($this->publicKey) && !empty($this->privateKey);
    }

    /**
     * Convertir precio a centavos para Wompi
     * Wompi requiere montos en centavos (sin decimales)
     */
    private function convertToWompiAmount(float $price): int
    {
        // Si el precio está en USD, convertir a COP
        $priceInCOP = $price * config('payment.exchange_rates.COP', 4000);
        
        // Convertir a centavos
        return (int) round($priceInCOP * 100);
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

    /**
     * Crear token de aceptación (requerido para pagos con tarjeta)
     * Esto se hace desde el frontend
     */
    public function createAcceptanceToken(): ?array
    {
        $response = Http::get($this->baseUrl . '/merchants/' . $this->publicKey);

        if (!$response->successful()) {
            return null;
        }

        $merchant = $response->json()['data'] ?? null;
        
        return [
            'acceptance_token' => $merchant['presigned_acceptance']['acceptance_token'] ?? null,
            'permalink' => $merchant['presigned_acceptance']['permalink'] ?? null,
        ];
    }
}
