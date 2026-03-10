<?php

namespace App\Services;

use App\Models\User;
use App\Models\SubscriptionHistory;
use App\Models\SubscriptionUsageTracking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PlanManagementService
{
    public function __construct(
        private SubscriptionTrackingService $trackingService,
        private AddonUsageService $addonUsageService,
        private \App\Services\Subscription\PlanLimitValidator $planLimitValidator
    ) {}

    /**
     * Change user's plan and handle all related updates.
     * This is the SINGLE source of truth for plan changes.
     */
    public function changePlan(
        User $user,
        string $newPlan,
        ?string $stripePriceId = null,
        ?string $stripeSubscriptionId = null,
        ?string $stripeCustomerId = null,
        string $reason = 'user_initiated',
        ?array $metadata = null
    ): bool {
        return DB::transaction(function () use (
            $user,
            $newPlan,
            $stripePriceId,
            $stripeSubscriptionId,
            $stripeCustomerId,
            $reason,
            $metadata
        ) {
            $previousPlan = $user->current_plan;
            $planConfig = config("plans.{$newPlan}");

            if (!$planConfig) {
                Log::error("Invalid plan: {$newPlan}");
                return false;
            }

            // 1. Update user's current plan
            $user->update([
                'current_plan' => $newPlan,
                'plan_started_at' => now(),
                'plan_renews_at' => $this->calculateRenewalDate($newPlan),
            ]);

            // 2. End previous subscription history if exists
            $activeHistory = $user->subscriptionHistory()->active()->first();
            if ($activeHistory) {
                $activeHistory->end("Changed to {$newPlan}");
            }

            // 3. Create new subscription history entry
            $this->trackingService->recordPlanChange(
                user: $user,
                newPlan: $newPlan,
                previousPlan: $previousPlan,
                stripePriceId: $stripePriceId,
                price: $planConfig['price'] ?? 0,
                billingCycle: $planConfig['billing_cycle'] ?? 'monthly',
                reason: $reason,
                metadata: array_merge($metadata ?? [], [
                    'stripe_subscription_id' => $stripeSubscriptionId,
                    'stripe_customer_id' => $stripeCustomerId,
                ])
            );

            // 4. Initialize or update current month usage tracking
            $this->initializeMonthlyUsage($user, $newPlan);

            // 5. Update old system (workspace subscription) for backward compatibility
            $this->updateWorkspaceSubscription($user, $newPlan, $stripeSubscriptionId);

            // 6. Recalcular el uso de addons para el nuevo plan
            $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
            if ($workspace) {
                // Limpiar caché de uso para que se recalcule desde el inicio del nuevo plan
                $this->planLimitValidator->clearUsageCacheForPlanChange($workspace);
                
                // Recalcular addons
                $this->addonUsageService->recalculateAddonUsageForPlanChange($workspace);
                
                // Notify via WebSocket about plan change
                $notificationService = app(\App\Services\Subscription\UsageLimitsNotificationService::class);
                $notificationService->notifyLimitsUpdated($workspace, 'plan_changed');
                
                Log::info('Usage cache cleared and addon usage recalculated for new plan', [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'new_plan' => $newPlan,
                    'previous_plan' => $previousPlan,
                ]);
            }

            Log::info('Plan changed successfully', [
                'user_id' => $user->id,
                'previous_plan' => $previousPlan,
                'new_plan' => $newPlan,
                'reason' => $reason,
            ]);

            return true;
        });
    }

    /**
     * Renew monthly usage limits without changing the plan.
     * Called automatically at the start of each month.
     */
    public function renewMonthlyLimits(User $user): void
    {
        DB::transaction(function () use ($user) {
            // Get current month usage
            $currentUsage = $user->currentMonthUsage()->first();

            if ($currentUsage) {
                // Archive current month by marking it as complete
                // Don't delete - keep for historical tracking
                Log::info('Archiving previous month usage', [
                    'user_id' => $user->id,
                    'year' => $currentUsage->year,
                    'month' => $currentUsage->month,
                ]);
            }

            // Create new month usage with reset limits
            $this->initializeMonthlyUsage($user, $user->current_plan);

            // Update renewal date
            $user->update([
                'plan_renews_at' => $this->calculateRenewalDate($user->current_plan),
            ]);

            Log::info('Monthly limits renewed', [
                'user_id' => $user->id,
                'plan' => $user->current_plan,
            ]);
        });
    }

    /**
     * Initialize monthly usage tracking for current month.
     */
    private function initializeMonthlyUsage(User $user, string $plan): void
    {
        $planConfig = config("plans.{$plan}");
        $limits = $planConfig['limits'] ?? [];

        $activeHistory = $user->subscriptionHistory()->active()->first();

        if (!$activeHistory) {
            Log::warning('No active subscription history found', ['user_id' => $user->id]);
            return;
        }

        SubscriptionUsageTracking::updateOrCreate(
            [
                'user_id' => $user->id,
                'subscription_history_id' => $activeHistory->id,
                'year' => now()->year,
                'month' => now()->month,
            ],
            [
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
                'publications_used' => 0,
                'publications_limit' => $limits['publications_per_month'] ?? 0,
                'storage_used_bytes' => 0,
                'storage_limit_bytes' => ($limits['storage_gb'] ?? 0) * 1024 * 1024 * 1024,
                'social_accounts_used' => 0,
                'social_accounts_limit' => $limits['social_accounts'] ?? 0,
                'ai_requests_used' => 0,
                'ai_requests_limit' => $limits['ai_requests_per_month'] ?? null,
                'limit_reached' => false,
                'limit_reached_at' => null,
            ]
        );
    }

    /**
     * Calculate renewal date based on plan billing cycle.
     */
    private function calculateRenewalDate(string $plan): Carbon
    {
        $planConfig = config("plans.{$plan}");
        $billingCycle = $planConfig['billing_cycle'] ?? 'monthly';

        return match ($billingCycle) {
            'yearly' => now()->addYear(),
            'monthly' => now()->addMonth(),
            default => now()->addMonth(),
        };
    }

    /**
     * Update workspace subscription for backward compatibility.
     */
    private function updateWorkspaceSubscription(
        User $user,
        string $plan,
        ?string $stripeSubscriptionId
    ): void {
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            return;
        }

        $subscription = $workspace->subscription;

        $subscriptionData = [
            'plan' => $plan,
            'status' => 'active',
            'stripe_status' => 'active',
        ];

        if ($stripeSubscriptionId) {
            $subscriptionData['stripe_subscription_id'] = $stripeSubscriptionId;
        }

        if ($subscription) {
            $subscription->update($subscriptionData);
        } else {
            $workspace->subscription()->create(array_merge($subscriptionData, [
                'user_id' => $user->id,
                'type' => 'default',
                'stripe_id' => $plan . '_' . $workspace->id,
            ]));
        }
    }

    /**
     * Get user's current plan information.
     */
    public function getCurrentPlanInfo(User $user): array
    {
        $planConfig = $user->getPlanConfig();
        $usage = $user->currentMonthUsage()->first();

        return [
            'plan' => $user->current_plan,
            'plan_name' => $planConfig['name'] ?? ucfirst($user->current_plan),
            'started_at' => $user->plan_started_at,
            'renews_at' => $user->plan_renews_at,
            'needs_renewal' => $user->needsPlanRenewal(),
            'is_paid' => $user->isOnPaidPlan(),
            'limits' => $user->getPlanLimits(),
            'usage' => $usage ? [
                'publications' => [
                    'used' => $usage->publications_used,
                    'limit' => $usage->publications_limit,
                    'percentage' => $usage->getPublicationsUsagePercentage(),
                ],
                'storage' => [
                    'used_bytes' => $usage->storage_used_bytes,
                    'limit_bytes' => $usage->storage_limit_bytes,
                    'percentage' => $usage->getStorageUsagePercentage(),
                ],
            ] : null,
        ];
    }
}
