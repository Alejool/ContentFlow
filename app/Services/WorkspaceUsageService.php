<?php

namespace App\Services;

use App\Models\Workspace\Workspace;
use App\Models\Subscription\UsageMetric;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class WorkspaceUsageService
{
    /**
     * Increment usage for a specific metric.
     */
    public function incrementUsage(Workspace $workspace, string $metricType, int $amount = 1): void
    {
        $usage = $this->getCurrentUsageMetric($workspace, $metricType);

        if (!$usage) {
            $usage = $this->createUsageMetric($workspace, $metricType);
        }

        $usage->increment('current_usage', $amount);

        Log::info('Usage incremented', [
            'workspace_id' => $workspace->id,
            'metric_type' => $metricType,
            'amount' => $amount,
            'new_usage' => $usage->fresh()->current_usage,
        ]);
    }

    /**
     * Decrement usage for a specific metric.
     */
    public function decrementUsage(Workspace $workspace, string $metricType, int $amount = 1): void
    {
        $usage = $this->getCurrentUsageMetric($workspace, $metricType);

        if ($usage && $usage->current_usage > 0) {
            $usage->decrement('current_usage', $amount);
        }
    }

    /**
     * Get current usage metric for a workspace.
     */
    public function getCurrentUsageMetric(Workspace $workspace, string $metricType): ?UsageMetric
    {
        return $workspace->usageMetrics()
            ->where('metric_type', $metricType)
            ->where('period_start', '<=', now())
            ->where('period_end', '>=', now())
            ->first();
    }

    /**
     * Create usage metric for current period.
     */
    public function createUsageMetric(Workspace $workspace, string $metricType): UsageMetric
    {
        $limits = $workspace->getPlanLimits();
        $limit = $limits[$metricType] ?? 0;

        return $workspace->usageMetrics()->create([
            'metric_type' => $metricType,
            'current_usage' => 0,
            'limit' => $limit,
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
        ]);
    }

    /**
     * Reset monthly usage metrics.
     */
    public function resetMonthlyUsage(Workspace $workspace): void
    {
        $limits = $workspace->getPlanLimits();

        // Métricas que se resetean mensualmente
        $monthlyMetrics = [
            'publications_per_month',
            'ai_requests_per_month',
        ];

        foreach ($monthlyMetrics as $metric) {
            $workspace->usageMetrics()->create([
                'metric_type' => $metric,
                'current_usage' => 0,
                'limit' => $limits[$metric] ?? 0,
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
            ]);
        }

        Log::info('Monthly usage reset', [
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
        ]);
    }

    /**
     * Get usage summary for workspace.
     */
    public function getUsageSummary(Workspace $workspace): array
    {
        $limits = $workspace->getPlanLimits();
        $plan = $workspace->getPlanName();
        $features = $workspace->getPlanFeatures();

        return [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'plan' => $plan,
            ],
            'limits' => $limits,
            'features' => $features,
            'usage' => [
                'publications' => $this->getMetricSummary($workspace, 'publications_per_month'),
                'storage' => $this->getStorageSummary($workspace, $limits['storage_gb']),
                'ai_requests' => $this->getMetricSummary($workspace, 'ai_requests_per_month'),
                'social_accounts' => $this->getSocialAccountsSummary($workspace, $limits['social_accounts']),
                'team_members' => $this->getTeamMembersSummary($workspace, $limits['team_members']),
                'external_integrations' => $this->getIntegrationsSummary($workspace, $limits['external_integrations'] ?? 0),
            ],
        ];
    }

    /**
     * Get metric summary with usage details.
     */
    private function getMetricSummary(Workspace $workspace, string $metricType): array
    {
        $limits = $workspace->getPlanLimits();
        $limit = $limits[$metricType] ?? 0;

        // Calculate current usage
        if ($metricType === 'publications_per_month') {
            $current = $workspace->getMonthlyPostCount();
        } else {
            $usage = $this->getCurrentUsageMetric($workspace, $metricType);
            $current = $usage?->current_usage ?? 0;
        }

        return [
            'current' => $current,
            'limit' => $limit,
            'remaining' => $limit === -1 ? PHP_INT_MAX : max(0, $limit - $current),
            'percentage' => $this->calculatePercentage($current, $limit),
            'unlimited' => $limit === -1,
            'can_perform' => $limit === -1 || $current < $limit,
        ];
    }

    /**
     * Get storage summary.
     */
    private function getStorageSummary(Workspace $workspace, int $limitGB): array
    {
        $usageGB = $workspace->getStorageUsageGB();

        return [
            'current' => $usageGB,
            'limit' => $limitGB,
            'remaining' => max(0, $limitGB - $usageGB),
            'percentage' => $this->calculatePercentage($usageGB, $limitGB),
            'unlimited' => $limitGB === -1,
            'can_perform' => $limitGB === -1 || $usageGB < $limitGB,
            'unit' => 'GB',
        ];
    }

    /**
     * Get social accounts summary.
     */
    private function getSocialAccountsSummary(Workspace $workspace, int $limit): array
    {
        $current = $workspace->socialAccounts()->count();

        return [
            'current' => $current,
            'limit' => $limit,
            'remaining' => $limit === -1 ? PHP_INT_MAX : max(0, $limit - $current),
            'percentage' => $this->calculatePercentage($current, $limit),
            'unlimited' => $limit === -1,
            'can_perform' => $limit === -1 || $current < $limit,
        ];
    }

    /**
     * Get team members summary.
     */
    private function getTeamMembersSummary(Workspace $workspace, int $limit): array
    {
        $current = $workspace->users()->count();

        return [
            'current' => $current,
            'limit' => $limit,
            'remaining' => $limit === -1 ? PHP_INT_MAX : max(0, $limit - $current),
            'percentage' => $this->calculatePercentage($current, $limit),
            'unlimited' => $limit === -1,
            'can_perform' => $limit === -1 || $current < $limit,
        ];
    }

    /**
     * Get external integrations summary.
     */
    private function getIntegrationsSummary(Workspace $workspace, int $limit): array
    {
        // Asumiendo que tienes una relación externalIntegrations en Workspace
        $current = $workspace->externalCalendarConnections()->count();

        return [
            'current' => $current,
            'limit' => $limit,
            'remaining' => $limit === -1 ? PHP_INT_MAX : max(0, $limit - $current),
            'percentage' => $this->calculatePercentage($current, $limit),
            'unlimited' => $limit === -1,
            'can_perform' => $limit === -1 || $current < $limit,
        ];
    }

    /**
     * Calculate percentage of usage.
     */
    private function calculatePercentage(float $current, float $limit): float
    {
        if ($limit === -1 || $limit === 0) {
            return 0;
        }

        return round(($current / $limit) * 100, 2);
    }

    /**
     * Check if workspace can perform action.
     */
    public function canPerformAction(Workspace $workspace, string $limitType): bool
    {
        $limits = $workspace->getPlanLimits();
        $limit = $limits[$limitType] ?? 0;

        // -1 significa ilimitado
        if ($limit === -1) {
            return true;
        }

        // Para métricas mensuales
        if (in_array($limitType, ['publications_per_month', 'ai_requests_per_month'])) {
            $usage = $this->getCurrentUsageMetric($workspace, $limitType);
            $current = $usage?->current_usage ?? 0;
            return $current < $limit;
        }

        // Para storage
        if ($limitType === 'storage_gb') {
            $usageGB = $workspace->getStorageUsageGB();
            return $usageGB < $limit;
        }

        // Para social accounts
        if ($limitType === 'social_accounts') {
            $current = $workspace->socialAccounts()->count();
            return $current < $limit;
        }

        // Para team members
        if ($limitType === 'team_members') {
            $current = $workspace->users()->count();
            return $current < $limit;
        }

        // Para external integrations
        if ($limitType === 'external_integrations') {
            $current = $workspace->externalCalendarConnections()->count();
            return $current < $limit;
        }

        return true;
    }

    /**
     * Get limit reached message.
     */
    public function getLimitReachedMessage(Workspace $workspace, string $limitType): string
    {
        $plan = $workspace->getPlanName();
        $limits = $workspace->getPlanLimits();
        $limit = $limits[$limitType] ?? 0;

        $messages = [
            'publications_per_month' => "Has alcanzado el límite de {$limit} publicaciones por mes del plan {$plan}. Actualiza tu plan para continuar publicando.",
            'ai_requests_per_month' => "Has alcanzado el límite de {$limit} solicitudes de IA por mes del plan {$plan}. Actualiza tu plan para continuar usando IA.",
            'storage_gb' => "Has alcanzado el límite de {$limit}GB de almacenamiento del plan {$plan}. Actualiza tu plan para subir más archivos.",
            'social_accounts' => "Has alcanzado el límite de {$limit} cuentas sociales del plan {$plan}. Actualiza tu plan para conectar más cuentas.",
            'team_members' => "Has alcanzado el límite de {$limit} miembros del plan {$plan}. Actualiza tu plan para agregar más miembros.",
            'external_integrations' => "Has alcanzado el límite de {$limit} integraciones externas del plan {$plan}. Actualiza tu plan para agregar más integraciones.",
        ];

        return $messages[$limitType] ?? "Has alcanzado el límite de tu plan {$plan}. Actualiza para continuar.";
    }
}
