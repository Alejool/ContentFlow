import { ErrorNotification } from '@/Components/Onboarding/ErrorNotification';
import { OfflineIndicator } from '@/Components/Onboarding/OfflineIndicator';
import { OnboardingErrorBoundary } from '@/Components/Onboarding/OnboardingErrorBoundary';
import { useOnboardingStore } from '@/stores/Onboarding/onboardingStore';
import type { OnboardingState } from '@/types/Onboarding/onboarding';
import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect } from 'react';

/**
 * OnboardingContextValue defines the interface for the onboarding context.
 * It provides access to the current onboarding state and actions to modify it.
 */
export interface OnboardingContextValue {
  state: OnboardingState & { isLoading: boolean; error: string | null };
  completeBusinessInfo: (data: any) => Promise<void>;
  selectPlan: (planId: string) => Promise<void>;
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
export const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

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
    const userId = (page.props as any).auth?.user?.id;
    
    // 1. Prevent state leaking across users on the same browser
    if (userId) {
      const storedUserId = localStorage.getItem('onboarding_last_user_id');
      if (storedUserId && storedUserId !== userId.toString()) {
        console.log('OnboardingContext: User changed. Clearing stale cache.');
        store.clearCache();
        if (onboardingProps) {
          store.setState(onboardingProps);
        }
        localStorage.setItem('onboarding_last_user_id', userId.toString());
        return; // We fully applied the fresh backend state, no need to merge below
      }
      localStorage.setItem('onboarding_last_user_id', userId.toString());
    }

    if (onboardingProps) {
      // 2. CRITICAL: Always trust backend's completedAt status
      // If backend says onboarding is completed, override local cache
      if (onboardingProps.completedAt !== null) {
        console.log('OnboardingContext: Backend shows onboarding completed. Syncing local state.');
        store.setState(onboardingProps);
        return;
      }

      // 3. Normal sync: Only update state if backend is more recent than our local state
      // This prevents overwriting local progress during navigation
      const currentStep = store.tourCurrentStep;
      const propsStep = onboardingProps.tourCurrentStep;
      const currentTourCompleted = store.tourCompleted;
      const propsTourCompleted = onboardingProps.tourCompleted;

      // Update if:
      // - Backend has a higher step (user progressed on another device)
      // - We don't have local state yet (currentStep === 0)
      // - Tour was completed on backend but not locally
      // - Backend step is 0 but local step is > 0 and NOT completed (safety reset)
      if (
        currentStep === 0 ||
        propsStep > currentStep ||
        (propsTourCompleted && !currentTourCompleted) ||
        (propsStep === 0 && !propsTourCompleted && currentStep > 0)
      ) {
        store.setState(onboardingProps);
      }
    }
  }, [onboardingProps, page.props]);

  // Periodic sync with backend (every 5 minutes)
  useEffect(() => {
    const syncInterval = setInterval(
      () => {
        // Only sync if user is online and onboarding is not complete
        if (!store.isOffline && !store.completedAt) {
          store.syncWithBackend();
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [store.isOffline, store.completedAt]);

  // Listen for subscription changes and sync onboarding state
  useEffect(() => {
    const handleSubscriptionChange = () => {
      // Sync with backend when subscription changes
      store.syncWithBackend();
    };

    window.addEventListener('subscription-plan-changed', handleSubscriptionChange);

    return () => {
      window.removeEventListener('subscription-plan-changed', handleSubscriptionChange);
    };
  }, []);

  // Create context value with state and actions
  const contextValue: OnboardingContextValue = {
    state: {
      businessInfoCompleted: store.businessInfoCompleted,
      planSelected: store.planSelected,
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
    completeBusinessInfo: store.completeBusinessInfo,
    selectPlan: store.selectPlan,
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
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
