<?php

namespace App\Services;

use App\Models\User;
use App\Models\SubscriptionHistory;
use App\Models\SubscriptionUsageTracking;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SubscriptionTrackingService
{
    /**
     * Plan limits configuration.
     */
    protected array $planLimits = [
        'free' => [
            'publications' => 3,
            'social_accounts' => -1, // unlimited - todas las redes sociales disponibles
            'storage_gb' => 1,
            'ai_requests' => 10,
        ],
        'starter' => [
            'publications' => 50,
            'social_accounts' => -1, // unlimited - todas las redes sociales disponibles
            'storage_gb' => 10,
            'ai_requests' => 100,
        ],
        'professional' => [
            'publications' => 200,
            'social_accounts' => -1, // unlimited - todas las redes sociales disponibles
            'storage_gb' => 100,
            'ai_requests' => 500,
        ],
        'enterprise' => [
            'publications' => -1, // unlimited
            'social_accounts' => -1, // unlimited - todas las redes sociales disponibles
            'storage_gb' => 1000,
            'ai_requests' => -1, // unlimited
        ],
    ];

    /**
     * Plan hierarchy for upgrade/downgrade detection.
     */
    protected array $planHierarchy = [
        'free' => 0,
        'starter' => 1,
        'professional' => 2,
        'enterprise' => 3,
    ];

    /**
     * Record a plan change for a user.
     */
    public function recordPlanChange(
            User $user,
            string $newPlan,
            ?string $previousPlan = null,
            ?string $stripePriceId = null,
            float $price = 0,
            string $billingCycle = 'monthly',
            ?string $reason = null,
            ?array $metadata = null
        ): SubscriptionHistory {
            return DB::transaction(function () use (
                $user,
                $newPlan,
                $previousPlan,
                $stripePriceId,
                $price,
                $billingCycle,
                $reason,
                $metadata
            ) {
                // End the current active subscription history
                $this->endCurrentSubscriptionHistory($user, $reason);

                // Determine change type
                $changeType = $this->determineChangeType($previousPlan, $newPlan);

                // Create new subscription history entry
                $history = SubscriptionHistory::create([
                    'user_id' => $user->id,
                    'subscription_id' => null, // No longer using Cashier subscriptions
                    'plan_name' => $newPlan,
                    'stripe_price_id' => $stripePriceId,
                    'price' => $price,
                    'billing_cycle' => $billingCycle,
                    'change_type' => $changeType,
                    'previous_plan' => $previousPlan,
                    'reason' => $reason ?? 'user_initiated',
                    'started_at' => now(),
                    'is_active' => true,
                    'metadata' => $metadata,
                ]);

                // Delete or update existing usage tracking for current month
                $now = now();
                $existingUsage = SubscriptionUsageTracking::where('user_id', $user->id)
                    ->where('year', $now->year)
                    ->where('month', $now->month)
                    ->first();

                if ($existingUsage) {
                    // Preserve usage data but update limits and subscription_history_id
                    $limits = $this->planLimits[$newPlan] ?? $this->planLimits['free'];

                    $existingUsage->update([
                        'subscription_history_id' => $history->id,
                        'publications_limit' => $limits['publications'],
                        'social_accounts_limit' => $limits['social_accounts'],
                        'storage_limit_bytes' => $limits['storage_gb'] * 1024 * 1024 * 1024,
                        'ai_requests_limit' => $limits['ai_requests'],
                    ]);
                } else {
                    // Create new usage tracking for current month
                    $this->createUsageTracking($user, $history);
                }

                return $history;
            });
        }

    /**
     * End the current active subscription history.
     */
    protected function endCurrentSubscriptionHistory(User $user, ?string $reason = null): void
    {
        SubscriptionHistory::where('user_id', $user->id)
            ->where('is_active', true)
            ->each(function ($history) use ($reason) {
                $history->end($reason);
            });
    }

    /**
     * Determine the type of plan change.
     */
    protected function determineChangeType(?string $previousPlan, string $newPlan): string
    {
        if (!$previousPlan) {
            return 'created';
        }

        $previousLevel = $this->planHierarchy[$previousPlan] ?? 0;
        $newLevel = $this->planHierarchy[$newPlan] ?? 0;

        if ($newLevel > $previousLevel) {
            return 'upgraded';
        } elseif ($newLevel < $previousLevel) {
            return 'downgraded';
        }

        return 'renewed';
    }

    /**
     * Create usage tracking for the current period.
     */
    public function createUsageTracking(User $user, SubscriptionHistory $history): SubscriptionUsageTracking
    {
        $now = now();
        $limits = $this->planLimits[$history->plan_name] ?? $this->planLimits['free'];

        return SubscriptionUsageTracking::create([
            'user_id' => $user->id,
            'subscription_history_id' => $history->id,
            'year' => $now->year,
            'month' => $now->month,
            'period_start' => $now->startOfMonth()->toDateString(),
            'period_end' => $now->endOfMonth()->toDateString(),
            'publications_used' => 0,
            'publications_limit' => $limits['publications'],
            'social_accounts_used' => $user->socialAccounts()->count(),
            'social_accounts_limit' => $limits['social_accounts'],
            'storage_used_bytes' => $this->calculateUserStorageUsage($user),
            'storage_limit_bytes' => $limits['storage_gb'] * 1024 * 1024 * 1024, // Convert GB to bytes
            'ai_requests_used' => 0,
            'ai_requests_limit' => $limits['ai_requests'],
        ]);
    }

    /**
     * Get or create usage tracking for current month.
     */
    public function getCurrentMonthUsage(User $user): ?SubscriptionUsageTracking
    {
        $activeHistory = $user->subscriptionHistory()->active()->first();

        if (!$activeHistory) {
            return null;
        }

        $now = now();

        return SubscriptionUsageTracking::firstOrCreate(
            [
                'user_id' => $user->id,
                'subscription_history_id' => $activeHistory->id,
                'year' => $now->year,
                'month' => $now->month,
            ],
            [
                'period_start' => $now->startOfMonth()->toDateString(),
                'period_end' => $now->endOfMonth()->toDateString(),
                'publications_used' => 0,
                'publications_limit' => $this->getPlanLimit($activeHistory->plan_name, 'publications'),
                'social_accounts_used' => $user->socialAccounts()->count(),
                'social_accounts_limit' => $this->getPlanLimit($activeHistory->plan_name, 'social_accounts'),
                'storage_used_bytes' => $this->calculateUserStorageUsage($user),
                'storage_limit_bytes' => $this->getPlanLimit($activeHistory->plan_name, 'storage_gb') * 1024 * 1024 * 1024,
                'ai_requests_used' => 0,
                'ai_requests_limit' => $this->getPlanLimit($activeHistory->plan_name, 'ai_requests'),
            ]
        );
    }

    /**
     * Get plan limit for a specific metric.
     */
    protected function getPlanLimit(string $planName, string $metric): int
    {
        return $this->planLimits[$planName][$metric] ?? 0;
    }

    /**
     * Calculate total storage usage for a user.
     */
    protected function calculateUserStorageUsage(User $user): int
    {
        // This should calculate actual storage usage from media files
        // For now, returning 0 as placeholder
        return 0;
    }

    /**
     * Get subscription history for a user.
     */
    public function getUserSubscriptionHistory(User $user, ?int $limit = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = SubscriptionHistory::where('user_id', $user->id)
            ->with('usageTracking')
            ->orderBy('started_at', 'desc');

        if ($limit) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Get usage summary for a specific period.
     */
    public function getUsageSummary(User $user, int $year, int $month): ?array
    {
        $usage = SubscriptionUsageTracking::where('user_id', $user->id)
            ->forPeriod($year, $month)
            ->with('subscriptionHistory')
            ->first();

        if (!$usage) {
            return null;
        }

        return [
            'period' => [
                'year' => $year,
                'month' => $month,
                'start' => $usage->period_start,
                'end' => $usage->period_end,
            ],
            'plan' => $usage->subscriptionHistory->plan_name,
            'publications' => [
                'used' => $usage->publications_used,
                'limit' => $usage->publications_limit,
                'remaining' => $usage->getRemainingPublications(),
                'percentage' => $usage->getPublicationsUsagePercentage(),
            ],
            'storage' => [
                'used_bytes' => $usage->storage_used_bytes,
                'limit_bytes' => $usage->storage_limit_bytes,
                'remaining_bytes' => $usage->getRemainingStorage(),
                'percentage' => $usage->getStorageUsagePercentage(),
            ],
            'social_accounts' => [
                'used' => $usage->social_accounts_used,
                'limit' => $usage->social_accounts_limit,
            ],
            'ai_requests' => [
                'used' => $usage->ai_requests_used,
                'limit' => $usage->ai_requests_limit,
            ],
            'limits_reached' => $usage->limit_reached,
            'limits_reached_at' => $usage->limit_reached_at,
        ];
    }

    /**
     * Get total usage across all time for a user.
     */
    public function getTotalUsageStats(User $user): array
    {
        $allUsage = SubscriptionUsageTracking::where('user_id', $user->id)->get();

        return [
            'total_publications' => $allUsage->sum('publications_used'),
            'total_storage_bytes' => $allUsage->max('storage_used_bytes'), // Max because storage is cumulative
            'total_ai_requests' => $allUsage->sum('ai_requests_used'),
            'total_reels_generated' => $allUsage->sum('reels_generated'),
            'total_scheduled_posts' => $allUsage->sum('scheduled_posts'),
            'months_tracked' => $allUsage->count(),
        ];
    }

    /**
     * Reset monthly usage (called at the start of each month).
     */
    public function resetMonthlyUsage(User $user): void
    {
        $activeHistory = $user->subscriptionHistory()->active()->first();

        if ($activeHistory) {
            $this->createUsageTracking($user, $activeHistory);
        }
    }
}
