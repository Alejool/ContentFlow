/**
 * useOnboardingStage
 *
 * Encapsulates the stage-determination logic and all action handlers
 * for OnboardingFlow. The component stays as pure JSX composition.
 */

import type { BusinessInfoData } from '@/Components/Onboarding/BusinessInfoStep';
import { useOnboarding } from '@/Contexts/Onboarding/OnboardingContext';
import type { TourStep } from '@/types/Onboarding/onboarding';
import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OnboardingStage =
  | 'businessInfo'
  | 'planSelection'
  | 'tour'
  | 'wizard'
  | 'complete';

export interface OnboardingStageActions {
  currentStage: OnboardingStage;
  onBusinessInfoComplete: (data: BusinessInfoData) => Promise<void>;
  onBusinessInfoSkip: () => Promise<void>;
  onPlanSelect: (planId: string) => Promise<void>;
  onPlanSkip: () => Promise<void>;
  onTourNext: () => void;
  onTourComplete: (tourSteps: TourStep[]) => Promise<void>;
  onTourSkip: () => Promise<void>;
  onWizardComplete: () => void;
  completionPercentage: number;
}

// ---------------------------------------------------------------------------
// Empty business info used when skipping
// ---------------------------------------------------------------------------

const EMPTY_BUSINESS_INFO: BusinessInfoData = {
  businessName: '',
  businessIndustry: '',
  businessGoals: '',
  businessSize: '',
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboardingStage(): OnboardingStageActions {
  const {
    state,
    completeBusinessInfo,
    selectPlan,
    completeTourStep,
    skipTour,
    nextTourStep,
  } = useOnboarding();

  // Derive stage from state — pure function, no side-effects
  const deriveStage = useCallback((): OnboardingStage => {
    // If onboarding is already completed, always return 'complete'
    if (state.completedAt !== null) return 'complete';
    
    if (!state.businessInfoCompleted) return 'businessInfo';
    if (!state.planSelected) return 'planSelection';
    if (!state.tourCompleted && !state.tourSkipped) return 'tour';
    if (!state.wizardCompleted && !state.wizardSkipped) return 'wizard';
    return 'complete';
  }, [
    state.completedAt,
    state.businessInfoCompleted,
    state.planSelected,
    state.tourCompleted,
    state.tourSkipped,
    state.wizardCompleted,
    state.wizardSkipped,
  ]);

  const [currentStage, setCurrentStage] = useState<OnboardingStage>(() => deriveStage());

  // Keep stage in sync whenever relevant state changes
  useEffect(() => {
    const next = deriveStage();
    if (next !== currentStage) setCurrentStage(next);
  }, [deriveStage, currentStage]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const onBusinessInfoComplete = async (data: BusinessInfoData) => {
    await completeBusinessInfo(data);
  };

  const onBusinessInfoSkip = async () => {
    await completeBusinessInfo(EMPTY_BUSINESS_INFO);
  };

  const onPlanSelect = async (planId: string) => {
    await selectPlan(planId);
  };

  const onPlanSkip = async () => {
    await selectPlan('free');
  };

  const onTourComplete = async (tourSteps: TourStep[]) => {
    const lastStep = tourSteps[tourSteps.length - 1];
    if (lastStep) await completeTourStep(lastStep.id);
  };

  const onTourSkip = async () => {
    await skipTour();
  };

  // Wizard completion: state change via context triggers the useEffect above.
  // We force a synchronous re-check in case the state update is batched.
  const onWizardComplete = () => {
    const next = deriveStage();
    if (next !== currentStage) setCurrentStage(next);
  };

  return {
    currentStage,
    completionPercentage: state.completionPercentage,
    onBusinessInfoComplete,
    onBusinessInfoSkip,
    onPlanSelect,
    onPlanSkip,
    onTourNext: nextTourStep,
    onTourComplete,
    onTourSkip,
    onWizardComplete,
  };
}
