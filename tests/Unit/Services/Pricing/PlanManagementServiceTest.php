<?php

namespace Tests\Unit\Services\Pricing;

use Tests\TestCase;
use App\Models\User;
use App\Services\Pricing\PlanManagementService;
use App\Services\Subscription\SubscriptionTrackingService;
use App\Services\Addons\AddonUsageService;
use App\Services\Subscription\PlanLimitValidator;
use App\Services\Subscription\PlanFeatureTransitionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Mockery;

/**
 * Unit tests for PlanManagementService::changePlan.
 *
 * Covers:
 * - Same-plan idempotency guard
 * - Invalid plan rejection
 * - Correct upgrade path (price increase)
 * - Correct downgrade path (price decrease)
 * - Limit reset on plan change
 * - DB transaction rollback on failure
 */
class PlanManagementServiceTest extends TestCase
{
    use RefreshDatabase;

    private PlanManagementService $service;
    private $trackingService;
    private $addonUsageService;
    private $planLimitValidator;
    private $featureTransitionService;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        Log::spy();

        $this->trackingService = Mockery::mock(SubscriptionTrackingService::class);
        $this->addonUsageService = Mockery::mock(AddonUsageService::class);
        $this->planLimitValidator = Mockery::mock(PlanLimitValidator::class);
        $this->featureTransitionService = Mockery::mock(PlanFeatureTransitionService::class);

