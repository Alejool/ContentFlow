import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "@/Contexts/OnboardingContext";
import { OnboardingErrorBoundary } from "./OnboardingErrorBoundary";
import { Building2, Gem, Target, Link2, Check } from "lucide-react";
import type {
  TourStep,
  SocialPlatform,
  PublicationTemplate,
} from "@/types/onboarding";

// Lazy load onboarding components to reduce initial bundle size
const BusinessInfoStep = lazy(() => import("./BusinessInfoStep"));
const PlanSelectionStep = lazy(() => import("./PlanSelectionStep"));
const TourOverlay = lazy(() => import("./TourOverlay"));
const SetupWizard = lazy(() => import("./SetupWizard"));

interface OnboardingFlowProps {
  tourSteps: TourStep[];
  availablePlatforms: SocialPlatform[];
  connectedAccounts?: Array<{ platform: string; account_name: string }>;
  templates: PublicationTemplate[];
}

type OnboardingStage =
  | "businessInfo"
  | "planSelection"
  | "tour"
  | "wizard"
  | "templates"
  | "complete";

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
  const {
    state,
    completeBusinessInfo,
    selectPlan,
    completeTourStep,
    skipTour,
    nextTourStep,
  } = useOnboarding();

  // Determine initial stage based on current state to avoid flash
  const determineCurrentStage = useCallback((): OnboardingStage => {
    // If business info not completed, show business info
    if (!state.businessInfoCompleted) {
      return "businessInfo";
    }

    // If plan not selected, show plan selection
    if (!state.planSelected) {
      return "planSelection";
    }

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
  }, [
    state.businessInfoCompleted,
    state.planSelected,
    state.tourCompleted,
    state.tourSkipped,
    state.wizardCompleted,
    state.wizardSkipped,
  ]);

  const [currentStage, setCurrentStage] = useState<OnboardingStage>(() =>
    determineCurrentStage(),
  );

  // Debug logging
  useEffect(() => {}, []);

  // Determine current onboarding stage based on state
  useEffect(() => {
    const stage = determineCurrentStage();
    // Only update if stage actually changed
    if (stage !== currentStage) {
      setCurrentStage(stage);
    }
  }, [
    state.businessInfoCompleted,
    state.planSelected,
    state.tourCompleted,
    state.tourSkipped,
    state.wizardCompleted,
    state.wizardSkipped,
    state.templateSelected,
    currentStage,
    determineCurrentStage,
  ]);

  /**
   * Handles business info completion
   */
  const handleBusinessInfoComplete = async (data: any) => {
    await completeBusinessInfo(data);
  };

  /**
   * Handles business info skip
   */
  const handleBusinessInfoSkip = async () => {
    await completeBusinessInfo({
      businessName: "",
      businessIndustry: "",
      businessGoals: "",
      businessSize: "",
    });
  };

  /**
   * Handles plan selection
   */
  const handlePlanSelect = async (planId: string) => {
    await selectPlan(planId);
  };

  /**
   * Handles plan selection skip
   */
  const handlePlanSkip = async () => {
    await selectPlan("free");
  };

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

      {/* Business Info Stage */}
      {currentStage === "businessInfo" && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<OnboardingLoadingFallback />}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
                <BusinessInfoStep
                  onComplete={handleBusinessInfoComplete}
                  onSkip={handleBusinessInfoSkip}
                />
              </div>
            </div>
          </Suspense>
        </OnboardingErrorBoundary>
      )}

      {/* Plan Selection Stage */}
      {currentStage === "planSelection" && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<OnboardingLoadingFallback />}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto p-8">
                <PlanSelectionStep
                  onComplete={handlePlanSelect}
                  onSkip={handlePlanSkip}
                />
              </div>
            </div>
          </Suspense>
        </OnboardingErrorBoundary>
      )}

      {/* Tour Stage */}
      {currentStage === "tour" && tourSteps.length > 0 && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<OnboardingLoadingFallback />}>
            <TourOverlay
              currentStep={
                tourSteps[
                  Math.min(state.tourCurrentStep, tourSteps.length - 1)
                ] || tourSteps[0]
              }
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
    {
      id: "businessInfo",
      label: t("onboarding.progress.stages.businessInfo"),
      Icon: Building2,
    },
    {
      id: "planSelection",
      label: t("onboarding.progress.stages.plan"),
      Icon: Gem,
    },
    { id: "tour", label: t("onboarding.progress.stages.tour"), Icon: Target },
    {
      id: "wizard",
      label: t("onboarding.progress.stages.connect"),
      Icon: Link2,
    },
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="fixed top-6 right-6 z-[99] bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 p-6 w-80">
      {/* Header */}
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
