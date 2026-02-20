import { router } from "@inertiajs/react";
import { create } from "zustand";
import axios from "axios";
import type { OnboardingState } from "@/types/onboarding";
import { offlineQueue, type QueuedAction } from "@/Utils/offlineQueue";
import {
  retryWithBackoff,
  createNetworkError,
  getErrorMessage,
  isOnline,
  type RetryOptions,
} from "@/Utils/networkErrorHandler";

// LocalStorage cache key
const CACHE_KEY = "onboarding_state_cache";
const CACHE_TIMESTAMP_KEY = "onboarding_state_cache_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load cached onboarding state from localStorage
 */
function loadCachedState(): Partial<OnboardingState> | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) {
      return null;
    }
    
    const age = Date.now() - parseInt(timestamp, 10);
    
    // Return cached state if it's still fresh
    if (age < CACHE_DURATION) {
      const state = JSON.parse(cached);
      
      // Validate tour step - tour has 6 steps (0-5), anything beyond is corrupted
      const MAX_TOUR_STEPS = 6;
      if (state.tourCurrentStep && (state.tourCurrentStep >= MAX_TOUR_STEPS || state.tourCurrentStep < 0)) {
        console.error('Cached tour step is invalid:', state.tourCurrentStep, 'Valid range: 0-5. Clearing cache...');
        clearCachedState();
        return null;
      }
      
      return state;
    }
    
    // Clear stale cache
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    return null;
  } catch (error) {
    console.error("Failed to load cached onboarding state:", error);
    return null;
  }
}

/**
 * Save onboarding state to localStorage cache
 */
function saveCachedState(state: Partial<OnboardingState>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Failed to save onboarding state to cache:", error);
  }
}

/**
 * Clear cached onboarding state
 */
function clearCachedState(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Failed to clear cached onboarding state:", error);
  }
}

interface OnboardingStoreState extends OnboardingState {
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  queuedActionsCount: number;
  lastSyncTimestamp: number | null;

  // Tour actions
  startTour: () => Promise<void>;
  nextTourStep: () => void;
  skipTour: () => Promise<void>;
  completeTourStep: (stepId: string) => Promise<void>;

  // Tooltip actions
  showTooltip: (tooltipId: string) => void;
  dismissTooltip: (tooltipId: string) => Promise<void>;

  // Wizard actions
  startWizard: () => void;
  completeWizardStep: (stepId: string, data?: any) => Promise<void>;
  skipWizard: () => Promise<void>;

  // Template actions
  selectTemplate: (templateId: string) => Promise<void>;

  // General actions
  restartOnboarding: () => Promise<void>;
  setState: (state: Partial<OnboardingState>) => void;
  
  // Offline support
  setOfflineStatus: (isOffline: boolean) => void;
  syncOfflineQueue: () => Promise<void>;
  
  // Cache management
  syncWithBackend: () => Promise<void>;
  clearCache: () => void;
  
