import { useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { useOnboardingNavigationStore } from '@/stores/onboardingNavigationStore';

/**
 * Hook for managing onboarding navigation
 * 
 * Provides utilities for:
 * - Tracking navigation history during onboarding
 * - Navigating between tour steps
 * - Going back to previous steps
 * - Managing navigation state
 */
export function useOnboardingNavigation() {
  const {
    currentPath,
    isNavigating,
    navigationHistory,
    tourNavigationEnabled,
    lastTourStep,
    setCurrentPath,
    navigateToStep,
    goBack,
    canGoBack,
    enableTourNavigation,
    disableTourNavigation,
    setLastTourStep,
    clearHistory,
  } = useOnboardingNavigationStore();

  // Sync current path with browser location
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen to Inertia navigation events
    const removeListener = router.on('navigate', handleLocationChange);

    return () => {
      removeListener();
    };
  }, [setCurrentPath]);

  /**
   * Navigate to a specific step in the onboarding flow
   */
  const navigateToOnboardingStep = useCallback(
    (path: string, stepId?: string, stepType?: 'tour' | 'wizard' | 'template') => {
      console.log('Navigating to onboarding step:', { path, stepId, stepType });
      navigateToStep(path, stepId, stepType);
    },
    [navigateToStep]
  );

  /**
   * Navigate to tour step (with tour-specific logic)
   */
  const navigateToTourStep = useCallback(
    (path: string, stepId: string) => {
      if (!tourNavigationEnabled) {
        console.warn('Tour navigation is disabled');
        return;
      }

      setLastTourStep(stepId);
      navigateToStep(path, stepId, 'tour');
    },
    [tourNavigationEnabled, setLastTourStep, navigateToStep]
  );

  /**
   * Check if we're currently on a specific path
   */
  const isOnPath = useCallback(
    (path: string) => {
      return currentPath === path;
    },
    [currentPath]
  );

  /**
   * Get the last visited path
   */
  const getLastPath = useCallback(() => {
    if (navigationHistory.length > 1) {
      return navigationHistory[navigationHistory.length - 2].path;
    }
    return null;
  }, [navigationHistory]);

  /**
   * Reset navigation history (useful when completing onboarding)
   */
  const resetNavigation = useCallback(() => {
    clearHistory();
    disableTourNavigation();
    setLastTourStep('');
  }, [clearHistory, disableTourNavigation, setLastTourStep]);

  return {
    // State
    currentPath,
    isNavigating,
    navigationHistory,
    tourNavigationEnabled,
    lastTourStep,

    // Navigation actions
    navigateToOnboardingStep,
    navigateToTourStep,
    goBack,
    canGoBack: canGoBack(),

    // Tour controls
    enableTourNavigation,
    disableTourNavigation,

    // Utilities
    isOnPath,
    getLastPath,
    resetNavigation,
  };
}
