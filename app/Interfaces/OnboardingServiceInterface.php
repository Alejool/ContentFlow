<?php

namespace App\Interfaces;

use App\Models\User;
use App\Models\OnboardingState;

interface OnboardingServiceInterface
{
    public function initializeOnboarding(User $user): OnboardingState;
    
    public function getOnboardingState(User $user): OnboardingState;
    
    public function completeTourStep(User $user, string $stepId): void;
    
    public function dismissTooltip(User $user, string $tooltipId): void;
    
    public function completeWizardStep(User $user, string $stepId, array $data = []): void;
    
    public function recordTemplateSelection(User $user, string $templateId): void;
    
    public function restartOnboarding(User $user): OnboardingState;
    
    public function isOnboardingComplete(User $user): bool;
    
    public function skipTour(User $user): void;
    
    public function skipWizard(User $user): void;
}
