<?php

namespace App\Services\Subscription;

use App\Events\Subscription\SubscriptionDowngraded;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\DTOs\ValidationResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlanValidator
{
    public function __construct(
        private readonly PlanMigrationService $planMigrationService,
    ) {}

    /**
     * Validate the subscription status of a workspace.
     */
    public function validate(Workspace $workspace): ValidationResult
    {
        $subscription = $workspace->subscription;

        // No active subscription
        if (! $subscription) {
            return new ValidationResult(
                isValid: false,
                requiresDowngrade: true,
                reason: 'no_subscription',
                gracePeriodEndsAt: null,
            );
        }

        // Subscription has expired
        if ($subscription->ends_at && $subscription->ends_at->isPast()) {
            // Check if in grace period
            if ($this->isInGracePeriod($workspace)) {
                return new ValidationResult(
                    isValid: true,
                    requiresDowngrade: false,
                    reason: null,
                    gracePeriodEndsAt: $subscription->grace_period_ends_at,
                );
            }

            return new ValidationResult(
                isValid: false,
                requiresDowngrade: true,
                reason: 'subscription_expired',
                gracePeriodEndsAt: null,
            );
        }

        // Subscription is active
        return new ValidationResult(
            isValid: true,
            requiresDowngrade: false,
            reason: null,
            gracePeriodEndsAt: null,
        );
    }

    /**
     * Execute a downgrade of the workspace to the free plan.
     * Wrapped in a DB transaction. Returns a ValidationResult with hasError=true on failure.
     */
    public function executeDowngrade(Workspace $workspace, string $reason): ValidationResult
    {
        $previousPlan = $workspace->subscription?->plan ?? 'free';

        try {
            DB::transaction(function () use ($workspace, $reason, $previousPlan) {
                $this->planMigrationService->migrateToPlan(
                    $workspace,
                    'free',
                    'downgraded',
                    $reason
                );

                SubscriptionDowngraded::dispatch($workspace, $previousPlan, 'free', $reason);
            });

            return new ValidationResult(
                isValid: true,
                requiresDowngrade: false,
                reason: null,
                gracePeriodEndsAt: null,
            );
        } catch (\Exception $e) {
            Log::error('PlanValidator downgrade failed', [
                'workspace_id' => $workspace->id,
                'previous_plan' => $previousPlan,
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);

            return new ValidationResult(
                isValid: false,
                requiresDowngrade: true,
                reason: $reason,
                gracePeriodEndsAt: null,
                hasError: true,
                errorMessage: $e->getMessage(),
            );
        }
    }

    /**
     * Check if the workspace subscription is currently in a grace period.
     */
    public function isInGracePeriod(Workspace $workspace): bool
    {
        $subscription = $workspace->subscription;

        if (! $subscription || ! $subscription->grace_period_ends_at) {
            return false;
        }

        return $subscription->grace_period_ends_at->isFuture();
    }
}