  // Internal helper for optimistic updates
  _rollback: (previousState: Partial<OnboardingState>) => void;
  _executeAction: (type: string, payload: any) => Promise<void>;
  _updateCache: () => void;
}

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => {
  // Try to load cached state on initialization
  const cachedState = loadCachedState();
  
  // Validate and sanitize cached state
  const MAX_TOUR_STEPS = 6;
  let sanitizedCachedState = cachedState;
  
  if (cachedState && cachedState.tourCurrentStep !== undefined) {
    // If tour step is invalid, reset it
    if (cachedState.tourCurrentStep >= MAX_TOUR_STEPS || cachedState.tourCurrentStep < 0) {
      console.error('Detected corrupted tour step on initialization:', cachedState.tourCurrentStep, 'Resetting to 0');
      sanitizedCachedState = {
        ...cachedState,
        tourCurrentStep: 0,
        tourCompleted: false,
        tourSkipped: false,
        tourCompletedSteps: [],
      };
      // Clear the corrupted cache
      clearCachedState();
      // Save the sanitized state
      saveCachedState(sanitizedCachedState);
    }
  }
  
  return {
  // Initial state - use cached state if available
  tourCompleted: sanitizedCachedState?.tourCompleted ?? false,
  tourSkipped: sanitizedCachedState?.tourSkipped ?? false,
  tourCurrentStep: sanitizedCachedState?.tourCurrentStep ?? 0,
  tourCompletedSteps: sanitizedCachedState?.tourCompletedSteps ?? [],
  wizardCompleted: sanitizedCachedState?.wizardCompleted ?? false,
  wizardSkipped: sanitizedCachedState?.wizardSkipped ?? false,
  wizardCurrentStep: sanitizedCachedState?.wizardCurrentStep ?? 0,
  templateSelected: sanitizedCachedState?.templateSelected ?? false,
  templateId: sanitizedCachedState?.templateId ?? null,
  dismissedTooltips: sanitizedCachedState?.dismissedTooltips ?? [],
  completedAt: sanitizedCachedState?.completedAt ?? null,
  startedAt: sanitizedCachedState?.startedAt ?? new Date().toISOString(),
  completionPercentage: sanitizedCachedState?.completionPercentage ?? 0,
  isLoading: false,
  error: null,
  isOffline: false,
  queuedActionsCount: offlineQueue.size(),
  lastSyncTimestamp: null,

  // Tour actions
  startTour: async () => {
    set({ isLoading: true, error: null });
    try {
      router.post(
        "/api/v1/onboarding/start",
        {},
        {
          preserveScroll: true,
          onSuccess: () => {
            set({ tourCurrentStep: 0, isLoading: false });
          },
          onError: (errors) => {
            set({
              error: "Failed to start tour",
              isLoading: false,
            });
            console.error("Failed to start tour", errors);
          },
        },
      );
    } catch (error: any) {
      set({
        error: error.message || "Failed to start tour",
        isLoading: false,
      });
      console.error("Failed to start tour", error);
    }
  },

  nextTourStep: () => {
    const currentStep = get().tourCurrentStep;
    const newStep = currentStep + 1;
    // Validate step number - should not exceed reasonable bounds
    // Tour has 6 steps (indices 0-5), so max valid step is 5
    const MAX_TOUR_STEPS = 6;
    
    // Allow moving to the last step, but not beyond it
    if (currentStep >= MAX_TOUR_STEPS) {
      console.warn(`Already past last tour step. Current step: ${currentStep}, Max steps: ${MAX_TOUR_STEPS}. Should call completeTour instead.`);
      // Don't increment beyond the max
      return;
    }
    
    if (currentStep > 20 || newStep > 20) {
      console.error('Tour step is corrupted! Resetting via backend. Current:', currentStep, 'New:', newStep);
      
      // Clear local cache first
      clearCachedState();
      
      // Call backend to restart onboarding
      axios.post('/api/v1/onboarding/restart')
        .then((response) => {
          // Update local state with clean state from backend
          if (response.data.state) {
            set({
              tourCurrentStep: response.data.state.tourCurrentStep || 0,
              tourCompleted: response.data.state.tourCompleted || false,
              tourSkipped: response.data.state.tourSkipped || false,
              tourCompletedSteps: response.data.state.tourCompletedSteps || [],
              wizardCurrentStep: response.data.state.wizardCurrentStep || 0,
              wizardCompleted: response.data.state.wizardCompleted || false,
              wizardSkipped: response.data.state.wizardSkipped || false,
            });
            get()._updateCache();
          }
          // Reload page to ensure clean state
          setTimeout(() => {
            window.location.reload();
          }, 500);
        })
        .catch((error) => {
          // Fallback: just reload the page
          window.location.reload();
        });
      
      return;
    }
    
    // If we're at the last step (step 5), allow moving to it but log that it's the final step
    
    set({
      tourCurrentStep: newStep,
    });
    
    // Update cache immediately to persist across navigation
    get()._updateCache();
    
    // Optionally sync with backend asynchronously (non-blocking)
    // This ensures the step is saved even if navigation happens
    if (!get().isOffline) {
      // Use axios which is already configured with CSRF token
      axios.post('/api/v1/onboarding/tour/step', { step: newStep })
        .catch(() => {
          // Don't block or rollback - local state is source of truth during tour
        });
    }
  },

  skipTour: async () => {
    // Optimistic update: update local state immediately
    const previousState = {
      tourSkipped: get().tourSkipped,
      tourCompleted: get().tourCompleted,
    };
    
    set({ 
      tourSkipped: true, 
      tourCompleted: false,
      error: null 
    });
    
    // Update cache immediately
    get()._updateCache();

    // Check if offline
    if (get().isOffline) {
      offlineQueue.enqueue("skipTour", {});
      set({ queuedActionsCount: offlineQueue.size() });
      return;
    }

    try {
      // Sync with backend asynchronously
      await get()._executeAction("skipTour", {});
    } catch (error: any) {
      // Rollback on failure with user notification
      get()._rollback(previousState);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
      });
      console.error("Failed to skip tour", error);
    }
  },

  completeTourStep: async (stepId: string) => {
    // Parse step number to check if this is the last step
    const stepNumber = parseInt(stepId.match(/\d+/)?.[0] || '0');
    const MAX_TOUR_STEPS = 6;
    const isLastStep = stepNumber >= MAX_TOUR_STEPS;

    // Optimistic update: update local state immediately
    const previousState = {
      tourCompletedSteps: [...get().tourCompletedSteps],
      tourCompleted: get().tourCompleted,
    };
    
    set((state) => ({
      tourCompletedSteps: [...state.tourCompletedSteps, stepId],
      // If this is the last step, mark tour as completed optimistically
      tourCompleted: isLastStep ? true : state.tourCompleted,
      error: null,
    }));
    
    // Update cache immediately
    get()._updateCache();

    // Check if offline
    if (get().isOffline) {
      offlineQueue.enqueue("completeTourStep", { stepId });
      set({ queuedActionsCount: offlineQueue.size() });
      return;
    }

    try {
      // Sync with backend asynchronously
      await get()._executeAction("completeTourStep", { stepId });
    } catch (error: any) {
      // Rollback on failure with user notification
      get()._rollback(previousState);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
      });
      console.error("Failed to complete tour step", error);
    }
  },

  // Tooltip actions
  showTooltip: () => {
    // This is a local state update only - no API call needed for showing
    // The actual tooltip visibility is managed by the TooltipManager component
    // This could be used to track which tooltip is currently active
  },

  dismissTooltip: async (tooltipId: string) => {
    // Optimistic update: update local state immediately
    const previousState = {
      dismissedTooltips: [...get().dismissedTooltips],
    };
    
    set((state) => ({
      dismissedTooltips: [...state.dismissedTooltips, tooltipId],
      error: null,
    }));
    
    // Update cache immediately
    get()._updateCache();

    // Check if offline
    if (get().isOffline) {
      offlineQueue.enqueue("dismissTooltip", { tooltipId });
      set({ queuedActionsCount: offlineQueue.size() });
      return;
    }

    try {
      // Sync with backend asynchronously
      await get()._executeAction("dismissTooltip", { tooltipId });
    } catch (error: any) {
      // Rollback on failure with user notification
      get()._rollback(previousState);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
      });
      console.error("Failed to dismiss tooltip", error);
    }
  },

  // Wizard actions
  startWizard: () => {
    set({ wizardCurrentStep: 0 });
  },

  completeWizardStep: async (stepId: string, data?: any) => {
    
    // Optimistic update: update local state immediately
    const previousState = {
      wizardCurrentStep: get().wizardCurrentStep,
      wizardCompleted: get().wizardCompleted,
    };
    
    // Parse step number to check if this is the final step
    const stepNumber = stepId === 'complete' || stepId === 'step-3' ? 3 : 
                       parseInt(stepId.match(/\d+/)?.[0] || '0');
    const totalSteps = 3; // Should match backend config
    const isLastStep = stepNumber >= totalSteps;
    
    set((state) => {
      const newState = {
        wizardCurrentStep: stepNumber,
        // Optimistically mark as completed if this is the final step
        wizardCompleted: isLastStep ? true : state.wizardCompleted,
        error: null,
      };
      return newState;
    });
    
    // Update cache immediately
    get()._updateCache();

    // Check if offline
    if (get().isOffline) {
      offlineQueue.enqueue("completeWizardStep", { stepId, data });
      set({ queuedActionsCount: offlineQueue.size() });
      return;
    }

    try {
      // Sync with backend asynchronously
      await get()._executeAction("completeWizardStep", { stepId, data });
    } catch (error: any) {
      console.error("Failed to complete wizard step", error);
      // Rollback on failure with user notification
      get()._rollback(previousState);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
      });
    }
  },

  skipWizard: async () => {
    // Optimistic update: update local state immediately
    const previousState = {
      wizardSkipped: get().wizardSkipped,
      wizardCompleted: get().wizardCompleted,
    };
    
    set({
      wizardSkipped: true,
      wizardCompleted: false,
      error: null,
    });
    
    // Update cache immediately
    get()._updateCache();

    // Check if offline
    if (get().isOffline) {
      offlineQueue.enqueue("skipWizard", {});
      set({ queuedActionsCount: offlineQueue.size() });
      return;
    }

    try {
      // Sync with backend asynchronously
      await get()._executeAction("skipWizard", {});
    } catch (error: any) {
      // Rollback on failure with user notification
      get()._rollback(previousState);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
      });
      console.error("Failed to skip wizard", error);
    }
  },

  // Template actions
  selectTemplate: async (templateId: string) => {
    // Optimistic update: update local state immediately
    const previousState = {
      templateSelected: get().templateSelected,
      templateId: get().templateId,
    };
    
    set({
      templateSelected: true,
      templateId,
      error: null,
    });
    
    // Update cache immediately
    get()._updateCache();

    // Check if offline
    if (get().isOffline) {
      offlineQueue.enqueue("selectTemplate", { templateId });
      set({ queuedActionsCount: offlineQueue.size() });
      return;
    }

    try {
      // Sync with backend asynchronously
      await get()._executeAction("selectTemplate", { templateId });
    } catch (error: any) {
      // Rollback on failure with user notification
      get()._rollback(previousState);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
      });
    }
  },

  // General actions
  restartOnboarding: async () => {
    set({ isLoading: true, error: null });
    try {
      router.post(
        "/api/v1/onboarding/restart",
        {},
        {
          preserveScroll: true,
          onSuccess: () => {
            set({
              tourCompleted: false,
              tourSkipped: false,
              tourCurrentStep: 0,
              tourCompletedSteps: [],
              wizardCompleted: false,
              wizardSkipped: false,
              wizardCurrentStep: 0,
              templateSelected: false,
              templateId: null,
              dismissedTooltips: [],
              completedAt: null,
              startedAt: new Date().toISOString(),
              completionPercentage: 0,
              isLoading: false,
            });
            // Clear cache on restart
            get().clearCache();
          },
          onError: (errors) => {
            set({
              error: "Failed to restart onboarding",
              isLoading: false,
            });
            console.error("Failed to restart onboarding", errors);
          },
        },
      );
    } catch (error: any) {
      set({
        error: error.message || "Failed to restart onboarding",
        isLoading: false,
      });
      console.error("Failed to restart onboarding", error);
    }
  },

  setState: (newState: Partial<OnboardingState>) => {
    set((state) => ({
      ...state,
      ...newState,
    }));
    // Update cache after state change
    get()._updateCache();
  },
  
  setOfflineStatus: (isOffline: boolean) => {
    set({ isOffline });
    
    // If coming back online, sync the queue
    if (!isOffline && offlineQueue.size() > 0) {
      get().syncOfflineQueue();
    }
  },
  
  syncOfflineQueue: async () => {
    if (offlineQueue.isSyncInProgress()) {
      return;
    }

    const result = await offlineQueue.sync(async (action: QueuedAction) => {
      await get()._executeAction(action.type, action.payload);
    });

    set({ queuedActionsCount: offlineQueue.size() });

    if (result.failed > 0) {
      console.error(`Failed to sync ${result.failed} queued actions`);
      set({
        error: `Some actions could not be synced. ${result.failed} actions failed.`,
      });
    }
  },
  
  syncWithBackend: async () => {
    // Fetch fresh state from backend
    try {
      const response = await fetch("/api/v1/onboarding/state", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch onboarding state");
      }
      
      const data = await response.json();
      
      // Update store with fresh data
      set({
        ...data,
        lastSyncTimestamp: Date.now(),
      });
      
      // Update cache
      get()._updateCache();
    } catch (error) {
      console.error("Failed to sync with backend:", error);
    }
  },
  
  clearCache: () => {
    clearCachedState();
  },
  
  _rollback: (previousState: Partial<OnboardingState>) => {
    set((state) => ({
      ...state,
      ...previousState,
    }));
    // Update cache after rollback
    get()._updateCache();
  },
  
  _updateCache: () => {
    const state = get();
    const cacheableState: Partial<OnboardingState> = {
      tourCompleted: state.tourCompleted,
      tourSkipped: state.tourSkipped,
      tourCurrentStep: state.tourCurrentStep,
      tourCompletedSteps: state.tourCompletedSteps,
      wizardCompleted: state.wizardCompleted,
      wizardSkipped: state.wizardSkipped,
      wizardCurrentStep: state.wizardCurrentStep,
      templateSelected: state.templateSelected,
      templateId: state.templateId,
      dismissedTooltips: state.dismissedTooltips,
      completedAt: state.completedAt,
      startedAt: state.startedAt,
      completionPercentage: state.completionPercentage,
    };
    saveCachedState(cacheableState);
  },
  
  _executeAction: async (type: string, payload: any) => {
    const retryOptions: RetryOptions = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    };

    return retryWithBackoff(async () => {
      // Check if online before attempting
      if (!isOnline()) {
        throw createNetworkError('No internet connection');
      }

      let endpoint = "";
      let data: any = {};

      switch (type) {
        case "skipTour":
          endpoint = "/api/v1/onboarding/tour/skip";
          break;
        case "completeTourStep":
          endpoint = "/api/v1/onboarding/tour/complete";
          data = { step_id: payload.stepId };
          break;
        case "dismissTooltip":
          endpoint = "/api/v1/onboarding/tooltip/dismiss";
          data = { tooltip_id: payload.tooltipId };
          break;
        case "completeWizardStep":
          endpoint = "/api/v1/onboarding/wizard/complete";
          data = { step_id: payload.stepId, data: payload.data };
          break;
        case "skipWizard":
          endpoint = "/api/v1/onboarding/wizard/skip";
          break;
        case "selectTemplate":
          endpoint = "/api/v1/onboarding/template/select";
          data = { template_id: payload.templateId };
          break;
        default:
          throw new Error(`Unknown action type: ${type}`);
      }

      // Use axios for API calls instead of Inertia router
      const response = await axios.post(endpoint, data);
      
      // Update state with response data if available
      if (response.data?.state) {
        // Transform snake_case to camelCase
        const transformedState = {
          tourCompleted: response.data.state.tourCompleted ?? response.data.state.tour_completed,
          tourSkipped: response.data.state.tourSkipped ?? response.data.state.tour_skipped,
          tourCurrentStep: response.data.state.tourCurrentStep ?? response.data.state.tour_current_step,
          tourCompletedSteps: response.data.state.tourCompletedSteps ?? response.data.state.tour_completed_steps,
          wizardCompleted: response.data.state.wizardCompleted ?? response.data.state.wizard_completed,
          wizardSkipped: response.data.state.wizardSkipped ?? response.data.state.wizard_skipped,
          wizardCurrentStep: response.data.state.wizardCurrentStep ?? response.data.state.wizard_current_step,
          templateSelected: response.data.state.templateSelected ?? response.data.state.template_selected,
          templateId: response.data.state.templateId ?? response.data.state.template_id,
          dismissedTooltips: response.data.state.dismissedTooltips ?? response.data.state.dismissed_tooltips,
          completedAt: response.data.state.completedAt ?? response.data.state.completed_at,
          startedAt: response.data.state.startedAt ?? response.data.state.started_at,
          completionPercentage: response.data.state.completionPercentage ?? response.data.state.completion_percentage,
        };
        
        set(transformedState);
        get()._updateCache();
      } else {
        console.warn('No state in backend response for', type);
      }
    }, retryOptions);
  },
};
});
