<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OnboardingService;
use App\Services\OnboardingAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OnboardingController extends Controller
{
    protected OnboardingService $onboardingService;
    protected OnboardingAnalyticsService $analyticsService;

    public function __construct(
        OnboardingService $onboardingService,
        OnboardingAnalyticsService $analyticsService
    ) {
        $this->onboardingService = $onboardingService;
        $this->analyticsService = $analyticsService;
    }

    /**
     * Initialize onboarding for the authenticated user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function start(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $state = $this->onboardingService->initializeOnboarding($user);

            return response()->json([
                'message' => 'Onboarding initialized successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error initializing onboarding: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to initialize onboarding',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Complete a tour step
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function completeTourStep(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'step_id' => 'required|string|max:255',
        ]);

        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $this->onboardingService->completeTourStep($user, $validated['step_id']);
            
            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'message' => 'Tour step completed successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error completing tour step: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to complete tour step',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update current tour step (for navigation tracking)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateTourStep(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'step' => 'required|integer|min:0',
        ]);

        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Update the current tour step
            $this->onboardingService->updateTourStep($user, $validated['step']);
            
            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'message' => 'Tour step updated successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating tour step: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to update tour step',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Skip the tour
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function skipTour(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $this->onboardingService->skipTour($user);
            
            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'message' => 'Tour skipped successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error skipping tour: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to skip tour',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Skip the wizard
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function skipWizard(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $this->onboardingService->skipWizard($user);
            
            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'message' => 'Wizard skipped successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error skipping wizard: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to skip wizard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Dismiss a tooltip
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function dismissTooltip(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tooltip_id' => 'required|string|max:255',
        ]);

        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $this->onboardingService->dismissTooltip($user, $validated['tooltip_id']);
            
            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'message' => 'Tooltip dismissed successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error dismissing tooltip: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to dismiss tooltip',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Complete a wizard step
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function completeWizardStep(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'step_id' => 'required|string|max:255',
            'data' => 'nullable|array',
        ]);

        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $this->onboardingService->completeWizardStep(
                $user,
                $validated['step_id'],
                $validated['data'] ?? []
            );
            
            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'message' => 'Wizard step completed successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error completing wizard step: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to complete wizard step',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Record template selection
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function selectTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => 'required|string|max:255',
        ]);

        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $this->onboardingService->recordTemplateSelection($user, $validated['template_id']);
            
            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'message' => 'Template selected successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error selecting template: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to select template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restart onboarding for the authenticated user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function restart(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $state = $this->onboardingService->restartOnboarding($user);

            return response()->json([
                'message' => 'Onboarding restarted successfully',
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error restarting onboarding: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to restart onboarding',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current onboarding state for the authenticated user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getState(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            $state = $this->onboardingService->getOnboardingState($user);

            return response()->json([
                'state' => $this->formatOnboardingState($state),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error getting onboarding state: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to get onboarding state',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Format onboarding state for API response
     * 
     * @param \App\Models\OnboardingState $state
     * @return array
     */
    protected function formatOnboardingState($state): array
    {
        return [
            'tourCompleted' => $state->tour_completed,
            'tourSkipped' => $state->tour_skipped,
            'tourCurrentStep' => $state->tour_current_step,
            'tourCompletedSteps' => $state->tour_completed_steps ?? [],
            'wizardCompleted' => $state->wizard_completed,
            'wizardSkipped' => $state->wizard_skipped,
            'wizardCurrentStep' => $state->wizard_current_step,
            'templateSelected' => $state->template_selected,
            'templateId' => $state->template_id,
            'dismissedTooltips' => $state->dismissed_tooltips ?? [],
            'completedAt' => $state->completed_at?->toIso8601String(),
            'startedAt' => $state->started_at?->toIso8601String(),
            'completionPercentage' => $state->getCompletionPercentage(),
            'isComplete' => $this->onboardingService->isOnboardingComplete($state->user),
        ];
    }

    /**
     * Get analytics dashboard data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        try {
            // Check if user is authenticated and has admin privileges
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Get aggregate statistics
            $aggregateStats = $this->analyticsService->getAggregateStatistics();

            // Get step completion rates
            $stepCompletionRates = $this->analyticsService->getStepCompletionRates();

            return response()->json([
                'aggregate_statistics' => $aggregateStats,
                'step_completion_rates' => $stepCompletionRates,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error getting onboarding analytics: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to get onboarding analytics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
