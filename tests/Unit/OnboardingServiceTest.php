<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\OnboardingService;
use App\Services\OnboardingAnalyticsService;
use App\Repositories\OnboardingStateRepository;
use App\Models\User;
use App\Models\OnboardingState;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OnboardingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OnboardingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new OnboardingService(
            new OnboardingStateRepository(),
            new OnboardingAnalyticsService()
        );
    }

    public function test_initialize_onboarding_creates_new_state(): void
    {
        $user = User::factory()->create();

        $state = $this->service->initializeOnboarding($user);

        $this->assertInstanceOf(OnboardingState::class, $state);
        $this->assertEquals($user->id, $state->user_id);
        $this->assertFalse($state->tour_completed);
        $this->assertFalse($state->tour_skipped);
        $this->assertEquals(0, $state->tour_current_step);
        $this->assertIsArray($state->tour_completed_steps);
        $this->assertEmpty($state->tour_completed_steps);
        $this->assertNotNull($state->started_at);
    }

    public function test_initialize_onboarding_returns_existing_state(): void
    {
        $user = User::factory()->create();
        
        // Create initial state
        $firstState = $this->service->initializeOnboarding($user);
        
        // Try to initialize again
        $secondState = $this->service->initializeOnboarding($user);

        $this->assertEquals($firstState->id, $secondState->id);
    }

    public function test_get_onboarding_state_returns_existing_state(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $state = $this->service->getOnboardingState($user);

        $this->assertInstanceOf(OnboardingState::class, $state);
        $this->assertEquals($user->id, $state->user_id);
    }

    public function test_get_onboarding_state_initializes_if_not_exists(): void
    {
        $user = User::factory()->create();

        $state = $this->service->getOnboardingState($user);

        $this->assertInstanceOf(OnboardingState::class, $state);
        $this->assertEquals($user->id, $state->user_id);
    }

    public function test_complete_tour_step_adds_step_to_completed_list(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $this->service->completeTourStep($user, 'step-1');

        $state = $this->service->getOnboardingState($user);
        $this->assertContains('step-1', $state->tour_completed_steps);
    }

    public function test_complete_tour_step_does_not_duplicate_steps(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $this->service->completeTourStep($user, 'step-1');
        $this->service->completeTourStep($user, 'step-1');

        $state = $this->service->getOnboardingState($user);
        $this->assertCount(1, $state->tour_completed_steps);
    }

    public function test_dismiss_tooltip_adds_tooltip_to_dismissed_list(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $this->service->dismissTooltip($user, 'tooltip-1');

        $state = $this->service->getOnboardingState($user);
        $this->assertContains('tooltip-1', $state->dismissed_tooltips);
    }

    public function test_dismiss_tooltip_does_not_duplicate_tooltips(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $this->service->dismissTooltip($user, 'tooltip-1');
        $this->service->dismissTooltip($user, 'tooltip-1');

        $state = $this->service->getOnboardingState($user);
        $this->assertCount(1, $state->dismissed_tooltips);
    }

    public function test_complete_wizard_step_updates_current_step(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $this->service->completeWizardStep($user, 'step-1');

        $state = $this->service->getOnboardingState($user);
        $this->assertEquals(1, $state->wizard_current_step);
    }

    public function test_record_template_selection_marks_template_selected(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $this->service->recordTemplateSelection($user, 'template-123');

        $state = $this->service->getOnboardingState($user);
        $this->assertTrue($state->template_selected);
        $this->assertEquals('template-123', $state->template_id);
    }

    public function test_restart_onboarding_resets_state(): void
    {
        $user = User::factory()->create();
        
        // Initialize and complete some steps
        $this->service->initializeOnboarding($user);
        $this->service->completeTourStep($user, 'step-1');
        $this->service->dismissTooltip($user, 'tooltip-1');

        // Restart
        $newState = $this->service->restartOnboarding($user);

        $this->assertEmpty($newState->tour_completed_steps);
        $this->assertEmpty($newState->dismissed_tooltips);
        $this->assertFalse($newState->tour_completed);
    }

    public function test_is_onboarding_complete_returns_false_initially(): void
    {
        $user = User::factory()->create();
        $this->service->initializeOnboarding($user);

        $isComplete = $this->service->isOnboardingComplete($user);

        $this->assertFalse($isComplete);
    }

    public function test_is_onboarding_complete_returns_true_when_all_stages_done(): void
    {
        $user = User::factory()->create();
        
        // Create state with all stages completed
        OnboardingState::create([
            'user_id' => $user->id,
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
            'started_at' => now(),
        ]);

        $isComplete = $this->service->isOnboardingComplete($user);

        $this->assertTrue($isComplete);
    }

    public function test_is_onboarding_complete_returns_true_when_stages_skipped(): void
    {
        $user = User::factory()->create();
        
        // Create state with stages skipped
        OnboardingState::create([
            'user_id' => $user->id,
            'tour_completed' => false,
            'tour_skipped' => true,
            'tour_current_step' => 0,
            'tour_completed_steps' => [],
            'wizard_completed' => false,
            'wizard_skipped' => true,
            'wizard_current_step' => 0,
            'template_selected' => true,
            'template_id' => 'template-1',
            'dismissed_tooltips' => [],
            'started_at' => now(),
        ]);

        $isComplete = $this->service->isOnboardingComplete($user);

        $this->assertTrue($isComplete);
    }
}
