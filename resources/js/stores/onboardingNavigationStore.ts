import { create } from 'zustand';
import { router } from '@inertiajs/react';

/**
 * Store for managing onboarding navigation state and history
 */

interface NavigationHistoryEntry {
  path: string;
  timestamp: number;
  stepId?: string;
  stepType?: 'tour' | 'wizard' | 'template';
}

interface OnboardingNavigationState {
  // Current navigation state
  currentPath: string;
  isNavigating: boolean;
  navigationHistory: NavigationHistoryEntry[];
  
  // Tour-specific navigation
  tourNavigationEnabled: boolean;
  lastTourStep: string | null;
  
  // Actions
  setCurrentPath: (path: string) => void;
  setNavigating: (isNavigating: boolean) => void;
  addToHistory: (entry: NavigationHistoryEntry) => void;
  clearHistory: () => void;
  
  // Navigation helpers
  navigateToStep: (path: string, stepId?: string, stepType?: 'tour' | 'wizard' | 'template') => void;
  goBack: () => void;
  canGoBack: () => boolean;
  
  // Tour navigation
  enableTourNavigation: () => void;
  disableTourNavigation: () => void;
  setLastTourStep: (stepId: string) => void;
}

export const useOnboardingNavigationStore = create<OnboardingNavigationState>((set, get) => ({
  // Initial state
  currentPath: typeof window !== 'undefined' ? window.location.pathname : '/',
  isNavigating: false,
  navigationHistory: [],
  tourNavigationEnabled: false,
  lastTourStep: null,

  // Actions
  setCurrentPath: (path) => {
    set({ currentPath: path });
  },

  setNavigating: (isNavigating) => {
    set({ isNavigating });
  },

  addToHistory: (entry) => {
    set((state) => ({
      navigationHistory: [...state.navigationHistory, entry],
    }));
  },

  clearHistory: () => {
    set({ navigationHistory: [] });
  },

  // Navigation helpers
  navigateToStep: (path, stepId, stepType) => {
    const state = get();
    
    // Don't navigate if already on the target path
    if (state.currentPath === path) {
      state.setNavigating(false);
      return;
    }
    
    // Add to history
    state.addToHistory({
      path,
      timestamp: Date.now(),
      stepId,
      stepType,
    });

    // Set navigating state
    state.setNavigating(true);

    // Navigate using Inertia with preserveState to keep onboarding state
    router.visit(path, {
      preserveState: true,
      preserveScroll: false,
      replace: false,
      onSuccess: () => {
        state.setCurrentPath(path);
        state.setNavigating(false);
      },
      onError: (errors) => {
        state.setNavigating(false);
      },
    });
  },

  goBack: () => {
    const state = get();
    const history = state.navigationHistory;
    
    if (history.length > 1) {
      // Get previous entry (skip current)
      const previousEntry = history[history.length - 2];
      
      // Navigate back
      router.visit(previousEntry.path, {
        preserveState: true,
        preserveScroll: false,
      });
      
      // Remove last entry from history
      set((state) => ({
        navigationHistory: state.navigationHistory.slice(0, -1),
      }));
    }
  },

  canGoBack: () => {
    return get().navigationHistory.length > 1;
  },

  // Tour navigation
  enableTourNavigation: () => {
    set({ tourNavigationEnabled: true });
  },

  disableTourNavigation: () => {
    set({ tourNavigationEnabled: false });
  },

  setLastTourStep: (stepId) => {
    set({ lastTourStep: stepId });
  },
}));
