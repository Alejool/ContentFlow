<?php

namespace App\Services;

use App\Models\OnboardingAnalytics;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OnboardingAnalyticsService
{
    /**
     * Record a step completion event
     * 
     * @param User $user
     * @param string $stepId
     * @param string $stepType (tour, wizard, template)
     * @param int|null $durationSeconds
     * @return void
     */
    public function recordStepCompletion(User $user, string $stepId, string $stepType, ?int $durationSeconds = null): void
    {
        try {
            OnboardingAnalytics::create([
                'user_id' => $user->id,
                'event_type' => 'step_completed',
                'event_data' => [
                    'step_type' => $stepType,
                ],
                'step_id' => $stepId,
                'duration_seconds' => $durationSeconds,
            ]);

            Log::info("Analytics: Step completion recorded", [
                'user_id' => $user->id,
                'step_id' => $stepId,
                'step_type' => $stepType,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record step completion analytics", [
                'user_id' => $user->id,
                'step_id' => $stepId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Record a skip event
     * 
     * @param User $user
     * @param string $stepId
     * @param string $stepType (tour, wizard, template)
     * @return void
     */
    public function recordSkipEvent(User $user, string $stepId, string $stepType): void
    {
        try {
            OnboardingAnalytics::create([
                'user_id' => $user->id,
                'event_type' => 'step_skipped',
                'event_data' => [
                    'step_type' => $stepType,
                ],
                'step_id' => $stepId,
                'duration_seconds' => null,
            ]);

            Log::info("Analytics: Skip event recorded", [
                'user_id' => $user->id,
                'step_id' => $stepId,
                'step_type' => $stepType,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record skip event analytics", [
                'user_id' => $user->id,
                'step_id' => $stepId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Record an abandonment event
     * 
     * @param User $user
     * @param string $lastStepId
     * @param string $stepType
     * @return void
     */
    public function recordAbandonment(User $user, string $lastStepId, string $stepType): void
    {
        try {
            OnboardingAnalytics::create([
                'user_id' => $user->id,
                'event_type' => 'onboarding_abandoned',
                'event_data' => [
                    'step_type' => $stepType,
                    'last_step' => $lastStepId,
                ],
                'step_id' => $lastStepId,
                'duration_seconds' => null,
            ]);

            Log::info("Analytics: Abandonment recorded", [
                'user_id' => $user->id,
                'last_step_id' => $lastStepId,
                'step_type' => $stepType,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record abandonment analytics", [
                'user_id' => $user->id,
                'last_step_id' => $lastStepId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Record tooltip dismissal event
     * 
     * @param User $user
     * @param string $tooltipId
     * @return void
     */
    public function recordTooltipDismissal(User $user, string $tooltipId): void
    {
        try {
            OnboardingAnalytics::create([
                'user_id' => $user->id,
                'event_type' => 'tooltip_dismissed',
                'event_data' => [
                    'tooltip_id' => $tooltipId,
                ],
                'step_id' => $tooltipId,
                'duration_seconds' => null,
            ]);

            Log::info("Analytics: Tooltip dismissal recorded", [
                'user_id' => $user->id,
                'tooltip_id' => $tooltipId,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record tooltip dismissal analytics", [
                'user_id' => $user->id,
                'tooltip_id' => $tooltipId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Record template selection event
     * 
     * @param User $user
     * @param string $templateId
     * @return void
     */
    public function recordTemplateSelection(User $user, string $templateId): void
    {
        try {
            OnboardingAnalytics::create([
                'user_id' => $user->id,
                'event_type' => 'template_selected',
                'event_data' => [
                    'template_id' => $templateId,
                ],
                'step_id' => 'template_selection',
                'duration_seconds' => null,
            ]);

            Log::info("Analytics: Template selection recorded", [
                'user_id' => $user->id,
                'template_id' => $templateId,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record template selection analytics", [
                'user_id' => $user->id,
                'template_id' => $templateId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Calculate duration between two timestamps
     * 
     * @param \DateTime|string $startTime
     * @param \DateTime|string|null $endTime
     * @return int Duration in seconds
     */
    public function calculateDuration($startTime, $endTime = null): int
    {
        $start = $startTime instanceof \DateTime ? $startTime : new \DateTime($startTime);
        $end = $endTime ? ($endTime instanceof \DateTime ? $endTime : new \DateTime($endTime)) : new \DateTime();
        
        return $end->getTimestamp() - $start->getTimestamp();
    }

    /**
     * Get aggregate statistics for onboarding completion
     * 
     * @return array
     */
    public function getAggregateStatistics(): array
    {
        try {
            // Total users who started onboarding
            $totalUsers = DB::table('onboarding_states')->count();

            // Users who completed onboarding
            $completedUsers = DB::table('onboarding_states')
                ->whereNotNull('completed_at')
                ->count();

            // Overall completion rate
            $overallCompletionRate = $totalUsers > 0 
                ? round(($completedUsers / $totalUsers) * 100, 2) 
                : 0;

            // Tour statistics
            $tourStats = $this->getTourStatistics();

            // Wizard statistics
            $wizardStats = $this->getWizardStatistics();

            // Template statistics
            $templateStats = $this->getTemplateStatistics();

            // Average completion time
            $avgCompletionTime = $this->getAverageCompletionTime();

            return [
                'total_users' => $totalUsers,
                'completed_users' => $completedUsers,
                'overall_completion_rate' => $overallCompletionRate,
                'tour_statistics' => $tourStats,
                'wizard_statistics' => $wizardStats,
                'template_statistics' => $templateStats,
                'average_completion_time_seconds' => $avgCompletionTime,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to get aggregate statistics", [
                'error' => $e->getMessage(),
            ]);

            return [
                'error' => 'Failed to retrieve statistics',
            ];
        }
    }

    /**
     * Get tour-specific statistics
     * 
     * @return array
     */
    protected function getTourStatistics(): array
    {
        $totalUsers = DB::table('onboarding_states')->count();

        $tourCompleted = DB::table('onboarding_states')
            ->where('tour_completed', true)
            ->count();

        $tourSkipped = DB::table('onboarding_states')
            ->where('tour_skipped', true)
            ->count();

        $completionRate = $totalUsers > 0 
            ? round(($tourCompleted / $totalUsers) * 100, 2) 
            : 0;

        $skipRate = $totalUsers > 0 
            ? round(($tourSkipped / $totalUsers) * 100, 2) 
            : 0;

        return [
            'completed' => $tourCompleted,
            'skipped' => $tourSkipped,
            'completion_rate' => $completionRate,
            'skip_rate' => $skipRate,
        ];
    }

    /**
     * Get wizard-specific statistics
     * 
     * @return array
     */
    protected function getWizardStatistics(): array
    {
        $totalUsers = DB::table('onboarding_states')->count();

        $wizardCompleted = DB::table('onboarding_states')
            ->where('wizard_completed', true)
            ->count();

        $wizardSkipped = DB::table('onboarding_states')
            ->where('wizard_skipped', true)
            ->count();

        $completionRate = $totalUsers > 0 
            ? round(($wizardCompleted / $totalUsers) * 100, 2) 
            : 0;

        $skipRate = $totalUsers > 0 
            ? round(($wizardSkipped / $totalUsers) * 100, 2) 
            : 0;

        return [
            'completed' => $wizardCompleted,
            'skipped' => $wizardSkipped,
            'completion_rate' => $completionRate,
            'skip_rate' => $skipRate,
        ];
    }

    /**
     * Get template-specific statistics
     * 
     * @return array
     */
    protected function getTemplateStatistics(): array
    {
        $totalUsers = DB::table('onboarding_states')->count();

        $templateSelected = DB::table('onboarding_states')
            ->where('template_selected', true)
            ->count();

        $selectionRate = $totalUsers > 0 
            ? round(($templateSelected / $totalUsers) * 100, 2) 
            : 0;

        return [
            'selected' => $templateSelected,
            'selection_rate' => $selectionRate,
        ];
    }

    /**
     * Get average completion time in seconds
     * 
     * @return int|null
     */
    protected function getAverageCompletionTime(): ?int
    {
        $result = DB::table('onboarding_states')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_duration')
            ->first();

        return $result && $result->avg_duration ? (int) $result->avg_duration : null;
    }

    /**
     * Get completion rates per step
     * 
     * @return array
     */
    public function getStepCompletionRates(): array
    {
        try {
            $stepStats = DB::table('onboarding_analytics')
                ->select('step_id', 'event_type', DB::raw('COUNT(*) as count'))
                ->whereIn('event_type', ['step_completed', 'step_skipped'])
                ->groupBy('step_id', 'event_type')
                ->get();

            $rates = [];
            foreach ($stepStats as $stat) {
                if (!isset($rates[$stat->step_id])) {
                    $rates[$stat->step_id] = [
                        'step_id' => $stat->step_id,
                        'completed' => 0,
                        'skipped' => 0,
                    ];
                }

                if ($stat->event_type === 'step_completed') {
                    $rates[$stat->step_id]['completed'] = $stat->count;
                } elseif ($stat->event_type === 'step_skipped') {
                    $rates[$stat->step_id]['skipped'] = $stat->count;
                }
            }

            // Calculate rates
            foreach ($rates as $stepId => &$data) {
                $total = $data['completed'] + $data['skipped'];
                $data['completion_rate'] = $total > 0 
                    ? round(($data['completed'] / $total) * 100, 2) 
                    : 0;
                $data['skip_rate'] = $total > 0 
                    ? round(($data['skipped'] / $total) * 100, 2) 
                    : 0;
            }

            return array_values($rates);
        } catch (\Exception $e) {
            Log::error("Failed to get step completion rates", [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