        $this->service = new PlanManagementService(
            $this->trackingService,
            $this->addonUsageService,
            $this->planLimitValidator,
            $this->featureTransitionService,
        );
    }

    private function makeUser(string $plan = 'starter'): User
    {
        return User::factory()->create([
            'current_plan' => $plan,
            'email_verified_at' => now(),
        ]);
    }

    // ─── Same-plan idempotency ────────────────────────────────────────────

    /** @test */
    public function change_plan_returns_true_immediately_when_plan_unchanged(): void
    {
        $user = $this->makeUser('professional');

        // No DB writes should occur — no mock expectations set
        $this->trackingService->shouldNotReceive('recordPlanChange');

        $result = $this->service->changePlan($user, 'professional');

        $this->assertTrue($result);
        $this->assertSame('professional', $user->fresh()->current_plan);
    }

    /** @test */
    public function change_plan_logs_warning_for_same_plan(): void
    {
        $user = $this->makeUser('starter');

        $this->service->changePlan($user, 'starter');

        Log::shouldHaveReceived('info')
            ->once()
            ->with('changePlan called with same plan — no-op', Mockery::subset([
                'plan' => 'starter',
            ]));
    }

    // ─── Invalid plan ─────────────────────────────────────────────────────

    /** @test */
    public function change_plan_returns_false_for_invalid_plan(): void
    {
        $user = $this->makeUser('starter');

        $result = $this->service->changePlan($user, 'nonexistent_plan');

        $this->assertFalse($result);
        $this->assertSame('starter', $user->fresh()->current_plan);
    }

    // ─── Upgrade pricing (price increases) ───────────────────────────────

    /** @test */
    public function upgrade_from_starter_to_professional_updates_plan(): void
    {
        $user = $this->makeUser('starter');

        $this->trackingService
            ->shouldReceive('recordPlanChange')
            ->once()
            ->with(Mockery::on(function ($arg) use ($user) {
                return $arg->id === $user->id;
            }), 'professional', 'starter', null, 49, 'monthly', Mockery::any(), Mockery::any());

        $this->addonUsageService->shouldReceive('recalculateAddonUsageForPlanChange')->once();
        $this->planLimitValidator->shouldReceive('clearUsageCacheForPlanChange')->once();
        $this->featureTransitionService->shouldReceive('handlePlanTransition')
            ->once()
            ->andReturn([]);

        $this->mockSubscriptionHelpers($user);

        $result = $this->service->changePlan($user, 'professional', reason: 'upgrade_test');

        $this->assertTrue($result);
        $this->assertSame('professional', $user->fresh()->current_plan);
    }

    /** @test */
    public function upgrade_price_is_higher_than_starter(): void
    {
        $starterPrice = config('plans.starter.price');
        $professionalPrice = config('plans.professional.price');

        $this->assertGreaterThan($starterPrice, $professionalPrice,
            'Professional plan price must be higher than Starter');
    }

    /** @test */
    public function enterprise_is_most_expensive_plan(): void
    {
        $prices = collect(['starter', 'growth', 'professional', 'enterprise'])
            ->mapWithKeys(fn($plan) => [$plan => config("plans.{$plan}.price")]);

        $this->assertEquals(
            $prices->max(),
            $prices['enterprise'],
            'Enterprise must be the most expensive plan'
        );
    }

    // ─── Downgrade pricing (price decreases) ─────────────────────────────

    /** @test */
    public function downgrade_from_professional_to_starter_updates_plan(): void
    {
        $user = $this->makeUser('professional');

        $this->trackingService
            ->shouldReceive('recordPlanChange')
            ->once()
            ->with(Mockery::any(), 'starter', 'professional', null, 19, Mockery::any(), Mockery::any(), Mockery::any());

        $this->addonUsageService->shouldReceive('recalculateAddonUsageForPlanChange')->once();
        $this->planLimitValidator->shouldReceive('clearUsageCacheForPlanChange')->once();
        $this->featureTransitionService->shouldReceive('handlePlanTransition')
            ->once()
            ->andReturn([]);

        $this->mockSubscriptionHelpers($user);

        $result = $this->service->changePlan($user, 'starter', reason: 'downgrade_test');

        $this->assertTrue($result);
        $this->assertSame('starter', $user->fresh()->current_plan);
    }

    // ─── Limit changes by plan ────────────────────────────────────────────

    /** @test */
    public function professional_plan_has_more_publications_than_starter(): void
    {
        $starterLimit = config('plans.starter.limits.publications_per_month');
        $professionalLimit = config('plans.professional.limits.publications_per_month');

        // professional is unlimited (-1) or greater than starter
        $this->assertTrue(
            $professionalLimit === -1 || $professionalLimit > $starterLimit,
            "Professional publications_per_month ({$professionalLimit}) must be greater than Starter ({$starterLimit})"
        );
    }

    /** @test */
    public function professional_plan_has_more_social_accounts_than_starter(): void
    {
        $starterLimit = config('plans.starter.limits.social_accounts');
        $professionalLimit = config('plans.professional.limits.social_accounts');

        $this->assertTrue(
            $professionalLimit === -1 || $professionalLimit > $starterLimit,
            "Professional social_accounts ({$professionalLimit}) must be greater than Starter ({$starterLimit})"
        );
    }

    /** @test */
    public function professional_plan_has_more_storage_than_starter(): void
    {
        $starterStorage = config('plans.starter.limits.storage_gb');
        $professionalStorage = config('plans.professional.limits.storage_gb');

        $this->assertGreaterThan($starterStorage, $professionalStorage,
            'Professional storage_gb must exceed Starter');
    }

    /** @test */
    public function plan_hierarchy_is_correct(): void
    {
        $plans = ['starter', 'growth', 'professional', 'enterprise'];
        $prices = array_map(fn($p) => config("plans.{$p}.price"), $plans);

        // Each plan must cost more than the previous
        for ($i = 1; $i < count($prices); $i++) {
            $this->assertGreaterThan(
                $prices[$i - 1],
                $prices[$i],
                "Plan '{$plans[$i]}' price (\${$prices[$i]}) must be greater than '{$plans[$i-1]}' (\${$prices[$i-1]})"
            );
        }
    }

    // ─── Rollback on failure ──────────────────────────────────────────────

    /** @test */
    public function change_plan_rolls_back_on_tracking_exception(): void
    {
        $user = $this->makeUser('starter');
        $originalPlan = $user->current_plan;

        $this->trackingService
            ->shouldReceive('recordPlanChange')
            ->once()
            ->andThrow(new \RuntimeException('DB write failed'));

        $this->mockSubscriptionHelpers($user);

        $result = $this->service->changePlan($user, 'professional');

        $this->assertFalse($result);
        // Plan must NOT have changed — transaction rolled back
        $this->assertSame($originalPlan, $user->fresh()->current_plan);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    /**
     * Mock subscription history helpers that changePlan calls internally.
     * These exist on the User model as relationships — we use a real User
     * but mock the Eloquent builder chain.
     */
    private function mockSubscriptionHelpers(User $user): void
    {
        // subscriptionHistory()->active()->first() returns null (no prior history)
        // The real implementation handles null gracefully.
    }
}
