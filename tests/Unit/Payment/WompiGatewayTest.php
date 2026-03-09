<?php

namespace Tests\Unit\Payment;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\Gateways\WompiGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WompiGatewayTest extends TestCase
{
    use RefreshDatabase;

    private WompiGateway $gateway;
    private User $user;
    private Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        // Configurar credenciales de prueba
        config([
            'services.wompi.public_key' => 'pub_test_1234567890',
            'services.wompi.private_key' => 'prv_test_1234567890',
            'services.wompi.event_secret' => 'test_secret_1234567890',
            'services.wompi.test_mode' => true,
        ]);

        $this->gateway = new WompiGateway();
        
        // Crear usuario y workspace de prueba
        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create([
            'owner_id' => $this->user->id,
        ]);
    }

    public function test_gateway_name_is_wompi(): void
    {
        $this->assertEquals('wompi', $this->gateway->getName());
    }

    public function test_gateway_is_available_with_credentials(): void
    {
        $this->assertTrue($this->gateway->isAvailable());
    }

    public function test_gateway_is_not_available_without_credentials(): void
    {
        config([
            'services.wompi.public_key' => '',
            'services.wompi.private_key' => '',
        ]);

        $gateway = new WompiGateway();
        $this->assertFalse($gateway->isAvailable());
    }

    public function test_create_subscription_checkout_returns_payment_link(): void
    {
        // Mock de la respuesta de Wompi
        Http::fake([
            'production.wompi.co/v1/payment_links' => Http::response([
                'data' => [
                    'id' => 'pl_test_123456',
                    'url' => 'https://checkout.wompi.co/l/test_123456',
                    'reference' => 'SUB-' . $this->workspace->id . '-' . time(),
                ],
            ], 200),
        ]);

        // Configurar plan de prueba
        config([
            'plans.professional' => [
                'name' => 'Professional',
                'price' => 29.99,
            ],
        ]);

        $result = $this->gateway->createSubscriptionCheckout(
            workspace: $this->workspace,
            user: $this->user,
            plan: 'professional',
            metadata: ['test' => true]
        );

        $this->assertIsArray($result);
        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('payment_link_id', $result);
        $this->assertArrayHasKey('reference', $result);
        $this->assertEquals('wompi', $result['gateway']);
        $this->assertStringContainsString('checkout.wompi.co', $result['url']);
    }

    public function test_create_addon_checkout_returns_payment_link(): void
    {
        Http::fake([
            'production.wompi.co/v1/payment_links' => Http::response([
                'data' => [
                    'id' => 'pl_test_addon_123',
                    'url' => 'https://checkout.wompi.co/l/addon_123',
                    'reference' => 'ADDON-' . $this->workspace->id . '-test-' . time(),
                ],
            ], 200),
        ]);

        $result = $this->gateway->createAddonCheckout(
            workspace: $this->workspace,
            user: $this->user,
            addonData: [
                'sku' => 'ai_100',
                'name' => 'AI Credits 100',
                'description' => '100 AI credits',
                'price' => 10.00,
                'amount' => 100,
                'unit' => 'credits',
            ],
            metadata: ['quantity' => 1]
        );

        $this->assertIsArray($result);
        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('payment_link_id', $result);
        $this->assertArrayHasKey('reference', $result);
        $this->assertEquals('wompi', $result['gateway']);
    }

    public function test_verify_webhook_signature_with_valid_signature(): void
    {
        $payload = json_encode(['event' => 'transaction.updated', 'data' => []]);
        $secret = config('services.wompi.event_secret');
        $signature = hash_hmac('sha256', $payload, $secret);

        $result = $this->gateway->verifyWebhookSignature($payload, $signature);

        $this->assertTrue($result);
    }

    public function test_verify_webhook_signature_with_invalid_signature(): void
    {
        $payload = json_encode(['event' => 'transaction.updated', 'data' => []]);
        $invalidSignature = 'invalid_signature_12345';

        $result = $this->gateway->verifyWebhookSignature($payload, $invalidSignature);

        $this->assertFalse($result);
    }

    public function test_get_transaction_returns_transaction_data(): void
    {
        Http::fake([
            'production.wompi.co/v1/transactions/*' => Http::response([
                'data' => [
                    'id' => 'txn_test_123',
                    'status' => 'APPROVED',
                    'amount_in_cents' => 4000000, // 40,000 COP
                    'reference' => 'SUB-123-1234567890',
                ],
            ], 200),
        ]);

        $result = $this->gateway->getTransaction('txn_test_123');

        $this->assertIsArray($result);
        $this->assertEquals('txn_test_123', $result['id']);
        $this->assertEquals('APPROVED', $result['status']);
    }

    public function test_get_transaction_returns_null_on_failure(): void
    {
        Http::fake([
            'production.wompi.co/v1/transactions/*' => Http::response([], 404),
        ]);

        $result = $this->gateway->getTransaction('invalid_txn');

        $this->assertNull($result);
    }

    public function test_cancel_subscription_returns_true(): void
    {
        // Wompi no soporta suscripciones nativas, siempre retorna true
        $result = $this->gateway->cancelSubscription('sub_test_123');

        $this->assertTrue($result);
    }

    public function test_resume_subscription_returns_true(): void
    {
        // Wompi no soporta suscripciones nativas, siempre retorna true
        $result = $this->gateway->resumeSubscription('sub_test_123');

        $this->assertTrue($result);
    }

    public function test_swap_subscription_returns_true(): void
    {
        // Wompi no soporta suscripciones nativas, siempre retorna true
        $result = $this->gateway->swapSubscription('sub_test_123', 'price_new_123');

        $this->assertTrue($result);
    }

    public function test_get_subscription_returns_null(): void
    {
        // Wompi no soporta suscripciones nativas, siempre retorna null
        $result = $this->gateway->getSubscription('sub_test_123');

        $this->assertNull($result);
    }

    public function test_create_acceptance_token_returns_token_data(): void
    {
        Http::fake([
            'production.wompi.co/v1/merchants/*' => Http::response([
                'data' => [
                    'presigned_acceptance' => [
                        'acceptance_token' => 'token_test_123',
                        'permalink' => 'https://wompi.co/terms',
                    ],
                ],
            ], 200),
        ]);

        $result = $this->gateway->createAcceptanceToken();

        $this->assertIsArray($result);
        $this->assertArrayHasKey('acceptance_token', $result);
        $this->assertArrayHasKey('permalink', $result);
    }

    public function test_create_acceptance_token_returns_null_on_failure(): void
    {
        Http::fake([
            'production.wompi.co/v1/merchants/*' => Http::response([], 404),
        ]);

        $result = $this->gateway->createAcceptanceToken();

        $this->assertNull($result);
    }
}
