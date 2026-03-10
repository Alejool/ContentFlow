<?php

namespace App\Services\Usage;

use App\Models\Workspace\Workspace;
use App\Models\Subscription\UsageMetric;
use App\Events\Subscription\LimitReached;
use App\Events\Subscription\LimitWarning;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class UsageTrackingService
{
    /**
     * Get plan limits for a workspace. Works with or without a Stripe subscription.
     */
    protected function getWorkspacePlanLimits(Workspace $workspace): array
    {
        $subscription = $workspace->subscription;
        $plan = $subscription?->plan ?? 'demo';

        return config("plans.{$plan}.limits", config('plans.demo.limits', []));
    }

    public function incrementUsage(Workspace $workspace, string $metricType, int $amount = 1): void
    {
        $limits = $this->getWorkspacePlanLimits($workspace);
        $limit = $this->getMetricLimit($limits, $metricType);

        $metric = UsageMetric::firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'metric_type'  => $metricType,
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end'   => now()->endOfMonth()->toDateString(),
            ],
            [
                'current_usage' => 0,
                'limit'         => $limit,
            ]
        );

        // Ensure limit is kept in sync if plan changed
        if ($metric->limit !== $limit) {
            $metric->update(['limit' => $limit]);
        }

        $oldUsage = $metric->current_usage;
        $metric->increment('current_usage', $amount);
        $metric->refresh();

        // Clear cache
        Cache::forget("workspace.{$workspace->id}.usage.{$metricType}");

        // Dispatch events for limit warnings
        $this->checkAndDispatchLimitEvents($workspace, $metricType, $oldUsage, $metric->current_usage, $limit);

        // Notify via WebSocket about usage update
        $this->notifyUsageUpdated($workspace, $metricType);

        Log::info("Usage incremented for workspace {$workspace->id}", [
            'workspace_id' => $workspace->id,
            'metric_type'  => $metricType,
            'amount'       => $amount,
            'old_usage'    => $oldUsage,
            'new_usage'    => $metric->current_usage,
            'limit'        => $limit,
        ]);
    }

    public function decrementUsage(Workspace $workspace, string $metricType, int $amount = 1): void
    {
        $metric = $this->getUsageMetric($workspace, $metricType);

        if ($metric) {
            $oldUsage = $metric->current_usage;
            $newUsage = max(0, $metric->current_usage - $amount);
            $metric->update(['current_usage' => $newUsage]);

            Cache::forget("workspace.{$workspace->id}.usage.{$metricType}");

            Log::info("Usage decremented for workspace {$workspace->id}", [
                'workspace_id' => $workspace->id,
                'metric_type'  => $metricType,
                'amount'       => $amount,
                'old_usage'    => $oldUsage,
                'new_usage'    => $newUsage,
            ]);
        }
    }

    public function canPerformAction(Workspace $workspace, string $metricType): bool
    {
        $limits = $this->getWorkspacePlanLimits($workspace);
        $limit  = $this->getMetricLimit($limits, $metricType);

        // -1 means unlimited
        if ($limit === -1) {
            return true;
        }

        $metric = $this->getUsageMetric($workspace, $metricType);

        // No metric yet means no usage — can perform
        if (!$metric) {
            return true;
        }

        return $metric->current_usage < $limit;
    }

    public function getUsageMetric(Workspace $workspace, string $metricType): ?UsageMetric
    {
        return Cache::remember(
            "workspace.{$workspace->id}.usage.{$metricType}",
            now()->addMinutes(5),
            fn() => UsageMetric::where('workspace_id', $workspace->id)
                ->where('metric_type', $metricType)
                ->where('period_start', '<=', now()->toDateString())
                ->where('period_end', '>=', now()->toDateString())
                ->first()
        );
    }

    public function getAllUsageMetrics(Workspace $workspace): array
    {
        $usageService = app(\App\Services\WorkspaceUsageService::class);
        $summary = $usageService->getUsageSummary($workspace);

        $metrics = [];

        foreach (['publications', 'storage', 'ai_requests', 'social_accounts', 'team_members', 'external_integrations'] as $type) {
            if (isset($summary['usage'][$type])) {
                $data = $summary['usage'][$type];

                // Si es storage, convertir GB a bytes para mantener la consistencia con el DB record viejo si es necesario,
                // pero la vista de Vue/React (UsageMetrics.tsx/UsageDashboard.tsx) espera un objeto "UsageMetric".
                // interface UsageMetric { type: string; current: number; limit: number; percentage: number; remaining: number; }

                $metrics[] = [
                    'type'       => $type === 'publications' ? 'publications_per_month' : ($type === 'ai_requests' ? 'ai_requests_per_month' : ($type === 'storage' ? 'storage_gb' : $type)),
                    'current'    => $data['current'],
                    'limit'      => $data['limit'],
                    'percentage' => $data['percentage'],
                    'remaining'  => $data['remaining'],
                ];
            }
        }

        return $metrics;
    }

    public function resetMonthlyUsage(Workspace $workspace): void
    {
        $limits = $this->getWorkspacePlanLimits($workspace);

        // Metrics that reset monthly (publications, ai_requests)
        $monthlyMetrics = ['publications', 'ai_requests'];

        foreach ($monthlyMetrics as $metricType) {
            $limit = $this->getMetricLimit($limits, $metricType);

            UsageMetric::updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'metric_type'  => $metricType,
                    'period_start' => now()->startOfMonth()->toDateString(),
                    'period_end'   => now()->endOfMonth()->toDateString(),
                ],
                [
                    'current_usage' => 0,
                    'limit'         => $limit,
                ]
            );

            Cache::forget("workspace.{$workspace->id}.usage.{$metricType}");
        }

        // Storage (storage_bytes) is cumulative — recalculate from actual media file sizes
        $actualStorageBytes = $workspace->mediaFiles()->sum('size');
        $storageLimit = $this->getMetricLimit($limits, 'storage_bytes');

        UsageMetric::updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'metric_type'  => 'storage_bytes',
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end'   => now()->endOfMonth()->toDateString(),
            ],
            [
                'current_usage' => $actualStorageBytes,
                'limit'         => $storageLimit,
            ]
        );

        Cache::forget("workspace.{$workspace->id}.usage.storage_bytes");

        Log::info("Monthly usage reset for workspace {$workspace->id}", [
            'workspace_id'   => $workspace->id,
            'period_start'   => now()->startOfMonth()->toDateString(),
            'period_end'     => now()->endOfMonth()->toDateString(),
            'storage_bytes'  => $actualStorageBytes,
        ]);
    }

    private function getMetricLimit(array $limits, string $metricType): int
    {
        return match ($metricType) {
            'publications'  => $limits['publications_per_month'] ?? 0,
            'ai_requests'   => $limits['ai_requests_per_month'] ?? 0,
            'storage_bytes' => ($limits['storage_gb'] ?? 0) === -1
                ? -1
                : (($limits['storage_gb'] ?? 0) * 1024 * 1024 * 1024),
            default => 0,
        };
    }

    private function checkAndDispatchLimitEvents(
        Workspace $workspace,
        string $metricType,
        int $oldUsage,
        int $newUsage,
        int $limit
    ): void {
        // Skip if unlimited
        if ($limit === -1) {
            return;
        }

        $oldPercentage = $limit > 0 ? ($oldUsage / $limit) * 100 : 0;
        $newPercentage = $limit > 0 ? ($newUsage / $limit) * 100 : 0;

        // Dispatch warning event when crossing 80% threshold
        if ($oldPercentage < 80 && $newPercentage >= 80) {
            event(new LimitWarning($workspace, $metricType, $newUsage, $limit, $newPercentage));
        }

        // Dispatch limit reached event when crossing 100% threshold
        if ($oldPercentage < 100 && $newPercentage >= 100) {
            event(new LimitReached($workspace, $metricType, $newUsage, $limit));
        }
    }

    /**
     * Notify workspace about usage updates via WebSocket.
     */
    private function notifyUsageUpdated(Workspace $workspace, string $metricType): void
    {
        // Map internal metric types to frontend metric types
        $frontendMetricType = match ($metricType) {
            'storage_bytes' => 'storage',
            'publications_per_month' => 'publications',
            'ai_requests_per_month' => 'ai_requests',
            'publications' => 'publications',
            'ai_requests' => 'ai_requests',
            'storage' => 'storage',
            default => $metricType,
        };
        
        $notificationService = app(\App\Services\Subscription\UsageLimitsNotificationService::class);
        $notificationService->notifyLimitsUpdated($workspace, "usage_incremented_{$frontendMetricType}");
    }
}