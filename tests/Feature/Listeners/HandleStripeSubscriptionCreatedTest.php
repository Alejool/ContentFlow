<?php

namespace Tests\Feature\Listeners;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\Subscription as WorkspaceSubscription;
use App\Models\SubscriptionHistory;
use App\Listeners\Subscription\HandleStripeSubscriptionCreated;
use App\Events\Subscription\SubscriptionUpdated;
use App\Services\SubscriptionTrackingService;
use Laravel\Cashier\Events\WebhookReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Mockery;

/**
 * Tests for HandleStripeSubscriptionCreated Listener
 * 
 * Tests that webhook handlers:
 * - Emit SubscriptionUpdated event at the right times
 * - Invalidate cache correctly
 * - Handle different webhook types properly
 * 
 * **Validates: Requirements 2.5**
 */
class HandleStripeSubscriptionCreatedTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;
    protected HandleStripeSubscriptionCreated $listener;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createTestTables();

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'current_plan' => 'free',
            'email_verified_at' => now(),
            'stripe_id' => 'cus_test123',
        ]);

        $this->workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => $this->user->id,
            'stripe_id' => 'cus_test123',
        ]);

        $this->user->workspaces()->attach($this->workspace->id, ['role_id' => 1]);
        $this->user->update(['current_workspace_id' => $this->workspace->id]);

        // Mock SubscriptionTrackingService
        $trackingService = Mockery::mock(SubscriptionTrackingService::class);
        $trackingService->shouldReceive('recordPlanChange')->andReturn(
            new SubscriptionHistory([
                'id' => 1,
                'user_id' => 1,
                'plan_name' => 'professional',
                'price' => 49.00,
                'billing_cycle' => 'monthly',
                'started_at' => now(),
            ])
        );

        $this->listener = new HandleStripeSubscriptionCreated($trackingService);
    }

    protected function createTestTables(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->string('current_plan')->default('free');
                $table->unsignedBigInteger('current_workspace_id')->nullable();
                $table->string('stripe_id')->nullable()->index();
                $table->rememberToken();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('workspaces')) {
            Schema::create('workspaces', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->unsignedBigInteger('created_by');
                $table->string('stripe_id')->nullable()->index();
                $table->softDeletes();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('workspace_user')) {
            Schema::create('workspace_user', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('workspace_id');
                $table->unsignedBigInteger('role_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('subscriptions')) {
            Schema::create('subscriptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('type')->default('default');
                $table->string('stripe_id')->unique();
                $table->string('stripe_status');
                $table->string('stripe_price')->nullable();
                $table->string('plan')->nullable();
                $table->string('status')->default('active');
                $table->boolean('cancel_at_period_end')->default(false);
                $table->timestamp('ends_at')->nullable();
                $table->integer('quantity')->nullable();
                $table->timestamp('trial_ends_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('subscription_history')) {
            Schema::create('subscription_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('plan_name');
                $table->decimal('price', 10, 2)->default(0);
                $table->string('billing_cycle')->default('monthly');
                $table->timestamp('started_at');
                $table->timestamp('ended_at')->nullable();
                $table->string('end_reason')->nullable();
                $table->string('stripe_subscription_id')->nullable();
                $table->string('stripe_price_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('onboarding_states')) {
            Schema::create('onboarding_states', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->boolean('plan_selected')->default(false);
                $table->string('selected_plan')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Test handleCheckoutCompleted emits SubscriptionUpdated event
     * 
     * @test
     */
    public function test_handle_checkout_completed_emits_subscription_updated_event()
    {
        Event::fake([SubscriptionUpdated::class]);

        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test123',
                    'subscription' => 'sub_test123',
                    'customer' => 'cus_test123',
                    'metadata' => [
                        'user_id' => $this->user->id,
                        'workspace_id' => $this->workspace->id,
                        'plan' => 'professional',
                    ],
                ],
            ],
        ];

        $webhookEvent = new WebhookReceived($payload);
        $this->listener->handle($webhookEvent);

        Event::assertDispatched(SubscriptionUpdated::class, function ($event) {
            return $event->user->id === $this->user->id
                && $event->newPlan === 'professional';
        });
    }

    /**
     * Test handleCheckoutCompleted invalidates cache
     * 
     * @test
     */
    public function test_handle_checkout_completed_invalidates_cache()
    {
        // Set cache value
        Cache::put("user_subscription_{$this->user->id}", 'cached_data', 60);
        $this->assertTrue(Cache::has("user_subscription_{$this->user->id}"));

        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test123',
                    'subscription' => 'sub_test123',
                    'customer' => 'cus_test123',
                    'metadata' => [
                        'user_id' => $this->user->id,
                        'workspace_id' => $this->workspace->id,
                        'plan' => 'starter',
                    ],
                ],
            ],
        ];

        $webhookEvent = new WebhookReceived($payload);
        $this->listener->handle($webhookEvent);

        // Cache should be invalidated
        $this->assertFalse(Cache::has("user_subscription_{$this->user->id}"));
    }

    /**
     * Test handleSubscriptionChange emits event for new subscriptions
     * 
     * @test
     */
    public function test_handle_subscription_change_emits_event_for_new_subscriptions()
    {
        Event::fake([SubscriptionUpdated::class]);

        $payload = [
            'type' => 'customer.subscription.created',
            'data' => [
                'object' => [
                    'id' => 'sub_test123',
                    'customer' => 'cus_test123',
                    'status' => 'active',
                    'items' => [
                        'data' => [
                            [
                                'price' => [
                                    'id' => 'price_professional',
                                ],
                            ],
                        ],
                    ],
                    'metadata' => [
                        'user_id' => $this->user->id,
                        'workspace_id' => $this->workspace->id,
                        'plan' => 'professional',
                    ],
                ],
            ],
        ];

        $webhookEvent = new WebhookReceived($payload);
        $this->listener->handle($webhookEvent);

        Event::assertDispatched(SubscriptionUpdated::class, function ($event) {
            return $event->user->id === $this->user->id
                && $event->newPlan === 'professional';
        });
    }

    /**
     * Test handleSubscriptionDeleted emits event when moving to free
     * 
     * @test
     */
    public function test_handle_subscription_deleted_emits_event_when_moving_to_free()
    {
        Event::fake([SubscriptionUpdated::class]);

        // Mock PlanManagementService
        $planManagement = Mockery::mock(\App\Services\PlanManagementService::class);
        $planManagement->shouldReceive('changePlan')->once();
        $this->app->instance(\App\Services\PlanManagementService::class, $planManagement);

        // Create workspace subscription
        WorkspaceSubscription::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test123',
            'stripe_status' => 'canceled',
            'plan' => 'professional',
            'status' => 'canceling',
        ]);

        $payload = [
            'type' => 'customer.subscription.deleted',
            'data' => [
                'object' => [
                    'id' => 'sub_test123',
                    'customer' => 'cus_test123',
                    'status' => 'canceled',
                ],
            ],
        ];

        $webhookEvent = new WebhookReceived($payload);
        $this->listener->handle($webhookEvent);

        Event::assertDispatched(SubscriptionUpdated::class, function ($event) {
            return $event->user->id === $this->user->id
                && $event->newPlan === 'free';
        });
    }

    /**
     * Test handleSubscriptionDeleted invalidates cache
     * 
     * @test
     */
    public function test_handle_subscription_deleted_invalidates_cache()
    {
        // Set cache value
        Cache::put("user_subscription_{$this->user->id}", 'cached_data', 60);
        $this->assertTrue(Cache::has("user_subscription_{$this->user->id}"));

        // Mock PlanManagementService
        $planManagement = Mockery::mock(\App\Services\PlanManagementService::class);
        $planManagement->shouldReceive('changePlan')->once();
        $this->app->instance(\App\Services\PlanManagementService::class, $planManagement);

        // Create workspace subscription
        WorkspaceSubscription::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test123',
            'stripe_status' => 'canceled',
            'plan' => 'professional',
            'status' => 'canceling',
        ]);

        $payload = [
            'type' => 'customer.subscription.deleted',
            'data' => [
                'object' => [
                    'id' => 'sub_test123',
                    'customer' => 'cus_test123',
                    'status' => 'canceled',
                ],
            ],
        ];

        $webhookEvent = new WebhookReceived($payload);
        $this->listener->handle($webhookEvent);

        // Cache should be invalidated
        $this->assertFalse(Cache::has("user_subscription_{$this->user->id}"));
    }

    /**
     * Test that unsupported webhook events are ignored
     * 
     * @test
     */
    public function test_unsupported_webhook_events_are_ignored()
    {
        Event::fake([SubscriptionUpdated::class]);

        $payload = [
            'type' => 'customer.created',
            'data' => [
                'object' => [
                    'id' => 'cus_test123',
                ],
            ],
        ];

        $webhookEvent = new WebhookReceived($payload);
        $this->listener->handle($webhookEvent);

        // No event should be dispatched
        Event::assertNotDispatched(SubscriptionUpdated::class);
    }

    /**
     * Test handleSubscriptionChange invalidates cache for new subscriptions
     * 
     * @test
     */
    public function test_handle_subscription_change_invalidates_cache_for_new_subscriptions()
    {
        // Set cache value
        Cache::put("user_subscription_{$this->user->id}", 'cached_data', 60);
        $this->assertTrue(Cache::has("user_subscription_{$this->user->id}"));

        $payload = [
            'type' => 'customer.subscription.created',
            'data' => [
                'object' => [
                    'id' => 'sub_test123',
                    'customer' => 'cus_test123',
                    'status' => 'active',
                    'items' => [
                        'data' => [
                            [
                                'price' => [
                                    'id' => 'price_enterprise',
                                ],
                            ],
                        ],
                    ],
                    'metadata' => [
                        'user_id' => $this->user->id,
                        'workspace_id' => $this->workspace->id,
                        'plan' => 'enterprise',
                    ],
                ],
            ],
        ];

        $webhookEvent = new WebhookReceived($payload);
        $this->listener->handle($webhookEvent);

        // Cache should be invalidated
        $this->assertFalse(Cache::has("user_subscription_{$this->user->id}"));
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
