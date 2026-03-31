<?php

namespace App\Services\Subscription;

use App\Events\Subscription\GracePeriodStarted;
use App\Models\Subscription\Subscription;
use App\Models\SystemSetting;
use App\Models\Workspace\Workspace;
use App\Notifications\Subscription\GracePeriodExpiringNotification;
use Illuminate\Support\Facades\Log;

class GracePeriodManager
{
    public function __construct(
        private readonly PlanValidator $planValidator,
    ) {}

    /**
     * Initialize a grace period for a workspace after a failed renewal.
     */
    public function initGracePeriod(Workspace $workspace): void
    {
        $gracePeriodDays = SystemSetting::get('subscription.grace_period_days', 3);
        $gracePeriodEndsAt = now()->addDays($gracePeriodDays);

        $workspace->subscription()->update([
            'grace_period_ends_at' => $gracePeriodEndsAt,
        ]);

        // Reload the subscription to get fresh data
        $workspace->load('subscription');

        GracePeriodStarted::dispatch($workspace, $gracePeriodEndsAt);

        Log::info('Grace period initialized', [
            'workspace_id' => $workspace->id,
            'grace_period_ends_at' => $gracePeriodEndsAt->toIso8601String(),
            'grace_period_days' => $gracePeriodDays,
        ]);
    }

    /**
     * Process all workspaces whose grace period has expired and downgrade them to free.
     */
    public function processExpiredGracePeriods(): void
    {
        $expiredSubscriptions = Subscription::query()
            ->whereNotNull('grace_period_ends_at')
            ->where('grace_period_ends_at', '<', now())
            ->where('plan', '!=', 'free')
            ->with('workspace')
            ->get();

        foreach ($expiredSubscriptions as $subscription) {
            $workspace = $subscription->workspace;

            if (! $workspace) {
                Log::warning('Grace period expired but workspace not found', [
                    'subscription_id' => $subscription->id,
                ]);
                continue;
            }

            Log::info('Processing expired grace period', [
                'workspace_id' => $workspace->id,
                'grace_period_ends_at' => $subscription->grace_period_ends_at->toIso8601String(),
            ]);

            $result = $this->planValidator->executeDowngrade($workspace, 'grace_period_expired');

            if ($result->hasError) {
                Log::error('Failed to downgrade workspace after grace period expiry', [
                    'workspace_id' => $workspace->id,
                    'error' => $result->errorMessage,
                ]);
            }
        }
    }

    /**
     * Send expiration warnings to workspace owners whose grace period ends within 2 days.
     */
    public function sendExpirationWarnings(): void
    {
        $soonExpiringSubscriptions = Subscription::query()
            ->whereNotNull('grace_period_ends_at')
            ->whereBetween('grace_period_ends_at', [now(), now()->addDays(2)])
            ->where('plan', '!=', 'free')
            ->with('workspace')
            ->get();

        foreach ($soonExpiringSubscriptions as $subscription) {
            $workspace = $subscription->workspace;

            if (! $workspace) {
                continue;
            }

            $owner = $workspace->owner();

            if (! $owner) {
                Log::warning('Grace period expiring but workspace owner not found', [
                    'workspace_id' => $workspace->id,
                ]);
                continue;
            }

            $owner->notify(new GracePeriodExpiringNotification(
                $workspace,
                $subscription->grace_period_ends_at
            ));

            Log::info('Grace period expiration warning sent', [
                'workspace_id' => $workspace->id,
                'owner_id' => $owner->id,
                'grace_period_ends_at' => $subscription->grace_period_ends_at->toIso8601String(),
            ]);
        }
    }

    /**
     * Check if a workspace is currently in a grace period.
     */
    public function isInGracePeriod(Workspace $workspace): bool
    {
        return $this->planValidator->isInGracePeriod($workspace);
    }
}
