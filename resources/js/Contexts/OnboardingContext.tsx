import { createContext, ReactNode, useContext, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import type { OnboardingState } from "@/types/onboarding";
import { OfflineIndicator } from "@/Components/Onboarding/OfflineIndicator";
import { OnboardingErrorBoundary } from "@/Components/Onboarding/OnboardingErrorBoundary";
import { ErrorNotification } from "@/Components/Onboarding/ErrorNotification";

/**
 * OnboardingContextValue defines the interface for the onboarding context.
 * It provides access to the current onboarding state and actions to modify it.
 */
export interface OnboardingContextValue {
  state: OnboardingState & { isLoading: boolean; error: string | null };
  startTour: () => Promise<void>;
  nextTourStep: () => void;
  skipTour: () => Promise<void>;
  completeTourStep: (stepId: string) => Promise<void>;
  showTooltip: (tooltipId: string) => void;
  dismissTooltip: (tooltipId: string) => Promise<void>;
  startWizard: () => void;
  completeWizardStep: (stepId: string, data?: any) => Promise<void>;
  skipWizard: () => Promise<void>;
  selectTemplate: (templateId: string) => Promise<void>;
  restartOnboarding: () => Promise<void>;
}

/**
 * OnboardingContext provides onboarding state and actions to child components.
 */
export const OnboardingContext = createContext<
  OnboardingContextValue | undefined
>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * OnboardingProvider manages global onboarding state and provides
 * onboarding functionality to child components.
 * 
 * It initializes state from Inertia page props and synchronizes
 * state changes with the backend via the Zustand store.
 * 
 * Features periodic sync with backend to keep state fresh.
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const page = usePage();
  const onboardingProps = page.props.onboarding as OnboardingState | undefined;

  // Get store state and actions
  const store = useOnboardingStore();

  // Initialize state from Inertia props on mount
  useEffect(() => {
    if (onboardingProps) {
      // Only update state if it's more recent than our local state
      // This prevents overwriting local progress during navigation
      const currentStep = store.tourCurrentStep;
      const propsStep = onboardingProps.tourCurrentStep;
      const currentTourCompleted = store.tourCompleted;
      const propsTourCompleted = onboardingProps.tourCompleted;

      // Update if:
      // 1. Backend has a higher step (user progressed on another device)
      // 2. We don't have local state yet (currentStep === 0)
      // 3. Tour was completed on backend but not locally
      if (currentStep === 0 || propsStep > currentStep || (propsTourCompleted && !currentTourCompleted)) {
        console.log('OnboardingContext: Updating state from props');
        store.setState(onboardingProps);
      } else {
        console.log('OnboardingContext: Keeping local state (more recent)');
      }
    }
  }, [onboardingProps]);

  // Periodic sync with backend (every 5 minutes)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // Only sync if user is online and onboarding is not complete
      if (!store.isOffline && !store.completedAt) {
        store.syncWithBackend();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [store.isOffline, store.completedAt]);

  // Create context value with state and actions
  const contextValue: OnboardingContextValue = {
    state: {
      tourCompleted: store.tourCompleted,
      tourSkipped: store.tourSkipped,
      tourCurrentStep: store.tourCurrentStep,
      tourCompletedSteps: store.tourCompletedSteps,
      wizardCompleted: store.wizardCompleted,
      wizardSkipped: store.wizardSkipped,
      wizardCurrentStep: store.wizardCurrentStep,
      templateSelected: store.templateSelected,
      templateId: store.templateId,
      dismissedTooltips: store.dismissedTooltips,
      completedAt: store.completedAt,
      startedAt: store.startedAt,
      completionPercentage: store.completionPercentage,
      isLoading: store.isLoading,
      error: store.error,
    },
    startTour: store.startTour,
    nextTourStep: store.nextTourStep,
    skipTour: store.skipTour,
    completeTourStep: store.completeTourStep,
    showTooltip: store.showTooltip,
    dismissTooltip: store.dismissTooltip,
    startWizard: store.startWizard,
    completeWizardStep: store.completeWizardStep,
    skipWizard: store.skipWizard,
    selectTemplate: store.selectTemplate,
    restartOnboarding: store.restartOnboarding,
  };

  return (
    <OnboardingErrorBoundary>
      <OnboardingContext.Provider value={contextValue}>
        {children}
        <OfflineIndicator />
        <ErrorNotification />
      </OnboardingContext.Provider>
    </OnboardingErrorBoundary>
  );
}

/**
 * useOnboarding hook provides access to the onboarding context.
 * Must be used within an OnboardingProvider.
 */
export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      "useOnboarding must be used within an OnboardingProvider"
    );
  }
  return context;
}
