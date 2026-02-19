<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\OnboardingAnalyticsService;
use App\Models\User;
use App\Models\OnboardingAnalytics;
use App\Models\OnboardingState;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OnboardingAnalyticsServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OnboardingAnalyticsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new OnboardingAnalyticsService();
    }

    public function test_record_step_completion_creates_analytics_record(): void
    {
        $user = User::factory()->create();

        $this->service->recordStepCompletion($user, 'step-1', 'tour', 120);

        $this->assertDatabaseHas('onboarding_analytics', [
            'user_id' => $user->id,
            'event_type' => 'step_completed',
            'step_id' => 'step-1',
            'duration_seconds' => 120,
        ]);
    }

    public function test_record_skip_event_creates_analytics_record(): void
    {
        $user = User::factory()->create();

        $this->service->recordSkipEvent($user, 'tour-step-0', 'tour');

        $this->assertDatabaseHas('onboarding_analytics', [
            'user_id' => $user->id,
            'event_type' => 'step_skipped',
            'step_id' => 'tour-step-0',
        ]);
    }

    public function test_record_abandonment_creates_analytics_record(): void
    {
        $user = User::factory()->create();

        $this->service->recordAbandonment($user, 'step-3', 'tour');

        $this->assertDatabaseHas('onboarding_analytics', [
            'user_id' => $user->id,
            'event_type' => 'onboarding_abandoned',
            'step_id' => 'step-3',
        ]);
    }

    public function test_record_tooltip_dismissal_creates_analytics_record(): void
    {
        $user = User::factory()->create();

        $this->service->recordTooltipDismissal($user, 'tooltip-1');

        $this->assertDatabaseHas('onboarding_analytics', [
            'user_id' => $user->id,
            'event_type' => 'tooltip_dismissed',
            'step_id' => 'tooltip-1',
        ]);
    }

    public function test_record_template_selection_creates_analytics_record(): void
    {
        $user = User::factory()->create();

        $this->service->recordTemplateSelection($user, 'template-123');

        $this->assertDatabaseHas('onboarding_analytics', [
            'user_id' => $user->id,
            'event_type' => 'template_selected',
            'step_id' => 'template_selection',
        ]);
    }

    public function test_calculate_duration_returns_correct_seconds(): void
    {
        $startTime = new \DateTime('2024-01-01 10:00:00');
        $endTime = new \DateTime('2024-01-01 10:02:00');

        $duration = $this->service->calculateDuration($startTime, $endTime);

        $this->assertEquals(120, $duration);
    }

    public function test_get_aggregate_statistics_returns_correct_structure(): void
    {
        // Create some test data
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        OnboardingState::create([
            'user_id' => $user1->id,
            'tour_completed' => true,
            'tour_skipped' => false,
            'tour_current_step' => 5,
            'tour_completed_steps' => ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'],
            'wizard_completed' => true,
            'wizard_skipped' => false,
            'wizard_current_step' => 3,
            'template_selected' => true,
            'template_id' => 'template-1',
            'dismissed_tooltips' => [],
            'started_at' => now()->subHours(2),
            'completed_at' => now(),
        ]);

        OnboardingState::create([
            'user_id' => $user2->id,
            'tour_completed' => false,
            'tour_skipped' => false,
            'tour_current_step' => 2,
            'tour_completed_steps' => ['step-1', 'step-2'],
            'wizard_completed' => false,
            'wizard_skipped' => false,
            'wizard_current_step' => 0,
            'template_selected' => false,
            'template_id' => null,
            'dismissed_tooltips' => [],
            'started_at' => now()->subHour(),
        ]);

        $stats = $this->service->getAggregateStatistics();

        $this->assertArrayHasKey('total_users', $stats);
        $this->assertArrayHasKey('completed_users', $stats);
        $this->assertArrayHasKey('overall_completion_rate', $stats);
        $this->assertArrayHasKey('tour_statistics', $stats);
        $this->assertArrayHasKey('wizard_statistics', $stats);
        $this->assertArrayHasKey('template_statistics', $stats);
        $this->assertEquals(2, $stats['total_users']);
        $this->assertEquals(1, $stats['completed_users']);
    }

    public function test_get_step_completion_rates_returns_correct_structure(): void
    {
        $user = User::factory()->create();

        // Create some analytics records
        OnboardingAnalytics::create([
            'user_id' => $user->id,
            'event_type' => 'step_completed',
            'step_id' => 'step-1',
            'event_data' => ['step_type' => 'tour'],
            'duration_seconds' => 60,
        ]);

        OnboardingAnalytics::create([
            'user_id' => $user->id,
            'event_type' => 'step_skipped',
            'step_id' => 'step-2',
            'event_data' => ['step_type' => 'tour'],
            'duration_seconds' => null,
        ]);

        $rates = $this->service->getStepCompletionRates();

        $this->assertIsArray($rates);
        $this->assertNotEmpty($rates);
        
        foreach ($rates as $rate) {
            $this->assertArrayHasKey('step_id', $rate);
            $this->assertArrayHasKey('completed', $rate);
            $this->assertArrayHasKey('skipped', $rate);
            $this->assertArrayHasKey('completion_rate', $rate);
            $this->assertArrayHasKey('skip_rate', $rate);
        }
    }
}
