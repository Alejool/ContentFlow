<?php

namespace App\Services\Subscription;

use App\Models\Workspace\Workspace;
use App\Models\Subscription\Subscription;
use App\Models\Subscription\UsageMetric;
use App\Models\SubscriptionHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlanMigrationService
{
    /**
     * Migrate workspace to a new plan.
     */
    public function migrateToPlan(
        Workspace $workspace,
        string $newPlan,
        string $changeType = 'upgraded',
        ?string $reason = null
    ): void {
        DB::transaction(function () use ($workspace, $newPlan, $changeType, $reason) {
            $subscription = $workspace->subscription;
            $oldPlan = $subscription?->plan ?? 'free';

            // End current subscription history
            if ($subscription) {
                $currentHistory = SubscriptionHistory::where('subscription_id', $subscription->id)
                    ->where('is_active', true)
                    ->first();

                if ($currentHistory) {
                    $currentHistory->end($reason ?? "Changed to {$newPlan}");
                }

                // Update subscription
                $subscription->update(['plan' => $newPlan]);
            }

            // Create new subscription history
            SubscriptionHistory::create([
                'user_id' => $workspace->owner()?->id,
                'subscription_id' => $subscription?->id,
                'plan_name' => $newPlan,
                'change_type' => $changeType,
                'previous_plan' => $oldPlan,
                'reason' => $reason,
                'started_at' => now(),
                'is_active' => true,
            ]);

            // Update usage metrics with new limits
            $this->updateUsageLimits($workspace, $newPlan);

            Log::info("Plan migrated for workspace {$workspace->id}", [
                'workspace_id' => $workspace->id,
                'old_plan' => $oldPlan,
                'new_plan' => $newPlan,
                'change_type' => $changeType,
            ]);
        });
    }

    /**
     * Update usage metrics with new plan limits.
     */
    private function updateUsageLimits(Workspace $workspace, string $plan): void
    {
        $limits = config("plans.{$plan}.limits", []);

        $metricTypes = [
            'publications' => $limits['publications_per_month'] ?? 0,
            'ai_requests' => $limits['ai_requests_per_month'] ?? 0,
            'storage' => $limits['storage_gb'] ?? 0,
        ];

        foreach ($metricTypes as $metricType => $limit) {
            UsageMetric::updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'metric_type' => $metricType,
                    'period_start' => now()->startOfMonth(),
                    'period_end' => now()->endOfMonth(),
                ],
                [
                    'limit' => $limit,
                ]
            );
        }
    }

    /**
     * Handle downgrade - check if current usage exceeds new limits.
     */
    public function canDowngradeTo(Workspace $workspace, string $newPlan): array
    {
        $newLimits = config("plans.{$newPlan}.limits", []);
        $validator = app(PlanLimitValidator::class);
        $issues = [];

        // Check publications
        $publicationsUsage = $validator->getCurrentUsage($workspace, 'publications');
        $publicationsLimit = $newLimits['publications_per_month'] ?? 0;
        
        if ($publicationsLimit !== -1 && $publicationsUsage > $publicationsLimit) {
            $issues[] = [
                'type' => 'publications',
                'current' => $publicationsUsage,
                'new_limit' => $publicationsLimit,
                'message' => "Tienes {$publicationsUsage} publicaciones este mes, pero el nuevo plan solo permite {$publicationsLimit}.",
            ];
        }

        // Check social accounts
        $socialAccountsUsage = $validator->getCurrentUsage($workspace, 'social_accounts');
        $socialAccountsLimit = $newLimits['social_accounts'] ?? 0;
        
        if ($socialAccountsLimit !== -1 && $socialAccountsUsage > $socialAccountsLimit) {
            $issues[] = [
                'type' => 'social_accounts',
                'current' => $socialAccountsUsage,
                'new_limit' => $socialAccountsLimit,
                'message' => "Tienes {$socialAccountsUsage} cuentas conectadas, pero el nuevo plan solo permite {$socialAccountsLimit}.",
            ];
        }

        // Check storage
        $storageUsage = $validator->getCurrentUsage($workspace, 'storage');
        $storageLimit = $newLimits['storage_gb'] ?? 0;
        
        if ($storageLimit !== -1 && $storageUsage > $storageLimit) {
            $issues[] = [
                'type' => 'storage',
                'current' => $storageUsage,
                'new_limit' => $storageLimit,
                'message' => "Estás usando {$storageUsage}GB de almacenamiento, pero el nuevo plan solo permite {$storageLimit}GB.",
            ];
        }

        // Check team members
        $teamMembersUsage = $validator->getCurrentUsage($workspace, 'team_members');
        $teamMembersLimit = $newLimits['team_members'] ?? 0;
        
        if ($teamMembersLimit !== -1 && $teamMembersUsage > $teamMembersLimit) {
            $issues[] = [
                'type' => 'team_members',
                'current' => $teamMembersUsage,
                'new_limit' => $teamMembersLimit,
                'message' => "Tienes {$teamMembersUsage} miembros en el equipo, pero el nuevo plan solo permite {$teamMembersLimit}.",
            ];
        }

        return [
            'can_downgrade' => empty($issues),
            'issues' => $issues,
        ];
    }
}
