<?php

namespace Tests\Feature;

use App\Models\Subscription\WorkspaceAddon;
use App\Models\WebhookEvent;
use App\Models\Workspace\Workspace;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IdempotencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Crear usuario y workspace para las pruebas
        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create([
            'creator_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function stripe_webhook_is_idempotent()
    {
        $eventId = 'evt_test_' . uniqid();
        $paymentIntentId = 'pi_test_' . uniqid();

        $payload = [
            'id' => $eventId,
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_' . uniqid(),
                    'payment_intent' => $paymentIntentId,
                    'amount_total' => 1000,
                    'metadata' => [
                        'addon_sku' => 'ai_100',
                        'workspace_id' => $this->workspace->id,
                        'quantity' => '1',
                    ],
                ],
            ],
        ];

        // Primera llamada - debe crear el addon
        $response1 = $this->postJson('/webhooks/stripe/addon', $payload);
        $response1->assertStatus(200);

        // Segunda llamada - debe ser ignorada (idempotente)
        $response2 = $this->postJson('/webhooks/stripe/addon', $payload);
        $response2->assertStatus(200);

        // Tercera llamada - debe ser ignorada también
        $response3 = $this->postJson('/webhooks/stripe/addon', $payload);
        $response3->assertStatus(200);

        // Verificar que solo se creó 1 addon
        $this->assertEquals(1, WorkspaceAddon::count());
        
        // Verificar que el addon tiene el payment_intent_id correcto
        $addon = WorkspaceAddon::first();
        $this->assertEquals($paymentIntentId, $addon->stripe_payment_intent_id);
        $this->assertEquals($this->workspace->id, $addon->workspace_id);

        // Verificar que solo se registró 1 evento en webhook_events
        $this->assertEquals(1, WebhookEvent::where('gateway', 'stripe')->count());
        
        $webhookEvent = WebhookEvent::where('gateway', 'stripe')->first();
        $this->assertEquals($eventId, $webhookEvent->event_id);
        $this->assertEquals('checkout.session.completed', $webhookEvent->event_type);
    }

    /** @test */
    public function wompi_webhook_is_idempotent()
    {
        $transactionId = 'wompi_test_' . uniqid();

        $payload = [
            'event' => 'transaction.updated',
            'data' => [
                'transaction' => [
                    'id' => $transactionId,
                    'status' => 'APPROVED',
                    'amount_in_cents' => 50000,
                    'metadata' => [
                        'type' => 'addon',
                        'workspace_id' => $this->workspace->id,
                        'user_id' => $this->user->id,
                        'addon_sku' => 'ai_100',
                        'addon_amount' => '100',
                        'addon_type' => 'ai_credits',
                    ],
                ],
            ],
        ];

        // Enviar el mismo webhook 3 veces
        $response1 = $this->postJson('/webhooks/wompi', $payload);
        $response2 = $this->postJson('/webhooks/wompi', $payload);
        $response3 = $this->postJson('/webhooks/wompi', $payload);

        $response1->assertStatus(200);
        $response2->assertStatus(200);
        $response3->assertStatus(200);

        // Solo debe haber 1 addon creado
        $this->assertEquals(1, WorkspaceAddon::count());

        // Solo debe haber 1 evento registrado
        $eventKey = "transaction.updated:{$transactionId}";
        $this->assertEquals(1, WebhookEvent::where('gateway', 'wompi')
            ->where('event_id', $eventKey)
            ->count());
    }

    /** @test */
    public function addon_purchase_is_idempotent_by_payment_intent()
    {
        $paymentIntentId = 'pi_test_duplicate_' . uniqid();

        // Simular dos webhooks diferentes pero con el mismo payment_intent_id
        $payload1 = [
            'id' => 'evt_1_' . uniqid(),
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_1_' . uniqid(),
                    'payment_intent' => $paymentIntentId, // Mismo payment_intent
                    'amount_total' => 1000,
                    'metadata' => [
                        'addon_sku' => 'ai_100',
                        'workspace_id' => $this->workspace->id,
                    ],
                ],
            ],
        ];

        $payload2 = [
            'id' => 'evt_2_' . uniqid(), // Diferente event_id
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => $paymentIntentId, // Mismo payment_intent
                    'amount' => 1000,
                    'metadata' => [
                        'addon_sku' => 'ai_100',
                        'workspace_id' => $this->workspace->id,
                    ],
                ],
            ],
        ];

        // Ambos webhooks deben procesarse (diferentes event_id)
        $response1 = $this->postJson('/webhooks/stripe/addon', $payload1);
        $response2 = $this->postJson('/webhooks/stripe/addon', $payload2);

        $response1->assertStatus(200);
        $response2->assertStatus(200);

        // Pero solo debe crearse 1 addon (mismo payment_intent_id)
        $this->assertEquals(1, WorkspaceAddon::count());
        
        $addon = WorkspaceAddon::first();
        $this->assertEquals($paymentIntentId, $addon->stripe_payment_intent_id);

        // Deben registrarse 2 eventos diferentes en webhook_events
        $this->assertEquals(2, WebhookEvent::where('gateway', 'stripe')->count());
    }

    /** @test */
    public function webhook_event_registration_handles_race_conditions()
    {
        $eventId = 'evt_race_test_' . uniqid();

        // Simular condición de carrera intentando registrar el mismo evento simultáneamente
        $registered1 = WebhookEvent::registerOrFail('stripe', $eventId, 'test.event');
        $registered2 = WebhookEvent::registerOrFail('stripe', $eventId, 'test.event');

        // El primero debe registrarse, el segundo debe fallar
        $this->assertTrue($registered1);
        $this->assertFalse($registered2);

        // Solo debe haber 1 registro
        $this->assertEquals(1, WebhookEvent::where('event_id', $eventId)->count());
    }

    /** @test */
    public function different_gateways_can_have_same_event_id()
    {
        $eventId = 'same_id_123';

        // Registrar el mismo ID en diferentes gateways
        $stripe = WebhookEvent::registerOrFail('stripe', $eventId, 'test.event');
        $wompi = WebhookEvent::registerOrFail('wompi', $eventId, 'test.event');
        $payu = WebhookEvent::registerOrFail('payu', $eventId, 'test.event');

        $this->assertTrue($stripe);
        $this->assertTrue($wompi);
        $this->assertTrue($payu);

        // Deben existir 3 registros (uno por gateway)
        $this->assertEquals(3, WebhookEvent::where('event_id', $eventId)->count());

        // Pero duplicados en el mismo gateway deben fallar
        $stripeDuplicate = WebhookEvent::registerOrFail('stripe', $eventId, 'test.event');
        $this->assertFalse($stripeDuplicate);
    }
}

    /** @test */
    public function mercadopago_webhook_is_idempotent()
    {
        $paymentId = 'mp_test_' . uniqid();

        $payload = [
            'type' => 'payment',
            'data' => [
                'id' => $paymentId,
            ],
        ];

        // Enviar el mismo webhook 3 veces
        $response1 = $this->postJson('/api/webhooks/mercadopago', $payload);
        $response2 = $this->postJson('/api/webhooks/mercadopago', $payload);
        $response3 = $this->postJson('/api/webhooks/mercadopago', $payload);

        $response1->assertStatus(200);
        $response2->assertStatus(200);
        $response3->assertStatus(200);

        // Solo debe haber 1 evento registrado (el primero)
        $this->assertEquals(1, WebhookEvent::where('gateway', 'mercadopago')
            ->where('event_id', $paymentId)
            ->count());

        $webhookEvent = WebhookEvent::where('gateway', 'mercadopago')->first();
        $this->assertEquals($paymentId, $webhookEvent->event_id);
        $this->assertEquals('payment', $webhookEvent->event_type);
    }

    /** @test */
    public function payu_webhook_is_idempotent()
    {
        $transactionId = 'payu_test_' . uniqid();
        $reference = "ADDON_{$this->workspace->id}_ai_100_" . time();

        $payload = [
            'state_pol' => '4', // Aprobada
            'transaction_id' => $transactionId,
            'reference_sale' => $reference,
            'value' => '10.00',
            'currency' => 'USD',
            'sign' => 'test_signature',
        ];

        // Enviar el mismo webhook 3 veces
        $response1 = $this->postJson('/api/webhooks/payu', $payload);
        $response2 = $this->postJson('/api/webhooks/payu', $payload);
        $response3 = $this->postJson('/api/webhooks/payu', $payload);

        $response1->assertStatus(200);
        $response2->assertStatus(200);
        $response3->assertStatus(200);

        // Solo debe haber 1 evento registrado
        $this->assertEquals(1, WebhookEvent::where('gateway', 'payu')
            ->where('event_id', $transactionId)
            ->count());

        $webhookEvent = WebhookEvent::where('gateway', 'payu')->first();
        $this->assertEquals($transactionId, $webhookEvent->event_id);
        $this->assertEquals('state_4', $webhookEvent->event_type);
    }

    /** @test */
    public function epayco_webhook_is_idempotent()
    {
        $refPayco = 'epayco_test_' . uniqid();

        $payload = [
            'x_transaction_state' => 'Aceptada',
            'x_ref_payco' => $refPayco,
            'x_extra1' => $this->workspace->id, // workspace_id
            'x_extra2' => $this->user->id, // user_id
            'x_extra3' => 'ai_100', // addon_sku
            'x_extra4' => 'addon', // type
            'x_amount' => '10.00',
            'x_currency_code' => 'COP',
        ];

        // Enviar el mismo webhook 3 veces
        $response1 = $this->postJson('/api/webhooks/epayco', $payload);
        $response2 = $this->postJson('/api/webhooks/epayco', $payload);
        $response3 = $this->postJson('/api/webhooks/epayco', $payload);

        $response1->assertStatus(200);
        $response2->assertStatus(200);
        $response3->assertStatus(200);

        // Solo debe haber 1 evento registrado
        $this->assertEquals(1, WebhookEvent::where('gateway', 'epayco')
            ->where('event_id', $refPayco)
            ->count());

        $webhookEvent = WebhookEvent::where('gateway', 'epayco')->first();
        $this->assertEquals($refPayco, $webhookEvent->event_id);
        $this->assertEquals('Aceptada', $webhookEvent->event_type);
    }

    /** @test */
    public function all_gateways_handle_concurrent_duplicate_webhooks()
    {
        // Test que simula webhooks duplicados llegando casi simultáneamente
        // para todos los gateways

        $stripeEventId = 'evt_concurrent_' . uniqid();
        $wompiTxId = 'wompi_concurrent_' . uniqid();
        $payuTxId = 'payu_concurrent_' . uniqid();
        $mpPaymentId = 'mp_concurrent_' . uniqid();
        $epaycoRef = 'epayco_concurrent_' . uniqid();

        // Registrar eventos de diferentes gateways
        $results = [
            'stripe_1' => WebhookEvent::registerOrFail('stripe', $stripeEventId, 'test'),
            'stripe_2' => WebhookEvent::registerOrFail('stripe', $stripeEventId, 'test'),
            'wompi_1' => WebhookEvent::registerOrFail('wompi', $wompiTxId, 'test'),
            'wompi_2' => WebhookEvent::registerOrFail('wompi', $wompiTxId, 'test'),
            'payu_1' => WebhookEvent::registerOrFail('payu', $payuTxId, 'test'),
            'payu_2' => WebhookEvent::registerOrFail('payu', $payuTxId, 'test'),
            'mercadopago_1' => WebhookEvent::registerOrFail('mercadopago', $mpPaymentId, 'test'),
            'mercadopago_2' => WebhookEvent::registerOrFail('mercadopago', $mpPaymentId, 'test'),
            'epayco_1' => WebhookEvent::registerOrFail('epayco', $epaycoRef, 'test'),
            'epayco_2' => WebhookEvent::registerOrFail('epayco', $epaycoRef, 'test'),
        ];

        // Verificar que solo el primer intento de cada gateway fue exitoso
        $this->assertTrue($results['stripe_1']);
        $this->assertFalse($results['stripe_2']);
        $this->assertTrue($results['wompi_1']);
        $this->assertFalse($results['wompi_2']);
        $this->assertTrue($results['payu_1']);
        $this->assertFalse($results['payu_2']);
        $this->assertTrue($results['mercadopago_1']);
        $this->assertFalse($results['mercadopago_2']);
        $this->assertTrue($results['epayco_1']);
        $this->assertFalse($results['epayco_2']);

        // Verificar que solo hay 5 eventos (uno por gateway)
        $this->assertEquals(5, WebhookEvent::count());
        $this->assertEquals(1, WebhookEvent::where('gateway', 'stripe')->count());
        $this->assertEquals(1, WebhookEvent::where('gateway', 'wompi')->count());
        $this->assertEquals(1, WebhookEvent::where('gateway', 'payu')->count());
        $this->assertEquals(1, WebhookEvent::where('gateway', 'mercadopago')->count());
        $this->assertEquals(1, WebhookEvent::where('gateway', 'epayco')->count());
    }

    /** @test */
    public function webhook_events_table_stores_payload_for_audit()
    {
        $eventId = 'evt_audit_' . uniqid();
        $payload = ['test' => 'data', 'amount' => 1000];

        WebhookEvent::create([
            'gateway' => 'stripe',
            'event_id' => $eventId,
            'event_type' => 'test.event',
            'status' => 'processed',
            'payload' => $payload,
        ]);

        $event = WebhookEvent::where('event_id', $eventId)->first();
        
        $this->assertNotNull($event);
        $this->assertEquals('stripe', $event->gateway);
        $this->assertEquals($eventId, $event->event_id);
        $this->assertEquals('test.event', $event->event_type);
        $this->assertEquals('processed', $event->status);
        $this->assertEquals($payload, $event->payload);
    }

    /** @test */
    public function idempotency_works_across_multiple_workspaces()
    {
        // Crear otro workspace
        $workspace2 = Workspace::factory()->create([
            'creator_id' => $this->user->id,
        ]);

        $eventId = 'evt_multi_workspace_' . uniqid();
        $paymentIntent1 = 'pi_workspace1_' . uniqid();
        $paymentIntent2 = 'pi_workspace2_' . uniqid();

        // Webhook para workspace 1
        $payload1 = [
            'id' => $eventId,
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_1_' . uniqid(),
                    'payment_intent' => $paymentIntent1,
                    'amount_total' => 1000,
                    'metadata' => [
                        'addon_sku' => 'ai_100',
                        'workspace_id' => $this->workspace->id,
                    ],
                ],
            ],
        ];

        // Mismo event_id pero diferente payment_intent para workspace 2
        $payload2 = [
            'id' => $eventId, // Mismo event_id (no debería procesarse)
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_2_' . uniqid(),
                    'payment_intent' => $paymentIntent2,
                    'amount_total' => 2000,
                    'metadata' => [
                        'addon_sku' => 'ai_500',
                        'workspace_id' => $workspace2->id,
                    ],
                ],
            ],
        ];

        $response1 = $this->postJson('/api/webhooks/stripe/addons', $payload1);
        $response2 = $this->postJson('/api/webhooks/stripe/addons', $payload2);

        $response1->assertStatus(200);
        $response2->assertStatus(200);

        // Solo debe crearse 1 addon (el primero), el segundo se ignora por event_id duplicado
        $this->assertEquals(1, WorkspaceAddon::count());
        
        $addon = WorkspaceAddon::first();
        $this->assertEquals($this->workspace->id, $addon->workspace_id);
        $this->assertEquals($paymentIntent1, $addon->stripe_payment_intent_id);

        // Solo 1 evento registrado
        $this->assertEquals(1, WebhookEvent::where('gateway', 'stripe')->count());
    }
}
