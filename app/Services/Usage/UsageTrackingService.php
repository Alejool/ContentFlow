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
    public function incrementUsage(Workspace $workspace, string $metricType, int $amount = 1): void
    {
        $subscription = $workspace->subscription;
        
        if (!$subscription) {
            return;
        }

        $limits = $subscription->getPlanLimits()['limits'] ?? [];
        $limit = $this->getMetricLimit($limits, $metricType);

        $metric = UsageMetric::firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'metric_type' => $metricType,
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
            ],
            [
                'current_usage' => 0,
                'limit' => $limit,
            ]
        );

        $oldUsage = $metric->current_usage;
        $metric->increment('current_usage', $amount);
        $metric->refresh();

        // Limpiar caché
        Cache::forget("workspace.{$workspace->id}.usage.{$metricType}");

        // Dispatch events for limit warnings
        $this->checkAndDispatchLimitEvents($workspace, $metricType, $oldUsage, $metric->current_usage, $limit);

        Log::info("Usage incremented for workspace {$workspace->id}", [
            'workspace_id' => $workspace->id,
            'metric_type' => $metricType,
            'amount' => $amount,
            'old_usage' => $oldUsage,
            'new_usage' => $metric->current_usage,
            'limit' => $limit,
        ]);
    }

    public function decrementUsage(Workspace $workspace, string $metricType, int $amount = 1): void
    {
        $metric = $this->getUsageMetric($workspace, $metricType);
        
        if ($metric) {
            $oldUsage = $metric->current_usage;
            $metric->decrement('current_usage', $amount);
            $metric->update(['current_usage' => max(0, $metric->current_usage)]);
            
            Cache::forget("workspace.{$workspace->id}.usage.{$metricType}");

            Log::info("Usage decremented for workspace {$workspace->id}", [
                'workspace_id' => $workspace->id,
                'metric_type' => $metricType,
                'amount' => $amount,
                'old_usage' => $oldUsage,
                'new_usage' => $metric->current_usage,
            ]);
        }
    }

    public function canPerformAction(Workspace $workspace, string $metricType): bool
    {
        $metric = $this->getUsageMetric($workspace, $metricType);
        
        if (!$metric) {
            return true;
        }

        // -1 significa ilimitado
        if ($metric->limit === -1) {
            return true;
        }

        return $metric->current_usage < $metric->limit;
    }

    public function getUsageMetric(Workspace $workspace, string $metricType): ?UsageMetric
    {
        return Cache::remember(
            "workspace.{$workspace->id}.usage.{$metricType}",
            now()->addMinutes(5),
            fn() => UsageMetric::where('workspace_id', $workspace->id)
                ->where('metric_type', $metricType)
                ->where('period_start', '<=', now())
                ->where('period_end', '>=', now())
                ->first()
        );
    }

    public function getAllUsageMetrics(Workspace $workspace): array
    {
        $metrics = UsageMetric::where('workspace_id', $workspace->id)
            ->where('period_start', '<=', now())
            ->where('period_end', '>=', now())
            ->get();

        return $metrics->map(function ($metric) {
            return [
                'type' => $metric->metric_type,
                'current' => $metric->current_usage,
                'limit' => $metric->limit,
                'percentage' => $metric->getUsagePercentage(),
                'remaining' => $metric->getRemainingUsage(),
            ];
        })->toArray();
    }

    public function resetMonthlyUsage(Workspace $workspace): void
    {
        $subscription = $workspace->subscription;
        
        if (!$subscription) {
            return;
        }

        $limits = $subscription->getPlanLimits()['limits'] ?? [];

        // Archive old metrics instead of deleting
        UsageMetric::where('workspace_id', $workspace->id)
            ->where('period_end', '<', now())
            ->delete();

        // Crear nuevas métricas para el nuevo período
        foreach (['publications', 'ai_requests', 'storage'] as $metricType) {
            $limit = $this->getMetricLimit($limits, $metricType);
            
            UsageMetric::updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'metric_type' => $metricType,
                    'period_start' => now()->startOfMonth(),
                    'period_end' => now()->endOfMonth(),
                ],
                [
                    'current_usage' => 0,
                    'limit' => $limit,
                ]
            );
        }

        // Clear all usage cache for this workspace
        Cache::tags(["workspace.{$workspace->id}.usage"])->flush();

        Log::info("Monthly usage reset for workspace {$workspace->id}", [
            'workspace_id' => $workspace->id,
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
        ]);
    }

    private function getMetricLimit(array $limits, string $metricType): int
    {
        return match($metricType) {
            'publications' => $limits['publications_per_month'] ?? 0,
            'ai_requests' => $limits['ai_requests_per_month'] ?? 0,
            'storage' => $limits['storage_gb'] ?? 0,
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
}

