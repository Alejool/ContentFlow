<?php

namespace App\Services;

use App\Interfaces\OnboardingServiceInterface;
use App\Models\User;
use App\Models\OnboardingState;
use App\Repositories\OnboardingStateRepository;
use Illuminate\Support\Facades\Log;

class OnboardingService implements OnboardingServiceInterface
{
    protected OnboardingStateRepository $repository;
    protected OnboardingAnalyticsService $analyticsService;

    public function __construct(
        OnboardingStateRepository $repository,
        OnboardingAnalyticsService $analyticsService
    ) {
        $this->repository = $repository;
        $this->analyticsService = $analyticsService;
    }

    /**
     * Initialize onboarding for a new user
     * 
     * @param User $user
     * @return OnboardingState
     */
    public function initializeOnboarding(User $user): OnboardingState
    {
        // Check if onboarding already exists
        $existingState = $this->repository->find($user->id);
        
        if ($existingState) {
            return $existingState;
        }

        // Create new onboarding state with default values
        $data = [
            'tour_completed' => false,
            'tour_skipped' => false,
            'tour_current_step' => 0,
            'tour_completed_steps' => [],
            'wizard_completed' => false,
            'wizard_skipped' => false,
            'wizard_current_step' => 0,
            'template_selected' => false,
            'template_id' => null,
            'dismissed_tooltips' => [],
            'completed_at' => null,
            'started_at' => now(),
        ];

        Log::info("Initializing onboarding for user {$user->id}");

        return $this->repository->create($user->id, $data);
    }

    /**
     * Get the current onboarding state for a user
     * 
     * @param User $user
     * @return OnboardingState
     */
    public function getOnboardingState(User $user): OnboardingState
    {
        $state = $this->repository->find($user->id);

        // If no state exists, initialize it
        if (!$state) {
            return $this->initializeOnboarding($user);
        }

        return $state;
    }

    /**
     * Mark a tour step as completed
     * 
     * @param User $user
     * @param string $stepId
     * @return void
     */
    public function completeTourStep(User $user, string $stepId): void
    {
        $state = $this->getOnboardingState($user);

        // Get current completed steps
        $completedSteps = $state->tour_completed_steps ?? [];

        // Add step if not already completed
        if (!in_array($stepId, $completedSteps)) {
            $completedSteps[] = $stepId;
        }

        // Calculate duration if this is a new step
        $duration = null;
        if (!in_array($stepId, $state->tour_completed_steps ?? [])) {
            $duration = $this->analyticsService->calculateDuration($state->started_at);
        }

        // Parse step number from stepId (e.g., "step-1" -> 1)
        $stepNumber = $this->parseStepNumber($stepId);
        
        $totalSteps = $this->getTotalTourSteps();
        $completedCount = count($completedSteps);
        
        // Check if this is the last step (regardless of how many steps were completed)
        $isLastStep = $stepNumber >= $totalSteps;

        Log::info("Tour step completion check", [
            'user_id' => $user->id,
            'step_id' => $stepId,
            'step_number' => $stepNumber,
            'completed_steps' => $completedSteps,
            'completed_count' => $completedCount,
            'total_steps' => $totalSteps,
            'is_last_step' => $isLastStep,
            'should_complete' => $completedCount >= $totalSteps || $isLastStep,
        ]);

        // Update state
        $updateData = [
            'tour_completed_steps' => $completedSteps,
            'tour_current_step' => $stepNumber, // Update current step
        ];

        // Check if this was the last step OR if all steps are completed
        if ($completedCount >= $totalSteps || $isLastStep) {
            $updateData['tour_completed'] = true;
            Log::info("Marking tour as completed for user {$user->id}");
            $this->checkAndMarkOnboardingComplete($user, $state);
        }

        $this->repository->update($user->id, $updateData);

        // Record analytics asynchronously
        dispatch(function () use ($user, $stepId, $duration) {
            $this->analyticsService->recordStepCompletion($user, $stepId, 'tour', $duration);
        })->afterResponse();

        Log::info("Tour step {$stepId} completed for user {$user->id}");
    }

    /**
     * Update current tour step (for navigation tracking)
     * 
     * @param User $user
     * @param int $step
     * @return void
     */
    public function updateTourStep(User $user, int $step): void
    {
        $this->repository->update($user->id, [
            'tour_current_step' => $step,
        ]);

        Log::info("Tour step updated to {$step} for user {$user->id}");
    }

    /**
     * Dismiss a tooltip for a user
     * 
     * @param User $user
     * @param string $tooltipId
     * @return void
     */
    public function dismissTooltip(User $user, string $tooltipId): void
    {
        $state = $this->getOnboardingState($user);

        // Get current dismissed tooltips
        $dismissedTooltips = $state->dismissed_tooltips ?? [];

        // Add tooltip if not already dismissed
        if (!in_array($tooltipId, $dismissedTooltips)) {
            $dismissedTooltips[] = $tooltipId;
        }

        // Update state
        $this->repository->update($user->id, [
            'dismissed_tooltips' => $dismissedTooltips,
        ]);

        // Record analytics asynchronously
        dispatch(function () use ($user, $tooltipId) {
            $this->analyticsService->recordTooltipDismissal($user, $tooltipId);
        })->afterResponse();

        Log::info("Tooltip {$tooltipId} dismissed for user {$user->id}");
    }

