<?php

namespace Tests\Feature\Console;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Workspace\Subscription as WorkspaceSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;

/**
 * Unit Tests for ExpireSubscriptionsCommand
 * 
 * Tests the automatic expiration of subscriptions that have reached their end date.
 * 
 * **Validates: Requirement 2.4**
 */
class ExpireSubscriptionsCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createTestTables();
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
                $table->string('plan')->nullable();
                $table->string('status')->default('active');
                $table->boolean('cancel_at_period_end')->default(false);
                $table->timestamp('ends_at')->nullable();
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
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('subscription_usage_tracking')) {
            Schema::create('subscription_usage_tracking', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('subscription_history_id');
                $table->integer('year');
                $table->integer('month');
                $table->timestamp('period_start');
                $table->timestamp('period_end');
                $table->integer('publications_used')->default(0);
                $table->integer('publications_limit')->default(0);
                $table->bigInteger('storage_used_bytes')->default(0);
                $table->bigInteger('storage_limit_bytes')->default(0);
                $table->integer('social_accounts_used')->default(0);
                $table->integer('social_accounts_limit')->default(0);
                $table->integer('ai_requests_used')->default(0);
                $table->integer('ai_requests_limit')->nullable();
                $table->boolean('limit_reached')->default(false);
                $table->timestamp('limit_reached_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->timestamps();
            });

            // Insert owner role
            \DB::table('roles')->insert([
                'name' => 'Owner',
                'slug' => 'owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Test: Command finds and expires subscriptions correctly
     * 
     * @test
     */
    public function test_command_finds_and_expires_subscriptions()
    {
        // Create user and workspace
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'current_plan' => 'professional',
            'email_verified_at' => now(),
        ]);
        
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => $user->id,
        ]);

        $user->workspaces()->attach($workspace->id, ['role_id' => 1]);
        $user->update(['current_workspace_id' => $workspace->id]);

        // Create expired subscription
        $subscription = WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test123',
            'stripe_status' => 'canceled',
            'plan' => 'professional',
            'status' => 'canceling',
            'cancel_at_period_end' => true,
            'ends_at' => now()->subDay(), // Expired yesterday
        ]);

        // Run the command
        $exitCode = Artisan::call('subscriptions:expire');

        // Command should succeed
        $this->assertEquals(0, $exitCode);

        // Verify subscription was expired
        $subscription->refresh();
        $this->assertEquals('expired', $subscription->status);
        $this->assertEquals('free', $subscription->plan);

        // Verify user was moved to free plan
        $user->refresh();
        $this->assertEquals('free', $user->current_plan);
    }

    /**
     * Test: Command doesn't affect active subscriptions
     * 
     * @test
     */
    public function test_command_does_not_affect_active_subscriptions()
    {
        // Create user and workspace
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'current_plan' => 'professional',
            'email_verified_at' => now(),
        ]);
        
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => $user->id,
        ]);

        $user->workspaces()->attach($workspace->id, ['role_id' => 1]);
        $user->update(['current_workspace_id' => $workspace->id]);

        // Create active subscription (not expired)
        $subscription = WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test123',
            'stripe_status' => 'active',
            'plan' => 'professional',
            'status' => 'active',
            'cancel_at_period_end' => false,
            'ends_at' => now()->addMonth(), // Not expired
        ]);

        // Run the command
        $exitCode = Artisan::call('subscriptions:expire');

        // Command should succeed
        $this->assertEquals(0, $exitCode);

        // Verify subscription was NOT changed
        $subscription->refresh();
        $this->assertEquals('active', $subscription->status);
        $this->assertEquals('professional', $subscription->plan);

        // Verify user plan was NOT changed
        $user->refresh();
        $this->assertEquals('professional', $user->current_plan);
    }

    /**
     * Test: Command handles subscriptions without ends_at date
     * 
     * @test
     */
    public function test_command_ignores_subscriptions_without_ends_at()
    {
        // Create user and workspace
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'current_plan' => 'professional',
            'email_verified_at' => now(),
        ]);
        
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => $user->id,
        ]);

        $user->workspaces()->attach($workspace->id, ['role_id' => 1]);
        $user->update(['current_workspace_id' => $workspace->id]);

        // Create subscription without ends_at
        $subscription = WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test123',
            'stripe_status' => 'active',
            'plan' => 'professional',
            'status' => 'canceling',
            'cancel_at_period_end' => true,
            'ends_at' => null, // No end date
        ]);

        // Run the command
        $exitCode = Artisan::call('subscriptions:expire');

        // Command should succeed
        $this->assertEquals(0, $exitCode);

        // Verify subscription was NOT changed
        $subscription->refresh();
        $this->assertEquals('canceling', $subscription->status);
        $this->assertEquals('professional', $subscription->plan);
    }

    /**
     * Test: Command handles multiple expired subscriptions
     * 
     * @test
     */
    public function test_command_handles_multiple_expired_subscriptions()
    {
        // Create multiple users with expired subscriptions
        for ($i = 1; $i <= 3; $i++) {
            $user = User::create([
                'name' => "Test User {$i}",
                'email' => "test{$i}@example.com",
                'password' => bcrypt('password'),
                'current_plan' => 'professional',
                'email_verified_at' => now(),
            ]);
            
            $workspace = Workspace::create([
                'name' => "Test Workspace {$i}",
                'slug' => "test-workspace-{$i}",
                'created_by' => $user->id,
            ]);

            $user->workspaces()->attach($workspace->id, ['role_id' => 1]);
            $user->update(['current_workspace_id' => $workspace->id]);

            WorkspaceSubscription::create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'type' => 'default',
                'stripe_id' => "sub_test{$i}",
                'stripe_status' => 'canceled',
                'plan' => 'professional',
                'status' => 'canceling',
                'cancel_at_period_end' => true,
                'ends_at' => now()->subDay(),
            ]);
        }

        // Run the command
        $exitCode = Artisan::call('subscriptions:expire');

        // Command should succeed
        $this->assertEquals(0, $exitCode);

        // Verify all subscriptions were expired
        $expiredCount = WorkspaceSubscription::where('status', 'expired')->count();
        $this->assertEquals(3, $expiredCount);

        // Verify all users were moved to free plan
        $freeUsers = User::where('current_plan', 'free')->count();
        $this->assertEquals(3, $freeUsers);
    }
}
