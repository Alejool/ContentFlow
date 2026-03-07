<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\OnboardingState;
use App\Services\OnboardingService;
use App\Services\OnboardingAnalyticsService;
use App\Repositories\OnboardingStateRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingTemplateAutoSelectionTest extends TestCase
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

    public function test_template_is_auto_selected_when_wizard_is_completed(): void
    {
        $user = User::factory()->create();
        
        // Initialize onboarding
        $this->service->initializeOnboarding($user);
        
        // Complete business info
        $this->service->completeBusinessInfo($user, [
            'businessName' => 'Test Business',
            'businessIndustry' => 'technology',
            'businessGoals' => 'Test goals',
            'businessSize' => '1-10',
        ]);
        
        // Select plan
        $this->service->selectPlan($user, 'free');
        
        // Skip tour
        $this->service->skipTour($user);
        
        // Complete wizard (last step)
        $this->service->completeWizardStep($user, 'complete');
        
        // Verify template was auto-selected
        $state = $this->service->getOnboardingState($user);
        $this->assertTrue($state->template_selected);
        $this->assertEquals('default', $state->template_id);
        
        // Verify onboarding is complete
        $this->assertTrue($this->service->isOnboardingComplete($user));
        $this->assertNotNull($state->completed_at);
    }

    public function test_template_is_auto_selected_when_wizard_is_skipped(): void
    {
        $user = User::factory()->create();
        
        // Initialize onboarding
        $this->service->initializeOnboarding($user);
        
        // Complete business info
        $this->service->completeBusinessInfo($user, [
            'businessName' => 'Test Business',
            'businessIndustry' => 'technology',
            'businessGoals' => 'Test goals',
            'businessSize' => '1-10',
        ]);
        
        // Select plan
        $this->service->selectPlan($user, 'free');
        
        // Skip tour
        $this->service->skipTour($user);
        
        // Skip wizard
        $this->service->skipWizard($user);
        
        // Verify template was auto-selected
        $state = $this->service->getOnboardingState($user);
        $this->assertTrue($state->template_selected);
        $this->assertEquals('default', $state->template_id);
        
        // Verify onboarding is complete
        $this->assertTrue($this->service->isOnboardingComplete($user));
        $this->assertNotNull($state->completed_at);
    }

    public function test_onboarding_is_not_complete_without_template_selection(): void
    {
        $user = User::factory()->create();
        
        // Create state with all stages completed except template
        OnboardingState::create([
            'user_id' => $user->id,
            'business_info_completed' => true,
            'plan_selected' => true,
            'tour_skipped' => true,
            'wizard_skipped' => true,
            'template_selected' => false,
            'started_at' => now(),
        ]);
        
        // Verify onboarding is not complete
        $this->assertFalse($this->service->isOnboardingComplete($user));
    }
}
