<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\OnboardingState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingRestartTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that restarting onboarding resets the state
     */
    public function test_restart_onboarding_resets_state_to_initial_values(): void
    {
        $user = User::factory()->create();
        
        // Create an onboarding state with some progress
        OnboardingState::create([
            'user_id' => $user->id,
            'tour_completed' => true,
            'tour_skipped' => false,
            'tour_current_step' => 5,
            'tour_completed_steps' => ['step-1', 'step-2', 'step-3'],
            'wizard_completed' => true,
            'wizard_skipped' => false,
            'wizard_current_step' => 2,
            'template_selected' => true,
            'template_id' => 'template-123',
            'dismissed_tooltips' => ['tooltip-1', 'tooltip-2'],
            'completed_at' => now(),
            'started_at' => now()->subHours(2),
        ]);

        // Make the restart request
        $response = $this->actingAs($user)->postJson('/api/v1/onboarding/restart');

        // Assert successful response
        $response->assertOk();
        $response->assertJsonStructure([
            'message',
            'state' => [
                'tourCompleted',
                'tourSkipped',
                'tourCurrentStep',
                'tourCompletedSteps',
                'wizardCompleted',
                'wizardSkipped',
                'wizardCurrentStep',
                'templateSelected',
                'templateId',
                'dismissedTooltips',
                'completedAt',
                'startedAt',
                'completionPercentage',
            ],
        ]);

        // Assert state is reset to initial values
        $state = $response->json('state');
        $this->assertFalse($state['tourCompleted']);
        $this->assertFalse($state['tourSkipped']);
        $this->assertEquals(0, $state['tourCurrentStep']);
        $this->assertEmpty($state['tourCompletedSteps']);
        $this->assertFalse($state['wizardCompleted']);
        $this->assertFalse($state['wizardSkipped']);
        $this->assertEquals(0, $state['wizardCurrentStep']);
        $this->assertFalse($state['templateSelected']);
        $this->assertNull($state['templateId']);
        $this->assertEmpty($state['dismissedTooltips']);
        $this->assertNull($state['completedAt']);
        $this->assertEquals(0, $state['completionPercentage']);
    }

    /**
     * Test that restarting onboarding preserves user data
     */
    public function test_restart_onboarding_preserves_user_data(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
        
        // Create an onboarding state
        OnboardingState::create([
            'user_id' => $user->id,
            'tour_completed' => true,
            'started_at' => now(),
        ]);

        // Make the restart request
        $response = $this->actingAs($user)->postJson('/api/v1/onboarding/restart');

        // Assert successful response
        $response->assertOk();

        // Verify user data is preserved
        $user->refresh();
        $this->assertEquals('Test User', $user->name);
        $this->assertEquals('test@example.com', $user->email);
    }

    /**
     * Test that restart requires authentication
     */
    public function test_restart_onboarding_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/onboarding/restart');

        $response->assertUnauthorized();
    }
}
