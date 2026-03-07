<?php

namespace Tests\Feature\Events;

use Tests\TestCase;
use App\Models\User;
use App\Events\Subscription\SubscriptionUpdated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

/**
 * Tests for SubscriptionUpdated Event Broadcasting
 * 
 * Tests that the SubscriptionUpdated event:
 * - Broadcasts to the correct channel
 * - Includes correct data (plan, timestamp)
 * - Uses the correct event name
 * 
 * **Validates: Requirements 2.5**
 */
class SubscriptionUpdatedTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

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
        ]);
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
    }

    /**
     * Test that SubscriptionUpdated event broadcasts to correct channel
     * 
     * @test
     */
    public function test_subscription_updated_event_broadcasts_to_correct_channel()
    {
        $event = new SubscriptionUpdated($this->user, 'professional');

        $channels = $event->broadcastOn();

        $this->assertIsArray($channels);
        $this->assertCount(1, $channels);
        $this->assertEquals('user.' . $this->user->id, $channels[0]->name);
    }

    /**
     * Test that SubscriptionUpdated event uses correct event name
     * 
     * @test
     */
    public function test_subscription_updated_event_uses_correct_event_name()
    {
        $event = new SubscriptionUpdated($this->user, 'professional');

        $eventName = $event->broadcastAs();

        $this->assertEquals('subscription.updated', $eventName);
    }

    /**
     * Test that SubscriptionUpdated event includes correct data
     * 
     * @test
     */
    public function test_subscription_updated_event_includes_correct_data()
    {
        $event = new SubscriptionUpdated($this->user, 'professional');

        $data = $event->broadcastWith();

        $this->assertIsArray($data);
        $this->assertArrayHasKey('plan', $data);
        $this->assertArrayHasKey('timestamp', $data);
        $this->assertEquals('professional', $data['plan']);
        $this->assertNotEmpty($data['timestamp']);
    }

    /**
     * Test that SubscriptionUpdated event timestamp is in ISO8601 format
     * 
     * @test
     */
    public function test_subscription_updated_event_timestamp_is_iso8601_format()
    {
        $event = new SubscriptionUpdated($this->user, 'enterprise');

        $data = $event->broadcastWith();

        // Verify timestamp is in ISO8601 format
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/',
            $data['timestamp']
        );
    }

    /**
     * Test that SubscriptionUpdated event can be dispatched
     * 
     * @test
     */
    public function test_subscription_updated_event_can_be_dispatched()
    {
        Event::fake([SubscriptionUpdated::class]);

        broadcast(new SubscriptionUpdated($this->user, 'starter'));

        Event::assertDispatched(SubscriptionUpdated::class, function ($event) {
            return $event->user->id === $this->user->id
                && $event->newPlan === 'starter';
        });
    }

    /**
     * Test that SubscriptionUpdated event works with different plan types
     * 
     * @test
     */
    public function test_subscription_updated_event_works_with_different_plans()
    {
        $plans = ['free', 'demo', 'starter', 'professional', 'enterprise'];

        foreach ($plans as $plan) {
            $event = new SubscriptionUpdated($this->user, $plan);
            $data = $event->broadcastWith();

            $this->assertEquals($plan, $data['plan']);
        }
    }
}