    /**
     * Complete a wizard step
     * 
     * @param User $user
     * @param string $stepId
     * @param array $data Additional data for the step
     * @return void
     */
    public function completeWizardStep(User $user, string $stepId, array $data = []): void
    {
        $state = $this->getOnboardingState($user);

        // Handle special case for "complete" stepId
        if ($stepId === 'complete') {
            $stepNumber = $this->getTotalWizardSteps();
        } else {
            // Parse step number from stepId (e.g., "step-1" -> 1)
            $stepNumber = $this->parseStepNumber($stepId);
        }

        // Calculate duration
        $duration = $this->analyticsService->calculateDuration($state->started_at);

        $updateData = [
            'wizard_current_step' => $stepNumber,
        ];

        // Check if this was the last wizard step
        if ($stepNumber >= $this->getTotalWizardSteps()) {
            $updateData['wizard_completed'] = true;
            $this->checkAndMarkOnboardingComplete($user, $state);
        }

        $this->repository->update($user->id, $updateData);

        // Record analytics asynchronously
        dispatch(function () use ($user, $stepId, $duration) {
            $this->analyticsService->recordStepCompletion($user, $stepId, 'wizard', $duration);
        })->afterResponse();

        Log::info("Wizard step {$stepId} completed for user {$user->id}", $data);
    }

    /**
     * Record template selection
     * 
     * @param User $user
     * @param string $templateId
     * @return void
     */
    public function recordTemplateSelection(User $user, string $templateId): void
    {
        $state = $this->getOnboardingState($user);

        $updateData = [
            'template_selected' => true,
            'template_id' => $templateId,
        ];

        $this->repository->update($user->id, $updateData);

        // Check if onboarding is now complete
        $this->checkAndMarkOnboardingComplete($user, $state);

        // Record analytics asynchronously
        dispatch(function () use ($user, $templateId) {
            $this->analyticsService->recordTemplateSelection($user, $templateId);
        })->afterResponse();

        Log::info("Template {$templateId} selected for user {$user->id}");
    }

    /**
     * Restart onboarding for a user
     * 
     * @param User $user
     * @return OnboardingState
     */
    public function restartOnboarding(User $user): OnboardingState
    {
        // Delete existing state
        $this->repository->delete($user->id);

        // Create new state
        $newState = $this->initializeOnboarding($user);

        Log::info("Onboarding restarted for user {$user->id}");

        return $newState;
    }

    /**
     * Check if onboarding is complete for a user
     * 
     * @param User $user
     * @return bool
     */
    public function isOnboardingComplete(User $user): bool
    {
        $state = $this->repository->find($user->id);

        if (!$state) {
            return false;
        }

        // Onboarding is complete if all three stages are done (completed or skipped)
        $tourDone = $state->tour_completed || $state->tour_skipped;
        $wizardDone = $state->wizard_completed || $state->wizard_skipped;
        $templateDone = $state->template_selected;

        return $tourDone && $wizardDone && $templateDone;
    }

    /**
     * Skip the tour
     * 
     * @param User $user
     * @return void
     */
    public function skipTour(User $user): void
    {
        $state = $this->getOnboardingState($user);

        $this->repository->update($user->id, [
            'tour_skipped' => true,
        ]);

        // Record analytics asynchronously
        dispatch(function () use ($user, $state) {
            $currentStep = 'tour-step-' . $state->tour_current_step;
            $this->analyticsService->recordSkipEvent($user, $currentStep, 'tour');
        })->afterResponse();

        $this->checkAndMarkOnboardingComplete($user, $state);

        Log::info("Tour skipped for user {$user->id}");
    }

    /**
     * Skip the wizard
     * 
     * @param User $user
     * @return void
     */
    public function skipWizard(User $user): void
    {
        $state = $this->getOnboardingState($user);

        $this->repository->update($user->id, [
            'wizard_skipped' => true,
        ]);

        // Record analytics asynchronously
        dispatch(function () use ($user, $state) {
            $currentStep = 'wizard-step-' . $state->wizard_current_step;
            $this->analyticsService->recordSkipEvent($user, $currentStep, 'wizard');
        })->afterResponse();

        $this->checkAndMarkOnboardingComplete($user, $state);

        Log::info("Wizard skipped for user {$user->id}");
    }

    /**
     * Check if onboarding should be marked as complete and update if so
     * 
     * @param User $user
     * @param OnboardingState $state
     * @return void
     */
    protected function checkAndMarkOnboardingComplete(User $user, OnboardingState $state): void
    {
        // Refresh state to get latest data
        $state = $state->fresh();

        if ($this->isOnboardingComplete($user) && !$state->completed_at) {
            $this->repository->update($user->id, [
                'completed_at' => now(),
            ]);

            Log::info("Onboarding completed for user {$user->id}");
        }
    }

    /**
     * Get total number of tour steps
     * This could be configurable or fetched from a configuration
     * 
     * @return int
     */
    protected function getTotalTourSteps(): int
    {
        // Default to 5 steps - this should be configurable
        return config('onboarding.tour_steps', 5);
    }

    /**
     * Get total number of wizard steps
     * 
     * @return int
     */
    protected function getTotalWizardSteps(): int
    {
        // Default to 3 steps - this should be configurable
        return config('onboarding.wizard_steps', 3);
    }

    /**
     * Parse step number from step ID
     * 
     * @param string $stepId
     * @return int
     */
    protected function parseStepNumber(string $stepId): int
    {
        // Extract number from stepId like "step-1", "wizard-step-2", etc.
        preg_match('/(\d+)/', $stepId, $matches);
        return isset($matches[1]) ? (int) $matches[1] : 0;
    }
}
