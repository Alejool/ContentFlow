<?php

namespace Tests\Feature\Subscription;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Subscription;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

/**
 * Bug Condition Exploration Tests for Subscription Plan Management
 * 
 * CRITICAL: These tests encode the EXPECTED BEHAVIOR and are designed to FAIL
 * on the current unfixed code. Failure proves the bugs exist.
 * 
 * DO NOT attempt to fix these tests or the code when they fail.
 * These tests will validate the fixes once they are implemented.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10**
 */
class SubscriptionBugConditionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        // Manually create necessary tables for SQLite testing
        $this->createTestTables();

        // Create test user and workspace
        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'current_plan' => 'professional',
            'email_verified_at' => now(),
        ]);
        
        $this->workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => $this->user->id,
        ]);

        $this->user->workspaces()->attach($this->workspace->id);
        $this->user->update(['current_workspace_id' => $this->workspace->id]);
    }

    /**
     * Create necessary tables for testing in SQLite
     */
    protected function createTestTables(): void
    {
        // Create users table if not exists
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->string('current_plan')->default('free');
                $table->unsignedBigInteger('current_workspace_id')->nullable();
                $table->rememberToken();
                $table->timestamps();
                
                // Cashier columns
                $table->string('stripe_id')->nullable()->index();
                $table->string('pm_type')->nullable();
                $table->string('pm_last_four', 4)->nullable();
                $table->timestamp('trial_ends_at')->nullable();
            });
        }

        // Create workspaces table
        if (!Schema::hasTable('workspaces')) {
            Schema::create('workspaces', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->unsignedBigInteger('created_by');
                $table->timestamps();
            });
        }

        // Create workspace_user pivot table
        if (!Schema::hasTable('workspace_user')) {
            Schema::create('workspace_user', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('workspace_id');
                $table->timestamps();
            });
        }

        // Create subscriptions table (Cashier)
        if (!Schema::hasTable('subscriptions')) {
            Schema::create('subscriptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->string('type');
                $table->string('stripe_id')->unique();
                $table->string('stripe_status');
                $table->string('stripe_price')->nullable();
                $table->integer('quantity')->nullable();
                $table->timestamp('trial_ends_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->string('plan')->nullable();
                $table->timestamps();

                $table->index(['workspace_id', 'stripe_status']);
            });
        }

        // Create workspace_subscriptions table
        if (!Schema::hasTable('workspace_subscriptions')) {
            Schema::create('workspace_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->unique();
                $table->unsignedBigInteger('user_id');
                $table->string('type')->default('default');
                $table->string('stripe_id')->nullable();
                $table->string('stripe_status')->nullable();
                $table->string('plan')->default('free');
                $table->string('status')->default('active');
                $table->boolean('cancel_at_period_end')->default(false);
                $table->timestamp('ends_at')->nullable();
                $table->string('cancellation_reason')->nullable();
                $table->timestamps();
            });
        }

        // Create subscription_history table
        if (!Schema::hasTable('subscription_history')) {
            Schema::create('subscription_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('plan_name');
                $table->string('stripe_price_id')->nullable();
                $table->decimal('price', 10, 2)->default(0);
                $table->string('billing_cycle')->default('monthly');
                $table->string('status')->default('active');
                $table->timestamp('started_at');
                $table->timestamp('ended_at')->nullable();
                $table->string('reason')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Bug 1: Cambio entre planes de pago sin prorrateo
     * 
     * EXPECTED BEHAVIOR: When a user with an active paid subscription changes to another
     * paid plan, the system SHALL redirect to Stripe for proration processing OR use
     * Stripe swap API, NOT allow direct change without Stripe involvement.
     * 
     * CURRENT BUG: System allows direct plan change without Stripe swap or checkout.
     * 
     * **Validates: Requirements 1.1, 2.1**
     */
    public function test_bug_1_paid_to_paid_plan_change_requires_stripe_swap()
    {
        // Setup: User has active Professional subscription
        $this->createActiveStripeSubscription($this->workspace, 'professional', 'price_professional');
        
        // Action: User attempts to change to Enterprise plan
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/subscription/change-plan', [
                'plan' => 'enterprise'
            ]);

        // Expected: System should either:
        // 1. Use Stripe swap and return success with requires_reload flag, OR
        // 2. Return requires_checkout to redirect to Stripe
        // 
        // Bug: Currently returns success without Stripe swap
        $this->assertTrue(
            $response->json('requires_checkout') === true || 
            ($response->json('success') === true && $response->json('requires_reload') === true),
            'Expected either requires_checkout=true OR success=true with requires_reload=true for paid-to-paid plan change'
        );

        // If swap was used, verify plan was actually updated
        if ($response->json('success') === true) {
            $this->assertEquals('enterprise', $this->user->fresh()->current_plan);
        }
    }

    /**
     * Bug 2: Cambio a plan gratuito sin validación
     * 
     * EXPECTED BEHAVIOR: When a user with an active paid subscription attempts to
     * change to a free plan, the system SHALL reject the change and show an error
     * with cancellation option.
     * 
     * CURRENT BUG: System allows immediate change to free plan, canceling paid subscription.
     * 
     * **Validates: Requirements 1.2, 2.2**
     */
    public function test_bug_2_paid_to_free_plan_change_is_blocked()
    {
        // Setup: User has active Starter subscription
        $this->createActiveStripeSubscription($this->workspace, 'starter', 'price_starter');
        
        // Action: User attempts to activate Free plan
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/subscription/activate-free-plan', [
                'plan' => 'free'
            ]);

        // Expected: System should reject with 403 and requires_cancellation flag
        $response->assertStatus(403);
        $this->assertTrue(
            $response->json('requires_cancellation') === true,
            'Expected requires_cancellation=true when attempting to change to free plan with active subscription'
        );
        $this->assertNotEmpty($response->json('message'));
        
        // Verify plan was NOT changed
        $this->assertNotEquals('free', $this->user->fresh()->current_plan);
    }

    /**
     * Bug 3: Cancelación inmediata
     * 
     * EXPECTED BEHAVIOR: When a user cancels their subscription, the system SHALL
     * set status to "canceling" and maintain access until the end of the billing cycle.
     * 
     * CURRENT BUG: System sets status to "canceled" immediately, potentially denying access.
     * 
     * **Validates: Requirements 1.3, 2.3**
     */
    public function test_bug_3_cancellation_uses_canceling_status()
    {
        // Setup: User has active Professional subscription
        $cashierSub = $this->createActiveStripeSubscription($this->workspace, 'professional', 'price_professional');
        
        // Create workspace subscription record
        $this->workspace->subscription()->create([
            'user_id' => $this->user->id,
            'type' => 'default',
            'stripe_id' => $cashierSub->stripe_id,
            'stripe_status' => 'active',
            'plan' => 'professional',
            'status' => 'active',
        ]);

        // Action: User cancels subscription
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/subscription/cancel', [
                'reason' => 'testing'
            ]);

        $response->assertStatus(200);
        
        // Expected: Status should be "canceling", not "canceled"
        $workspaceSubscription = $this->workspace->subscription()->first();
        $this->assertEquals(
            'canceling',
            $workspaceSubscription->status,
            'Expected status to be "canceling" after cancellation, not "canceled"'
        );
        
        // Verify cancel_at_period_end is set
        $this->assertTrue(
            $workspaceSubscription->cancel_at_period_end,
            'Expected cancel_at_period_end to be true'
        );
        
        // Verify ends_at is set to future date
        $this->assertNotNull($workspaceSubscription->ends_at);
        $this->assertTrue(
            $workspaceSubscription->ends_at->isFuture(),
            'Expected ends_at to be in the future'
        );
    }

    /**
     * Bug 4: No transición automática a Free al expirar
     * 
     * EXPECTED BEHAVIOR: When a canceled subscription reaches its expiration date,
     * the system SHALL automatically transition the user to the Free plan.
     * 
     * CURRENT BUG: No scheduled command exists to handle automatic transitions.
     * 
     * **Validates: Requirements 1.4, 2.4**
     */
    public function test_bug_4_expired_subscription_transitions_to_free()
    {
        // Setup: User has canceled subscription that has expired
        $cashierSub = $this->createActiveStripeSubscription($this->workspace, 'professional', 'price_professional');
        
        $this->workspace->subscription()->create([
            'user_id' => $this->user->id,
            'type' => 'default',
            'stripe_id' => $cashierSub->stripe_id,
            'stripe_status' => 'canceled',
            'plan' => 'professional',
            'status' => 'canceling',
            'cancel_at_period_end' => true,
            'ends_at' => now()->subDay(), // Expired yesterday
        ]);

        // Action: Run the expiration command (this command should exist)
        $exitCode = $this->artisan('subscriptions:expire');

        // Expected: Command should exist and run successfully
        $this->assertEquals(
            0,
            $exitCode,
            'Expected subscriptions:expire command to exist and run successfully'
        );
        
        // Expected: User should be on Free plan
        $this->assertEquals(
            'free',
            $this->user->fresh()->current_plan,
            'Expected user to be transitioned to free plan after expiration'
        );
        
        // Expected: Subscription status should be "expired"
        $workspaceSubscription = $this->workspace->subscription()->first();
        $this->assertEquals(
            'expired',
            $workspaceSubscription->status,
            'Expected subscription status to be "expired"'
        );
    }

    /**
     * Bug 5: UI no actualizada después de cambio
     * 
     * EXPECTED BEHAVIOR: When a plan change is completed, the system SHALL emit
     * a broadcast event to update the UI in real-time.
     * 
     * CURRENT BUG: Webhooks update database but don't emit broadcast events.
     * 
     * **Validates: Requirements 1.5, 2.5**
     */
    public function test_bug_5_plan_change_emits_broadcast_event()
    {
        // This test verifies that the SubscriptionUpdated event exists and is broadcastable
        // We'll test this by checking if the event class exists and implements ShouldBroadcast
        
        $eventClass = 'App\\Events\\SubscriptionUpdated';
        
        // Expected: Event class should exist
        $this->assertTrue(
            class_exists($eventClass),
            'Expected SubscriptionUpdated event class to exist'
        );
        
        // Expected: Event should implement ShouldBroadcast
        if (class_exists($eventClass)) {
            $reflection = new \ReflectionClass($eventClass);
            $this->assertTrue(
                $reflection->implementsInterface(\Illuminate\Contracts\Broadcasting\ShouldBroadcast::class),
                'Expected SubscriptionUpdated event to implement ShouldBroadcast interface'
            );
        }
    }

    /**
     * Bug 6: Activación de plan gratuito sin acción clara
     * 
     * EXPECTED BEHAVIOR: When a user with active subscription tries to activate
     * free plan, error response SHALL include can_cancel and cancel_url fields.
     * 
     * CURRENT BUG: Error message doesn't provide actionable information.
     * 
     * **Validates: Requirements 1.6, 2.2**
     */
    public function test_bug_6_free_plan_activation_error_includes_cancel_action()
    {
        // Setup: User has active subscription
        $this->createActiveStripeSubscription($this->workspace, 'starter', 'price_starter');
        
        // Action: User attempts to activate Free plan
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/subscription/activate-free-plan', [
                'plan' => 'free'
            ]);

        // Expected: Response should include cancellation action info
        $response->assertStatus(403);
        $this->assertArrayHasKey(
            'can_cancel',
            $response->json(),
            'Expected can_cancel field in error response'
        );
        $this->assertArrayHasKey(
            'cancel_url',
            $response->json(),
            'Expected cancel_url field in error response'
        );
    }

    /**
     * Bug 7: No mensaje de prorrateo para usuarios con suscripción activa
     * 
     * EXPECTED BEHAVIOR: When a user with active subscription views pricing page,
     * they SHALL see a clear message explaining proration.
     * 
     * CURRENT BUG: No proration message is shown.
     * 
     * Note: This is primarily a frontend bug, but we can test the backend provides
     * the necessary data.
     * 
     * **Validates: Requirements 1.7, 2.7**
     */
    public function test_bug_7_subscription_check_indicates_active_subscription()
    {
        // Setup: User has active subscription
        $this->createActiveStripeSubscription($this->workspace, 'professional', 'price_professional');
        
        // Action: Check active subscription
        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/subscription/check-active');

        $response->assertStatus(200);
        
        // Expected: Response should indicate active subscription
        $this->assertTrue(
            $response->json('has_active_subscription') === true,
            'Expected has_active_subscription to be true'
        );
        
        // Expected: Response should include current plan info
        $this->assertNotEmpty($response->json('current_plan'));
    }

    /**
     * Bug 8: No se puede reutilizar plan activo comprado
     * 
     * EXPECTED BEHAVIOR: When a user has purchased a plan that is still active
     * (within billing period), they SHALL be able to switch to it without payment.
     * 
     * CURRENT BUG: System may require new checkout even for active purchased plans.
     * 
     * **Validates: Requirements 1.8, 2.8**
     */
    public function test_bug_8_can_switch_to_active_purchased_plan()
    {
        // Setup: User has active Professional subscription
        $this->createActiveStripeSubscription($this->workspace, 'professional', 'price_professional');
        
        // User is currently on Starter
        $this->user->update(['current_plan' => 'starter']);
        
        // Action: User switches back to Professional (already purchased and active)
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/subscription/change-plan', [
                'plan' => 'professional'
            ]);

        // Expected: Should allow switch without checkout
        $this->assertTrue(
            $response->json('success') === true,
            'Expected success=true when switching to active purchased plan'
        );
        
        $this->assertFalse(
            $response->json('requires_checkout') === true,
            'Expected requires_checkout to be false for active purchased plan'
        );
        
        // Verify plan was changed
        $this->assertEquals('professional', $this->user->fresh()->current_plan);
    }

    /**
     * Bug 9: No distinción entre renovar y comprar nuevo
     * 
     * EXPECTED BEHAVIOR: The system SHALL distinguish between expired plans
     * (require renewal) and never-purchased plans (require new purchase).
     * 
     * CURRENT BUG: No distinction in the data provided to frontend.
     * 
     * Note: This is primarily a frontend display bug, but backend should provide
     * subscription history data.
     * 
     * **Validates: Requirements 1.9, 2.9**
     */
    public function test_bug_9_subscription_history_tracks_expired_plans()
    {
        // Setup: User had a Professional subscription that expired
        $this->user->subscriptionHistory()->create([
            'plan_name' => 'professional',
            'stripe_price_id' => 'price_professional',
            'price' => 49.00,
            'billing_cycle' => 'monthly',
            'status' => 'expired',
            'started_at' => now()->subMonths(2),
            'ended_at' => now()->subMonth(),
            'reason' => 'subscription_expired',
        ]);

        // Action: Get subscription history
        $history = $this->user->subscriptionHistory()->get();

        // Expected: History should include expired plan
        $this->assertGreaterThan(0, $history->count());
        
        $expiredPlan = $history->where('status', 'expired')->first();
        $this->assertNotNull($expiredPlan, 'Expected to find expired plan in history');
        $this->assertEquals('professional', $expiredPlan->plan_name);
    }

    /**
     * Bug 10: Botones de acción no reflejan estado correcto
     * 
     * EXPECTED BEHAVIOR: The system SHALL provide plan state information
     * (active, expired, never-purchased) to enable correct button display.
     * 
     * CURRENT BUG: Frontend doesn't receive sufficient state information.
     * 
     * Note: This tests that backend provides necessary data structure.
     * 
     * **Validates: Requirements 1.10, 2.10, 2.11**
     */
    public function test_bug_10_check_active_subscription_provides_plan_states()
    {
        // Setup: User has active Professional subscription
        $this->createActiveStripeSubscription($this->workspace, 'professional', 'price_professional');
        
        // User also had an expired Starter subscription
        $this->user->subscriptionHistory()->create([
            'plan_name' => 'starter',
            'stripe_price_id' => 'price_starter',
            'price' => 29.00,
            'billing_cycle' => 'monthly',
            'status' => 'expired',
            'started_at' => now()->subMonths(3),
            'ended_at' => now()->subMonths(2),
            'reason' => 'subscription_expired',
        ]);

        // Action: Check active subscription
        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/subscription/check-active');

        $response->assertStatus(200);
        
        // Expected: Response should include subscription history or plan states
        // This allows frontend to determine which plans are active, expired, or never purchased
        $this->assertTrue(
            $response->json('has_active_subscription') === true ||
            !empty($response->json('subscription_history')) ||
            !empty($response->json('active_subscriptions')),
            'Expected response to include subscription state information'
        );
    }

    /**
     * Helper: Create an active Stripe subscription for testing
     */
    private function createActiveStripeSubscription(Workspace $workspace, string $plan, string $priceId): Subscription
    {
        return $workspace->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_' . uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => $priceId,
            'quantity' => 1,
            'trial_ends_at' => null,
            'ends_at' => null,
            'plan' => $plan,
        ]);
    }
}
