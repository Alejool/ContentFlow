import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "@/Contexts/OnboardingContext";
import { OnboardingErrorBoundary } from "./OnboardingErrorBoundary";
import type { TourStep, SocialPlatform, PublicationTemplate } from "@/types/onboarding";

// Lazy load onboarding components to reduce initial bundle size
const TourOverlay = lazy(() => import("./TourOverlay"));
const SetupWizard = lazy(() => import("./SetupWizard"));
// TemplateGallery removed

interface OnboardingFlowProps {
  tourSteps: TourStep[];
  availablePlatforms: SocialPlatform[];
  connectedAccounts?: Array<{ platform: string; account_name: string }>;
  templates: PublicationTemplate[];
}

type OnboardingStage = "tour" | "wizard" | "templates" | "complete";

/**
 * OnboardingFlow orchestrates the complete onboarding experience.
 * 
 * It determines the current onboarding stage based on state and renders
 * the appropriate component (Tour, Wizard, or Templates).
 * 
 * Features:
 * - Determines current onboarding stage
 * - Renders appropriate component (Tour, Wizard, Templates)
 * - Handles stage transitions
 * - Shows progress indicator
 * 
 * Requirements: 5.3, 5.4
 */
export default function OnboardingFlow({
  tourSteps,
  availablePlatforms,
  connectedAccounts = [],
  templates,
}: OnboardingFlowProps) {
  const { state, completeTourStep, skipTour, nextTourStep } = useOnboarding();
  
  // Determine initial stage based on current state to avoid flash
  const determineCurrentStage = useCallback((): OnboardingStage => {
    // If tour not completed or skipped, show tour
    if (!state.tourCompleted && !state.tourSkipped) {
      return "tour";
    }

    // If wizard not completed or skipped, show wizard
    if (!state.wizardCompleted && !state.wizardSkipped) {
      return "wizard";
    }

    // All stages complete
    return "complete";
  }, [state.tourCompleted, state.tourSkipped, state.wizardCompleted, state.wizardSkipped]);
  
  const [currentStage, setCurrentStage] = useState<OnboardingStage>(() => determineCurrentStage());

  // Debug logging
  useEffect(() => {
    }, []);

  // Determine current onboarding stage based on state
  useEffect(() => {
    const stage = determineCurrentStage();
    // Only update if stage actually changed
    if (stage !== currentStage) {
      setCurrentStage(stage);
    }
  }, [
    state.tourCompleted,
    state.tourSkipped,
    state.wizardCompleted,
    state.wizardSkipped,
    state.templateSelected,
    currentStage,
    determineCurrentStage,
  ]);

  /**
   * Handles tour completion
   */
  const handleTourComplete = async () => {
    const lastStep = tourSteps[tourSteps.length - 1];
    if (lastStep) {
      await completeTourStep(lastStep.id);
      }
    // Stage will automatically transition via useEffect
  };

  /**
   * Handles tour skip
   */
  const handleTourSkip = async () => {
    await skipTour();
    // Stage will automatically transition via useEffect
  };

  /**
   * Handles wizard completion
   */
  const handleWizardComplete = () => {
    // Wizard component handles its own completion
    // The state change will trigger the useEffect to transition stages
    // Force a re-check of the stage after a short delay to ensure state has updated
    setTimeout(() => {
      const newStage = determineCurrentStage();
      if (newStage !== currentStage) {
        setCurrentStage(newStage);
      }
    }, 100);
  };

  /**
   * Handles template selection or skip
   */
  const handleTemplateSkip = () => {
    // Template component handles its own skip
    // Stage will automatically transition via useEffect
  };

  // Don't render anything if onboarding is complete
  if (currentStage === "complete") {
    return null;
  }

  return (
    <OnboardingErrorBoundary>
      {/* Progress Indicator */}
      <OnboardingProgressIndicator
        currentStage={currentStage}
        completionPercentage={state.completionPercentage}
      />

      {/* Tour Stage */}
      {currentStage === "tour" && tourSteps.length > 0 && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<OnboardingLoadingFallback />}>
            <TourOverlay
              currentStep={tourSteps[Math.min(state.tourCurrentStep, tourSteps.length - 1)] || tourSteps[0]}
              totalSteps={tourSteps.length}
              onNext={nextTourStep}
              onSkip={handleTourSkip}
              onComplete={handleTourComplete}
            />
          </Suspense>
        </OnboardingErrorBoundary>
      )}

      {/* Wizard Stage */}
      {currentStage === "wizard" && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<OnboardingLoadingFallback />}>
            <SetupWizard
              availablePlatforms={availablePlatforms}
              connectedAccounts={connectedAccounts}
              onComplete={handleWizardComplete}
            />
          </Suspense>
        </OnboardingErrorBoundary>
      )}

      {/* Templates Stage - REMOVED */}
    </OnboardingErrorBoundary>
  );
}

/**
 * OnboardingProgressIndicator shows the overall onboarding progress.
 */
function OnboardingProgressIndicator({
  currentStage,
  completionPercentage,
}: {
  currentStage: OnboardingStage;
  completionPercentage: number;
}) {
  const { t } = useTranslation();
  
  // Don't show progress indicator during tour (tour has its own progress)
  if (currentStage === "tour" || currentStage === "complete") {
    return null;
  }

  const stages = [
    { id: "tour", label: t('progress.stages.tour'), icon: "🎯" },
    { id: "wizard", label: t('progress.stages.connect'), icon: "🔗" },
    // Templates stage removed
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="fixed top-4 right-4 z-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('progress.title')}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {completionPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2 mb-3">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Stage Indicators */}
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                index < currentStageIndex
                  ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                  : index === currentStageIndex
                  ? "bg-primary-100 dark:bg-primary-900/20 text-primary-600"
                  : "bg-gray-100 dark:bg-neutral-700 text-gray-400"
              }`}
            >
              {index < currentStageIndex ? "✓" : stage.icon}
            </div>
            <span
              className={`text-xs ${
                index <= currentStageIndex
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-400"
              }`}
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * OnboardingLoadingFallback displays a loading state while lazy-loaded components are being fetched.
 */
function OnboardingLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
          Loading...
        </p>
      </div>
    </div>
  );
}
