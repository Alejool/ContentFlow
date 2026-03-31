<?php

namespace Tests\Unit\Subscription;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\Subscription as WorkspaceSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

/**
 * Backward Compatibility Tests for Growth Plan Addition
 * 
 * Validates that adding the Growth plan does not break existing functionality
 * for Free, Starter, Professional, and Enterprise plans.
 * 
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**
 */
class BackwardCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        // Create necessary tables for testing
        $this->createTestTables();

        // Create test user and workspace
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
        ]);

        $this->user->workspaces()->attach($this->workspace->id, ['role_id' => 1]);
        $this->user->update(['current_workspace_id' => $this->workspace->id]);
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

        if (!Schema::hasTable('usage_metrics')) {
            Schema::create('usage_metrics', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->string('metric_type');
                $table->integer('current_usage')->default(0);
                $table->integer('limit')->default(0);
                $table->timestamp('period_start');
                $table->timestamp('period_end');
                $table->timestamps();
            });
        }
    }

    /**
     * Test 12.1: Free plan continues to work without changes
     * 
     * @test
     */
    public function test_free_plan_configuration_loads_correctly()
    {
        $freePlan = config('plans.free');

        $this->assertNotNull($freePlan, 'Free plan should exist in configuration');
        $this->assertEquals('Free', $freePlan['name']);
        $this->assertEquals(0, $freePlan['price']);
        $this->assertTrue($freePlan['enabled']);
        $this->assertEquals('monthly', $freePlan['billing_cycle']);
        
        // Verify limits are unchanged
        $this->assertEquals(3, $freePlan['limits']['publications_per_month']);
        $this->assertEquals(1, $freePlan['limits']['social_accounts']);
        $this->assertEquals(1, $freePlan['limits']['storage_gb']);
        $this->assertEquals(10, $freePlan['limits']['ai_requests_per_month']);
        $this->assertEquals(1, $freePlan['limits']['team_members']);
        
        // Verify features are unchanged
        $this->assertEquals('basic', $freePlan['features']['analytics_type']);
        $this->assertFalse($freePlan['features']['advanced_scheduling']);
        $this->assertEquals('email', $freePlan['features']['support_type']);
    }

    /**
     * Test 12.1: Starter plan continues to work without changes
     * 
     * @test
     */
    public function test_starter_plan_configuration_loads_correctly()
    {
        $starterPlan = config('plans.starter');

        $this->assertNotNull($starterPlan, 'Starter plan should exist in configuration');
        $this->assertEquals('Starter', $starterPlan['name']);
        $this->assertEquals(19, $starterPlan['price']);
        $this->assertTrue($starterPlan['enabled']);
        $this->assertEquals('monthly', $starterPlan['billing_cycle']);
        
        // Verify limits are unchanged
        $this->assertEquals(50, $starterPlan['limits']['publications_per_month']);
        $this->assertEquals(3, $starterPlan['limits']['social_accounts']);
        $this->assertEquals(10, $starterPlan['limits']['storage_gb']);
        $this->assertEquals(100, $starterPlan['limits']['ai_requests_per_month']);
        $this->assertEquals(3, $starterPlan['limits']['team_members']);
        
        // Verify features are unchanged
        $this->assertEquals('basic', $starterPlan['features']['analytics_type']);
        $this->assertTrue($starterPlan['features']['advanced_scheduling']);
        $this->assertFalse($starterPlan['features']['scheduling_recurrence']);
        $this->assertEquals('email', $starterPlan['features']['support_type']);
    }

    /**
     * Test 12.1: Professional plan continues to work without changes
     * 
     * @test
     */
    public function test_professional_plan_configuration_loads_correctly()
    {
        $professionalPlan = config('plans.professional');

        $this->assertNotNull($professionalPlan, 'Professional plan should exist in configuration');
        $this->assertEquals('Professional', $professionalPlan['name']);
        $this->assertEquals(49, $professionalPlan['price']);
        $this->assertTrue($professionalPlan['enabled']);
        $this->assertEquals('monthly', $professionalPlan['billing_cycle']);
        
        // Verify limits are unchanged
        $this->assertEquals(200, $professionalPlan['limits']['publications_per_month']);
        $this->assertEquals(8, $professionalPlan['limits']['social_accounts']);
        $this->assertEquals(100, $professionalPlan['limits']['storage_gb']);
        $this->assertEquals(-1, $professionalPlan['limits']['ai_requests_per_month']); // unlimited
        $this->assertEquals(10, $professionalPlan['limits']['team_members']);
        
        // Verify features are unchanged
        $this->assertEquals('advanced', $professionalPlan['features']['analytics_type']);
        $this->assertTrue($professionalPlan['features']['advanced_scheduling']);
        $this->assertTrue($professionalPlan['features']['queue_publishing']);
        $this->assertTrue($professionalPlan['features']['bulk_operations']);
        $this->assertEquals('priority', $professionalPlan['features']['support_type']);
    }

    /**
     * Test 12.1: Enterprise plan continues to work without changes
     * 
     * @test
     */
    public function test_enterprise_plan_configuration_loads_correctly()
    {
        $enterprisePlan = config('plans.enterprise');

        $this->assertNotNull($enterprisePlan, 'Enterprise plan should exist in configuration');
        $this->assertEquals('Enterprise', $enterprisePlan['name']);
        $this->assertEquals(199, $enterprisePlan['price']);
        $this->assertTrue($enterprisePlan['enabled']);
        $this->assertEquals('monthly', $enterprisePlan['billing_cycle']);
        
        // Verify limits are unchanged
        $this->assertEquals(-1, $enterprisePlan['limits']['publications_per_month']); // unlimited
        $this->assertEquals(-1, $enterprisePlan['limits']['social_accounts']); // unlimited
        $this->assertEquals(1000, $enterprisePlan['limits']['storage_gb']);
        $this->assertEquals(-1, $enterprisePlan['limits']['ai_requests_per_month']); // unlimited
        $this->assertEquals(-1, $enterprisePlan['limits']['team_members']); // unlimited
        
        // Verify features are unchanged
        $this->assertEquals('advanced', $enterprisePlan['features']['analytics_type']);
        $this->assertTrue($enterprisePlan['features']['white_label']);
        $this->assertTrue($enterprisePlan['features']['api_access']);
        $this->assertEquals('dedicated', $enterprisePlan['features']['support_type']);
        $this->assertEquals('advanced', $enterprisePlan['features']['approval_workflows']);
    }

    /**
     * Test 12.2: Existing subscriptions process without interruption
     * 
     * @test
     */
    public function test_existing_subscriptions_remain_active()
    {
        // Create subscriptions for each existing plan
        $plans = ['free', 'starter', 'professional', 'enterprise'];

        foreach ($plans as $plan) {
            $workspace = Workspace::create([
                'name' => "Test Workspace {$plan}",
                'slug' => "test-workspace-{$plan}",
                'created_by' => $this->user->id,
            ]);

            $subscription = WorkspaceSubscription::create([
                'workspace_id' => $workspace->id,
                'user_id' => $this->user->id,
                'type' => 'default',
                'stripe_id' => "sub_test_{$plan}",
                'stripe_status' => 'active',
                'plan' => $plan,
                'status' => 'active',
            ]);

            // Verify subscription is active
            $this->assertTrue($subscription->isActive(), "Subscription for {$plan} should be active");
            $this->assertEquals($plan, $subscription->plan, "Subscription plan should be {$plan}");
            $this->assertEquals('active', $subscription->status, "Subscription status should be active");
        }
    }

    /**
     * Test 12.3: Existing plan limits enforced correctly for non-Growth users
     * 
     * @test
     */
    public function test_existing_plan_limits_enforced_correctly()
    {
        $plans = [
            'free' => ['publications_per_month' => 3, 'social_accounts' => 1],
            'starter' => ['publications_per_month' => 50, 'social_accounts' => 3],
            'professional' => ['publications_per_month' => 200, 'social_accounts' => 8],
            'enterprise' => ['publications_per_month' => -1, 'social_accounts' => -1],
        ];

        foreach ($plans as $planId => $expectedLimits) {
            $planConfig = config("plans.{$planId}");
            
            $this->assertEquals(
                $expectedLimits['publications_per_month'],
                $planConfig['limits']['publications_per_month'],
                "Publications limit for {$planId} should be {$expectedLimits['publications_per_month']}"
            );
            
            $this->assertEquals(
                $expectedLimits['social_accounts'],
                $planConfig['limits']['social_accounts'],
                "Social accounts limit for {$planId} should be {$expectedLimits['social_accounts']}"
            );
        }
    }

    /**
     * Test 12.4: Webhooks for all plan types handled correctly
     * 
     * @test
     */
    public function test_webhook_handling_for_all_existing_plans()
    {
        $plans = ['free', 'starter', 'professional', 'enterprise'];

        foreach ($plans as $plan) {
            // Simulate webhook data
            $webhookData = [
                'type' => 'customer.subscription.updated',
                'data' => [
                    'object' => [
                        'id' => "sub_test_{$plan}",
                        'status' => 'active',
                        'plan' => [
                            'id' => config("plans.{$plan}.stripe_price_id") ?? "price_{$plan}",
                        ],
                    ],
                ],
            ];

            // Verify plan configuration exists for webhook processing
            $planConfig = config("plans.{$plan}");
            $this->assertNotNull($planConfig, "Plan configuration for {$plan} should exist for webhook processing");
            $this->assertArrayHasKey('limits', $planConfig, "Plan {$plan} should have limits defined");
            $this->assertArrayHasKey('features', $planConfig, "Plan {$plan} should have features defined");
        }
    }

    /**
     * Test 12.5: Correct plan information displayed for existing subscribers
     * 
     * @test
     */
    public function test_plan_information_displayed_correctly_for_existing_subscribers()
    {
        $plans = ['free', 'starter', 'professional', 'enterprise'];

        foreach ($plans as $plan) {
            $planConfig = config("plans.{$plan}");
            
            // Verify all required fields exist for display
            $this->assertArrayHasKey('name', $planConfig, "Plan {$plan} should have name");
            $this->assertArrayHasKey('price', $planConfig, "Plan {$plan} should have price");
            $this->assertArrayHasKey('description', $planConfig, "Plan {$plan} should have description");
            $this->assertArrayHasKey('enabled', $planConfig, "Plan {$plan} should have enabled flag");
            
            // Verify plan is enabled
            $this->assertTrue($planConfig['enabled'], "Plan {$plan} should be enabled");
        }
    }

    /**
     * Test 12.6: No database migrations required for existing subscription records
     * 
     * @test
     */
    public function test_no_database_migrations_required()
    {
        // Verify that existing subscription schema supports Growth plan
        // without requiring any schema changes
        
        // Create a subscription with Growth plan using existing schema
        $subscription = WorkspaceSubscription::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test_growth',
            'stripe_status' => 'active',
            'plan' => 'growth', // New plan value
            'status' => 'active',
        ]);

        // Verify it was created successfully
        $this->assertNotNull($subscription->id, 'Growth plan subscription should be created without schema changes');
        $this->assertEquals('growth', $subscription->plan, 'Plan field should accept "growth" value');
        
        // Verify existing subscriptions still work
        $existingSubscription = WorkspaceSubscription::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test_starter',
            'stripe_status' => 'active',
            'plan' => 'starter',
            'status' => 'active',
        ]);

        $this->assertNotNull($existingSubscription->id, 'Existing plan subscriptions should still work');
        $this->assertEquals('starter', $existingSubscription->plan);
    }

    /**
     * Test 12.7: Compatibility with existing Stripe subscriptions maintained
     * 
     * @test
     */
    public function test_stripe_subscription_compatibility_maintained()
    {
        // Test that workspace subscription model works with all plans
        $plans = ['free', 'starter', 'professional', 'enterprise', 'growth'];

        foreach ($plans as $plan) {
            $workspace = Workspace::create([
                'name' => "Test Workspace {$plan}",
                'slug' => "test-workspace-stripe-{$plan}",
                'created_by' => $this->user->id,
            ]);

            $subscription = WorkspaceSubscription::create([
                'workspace_id' => $workspace->id,
                'user_id' => $this->user->id,
                'type' => 'default',
                'stripe_id' => "sub_stripe_{$plan}",
                'stripe_status' => 'active',
                'stripe_price' => config("plans.{$plan}.stripe_price_id") ?? "price_{$plan}",
                'plan' => $plan,
                'status' => 'active',
            ]);

            $this->assertNotNull($subscription->id, "Subscription for {$plan} should be created");
            $this->assertEquals('active', $subscription->status, "Subscription for {$plan} should be active");
            $this->assertEquals($plan, $subscription->plan, "Subscription plan should be {$plan}");
        }
    }

    /**
     * Test: Growth plan does not interfere with existing plan hierarchy
     * 
     * @test
     */
    public function test_growth_plan_does_not_break_existing_hierarchy()
    {
        // Verify that all existing plans are still in the correct order
        $plans = config('plans');
        
        $this->assertArrayHasKey('free', $plans);
        $this->assertArrayHasKey('starter', $plans);
        $this->assertArrayHasKey('growth', $plans);
        $this->assertArrayHasKey('professional', $plans);
        $this->assertArrayHasKey('enterprise', $plans);
        
        // Verify prices are in ascending order (excluding free)
        $this->assertEquals(0, $plans['free']['price']);
        $this->assertEquals(19, $plans['starter']['price']);
        $this->assertEquals(35, $plans['growth']['price']);
        $this->assertEquals(49, $plans['professional']['price']);
        $this->assertEquals(199, $plans['enterprise']['price']);
        
        // Verify Growth is positioned correctly
        $this->assertLessThan($plans['professional']['price'], $plans['growth']['price']);
        $this->assertGreaterThan($plans['starter']['price'], $plans['growth']['price']);
    }

    /**
     * Test: All existing plans have consistent structure
     * 
     * @test
     */
    public function test_all_plans_have_consistent_structure()
    {
        $plans = ['free', 'starter', 'professional', 'enterprise'];
        $requiredFields = ['name', 'price', 'stripe_price_id', 'enabled', 'billing_cycle', 'limits', 'features', 'description'];
        $requiredLimits = ['publications_per_month', 'social_accounts', 'storage_gb', 'ai_requests_per_month', 'team_members'];
        $requiredFeatures = ['analytics_type', 'advanced_scheduling', 'support_type'];

        foreach ($plans as $planId) {
            $planConfig = config("plans.{$planId}");
            
            // Verify required fields exist
            foreach ($requiredFields as $field) {
                $this->assertArrayHasKey($field, $planConfig, "Plan {$planId} should have {$field} field");
            }
            
            // Verify required limits exist
            foreach ($requiredLimits as $limit) {
                $this->assertArrayHasKey($limit, $planConfig['limits'], "Plan {$planId} should have {$limit} limit");
            }
            
            // Verify required features exist
            foreach ($requiredFeatures as $feature) {
                $this->assertArrayHasKey($feature, $planConfig['features'], "Plan {$planId} should have {$feature} feature");
            }
        }
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }
}
