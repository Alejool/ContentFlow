<?php

namespace App\Services\Subscription;

use App\Models\Workspace\Workspace;
use App\Models\Subscription\UsageMetric;
use Illuminate\Support\Facades\Cache;

class PlanLimitValidator
{
    /**
     * Check if workspace can perform a specific action.
     */
    public function canPerformAction(Workspace $workspace, string $limitType): bool
    {
        $subscription = $workspace->subscription;
        
        if (!$subscription || !$subscription->isActive()) {
            return false;
        }

        $limits = $subscription->getPlanLimits()['limits'] ?? [];
        $limit = $this->getLimit($limits, $limitType);

        // -1 significa ilimitado
        if ($limit === -1) {
            return true;
        }

        $currentUsage = $this->getCurrentUsage($workspace, $limitType);
        
        return $currentUsage < $limit;
    }

    /**
     * Check if workspace has access to a specific feature.
     */
    public function hasFeatureAccess(Workspace $workspace, string $feature): bool
    {
        $subscription = $workspace->subscription;
        
        if (!$subscription || !$subscription->isActive()) {
            return false;
        }

        return $subscription->hasFeature($feature);
    }

    /**
     * Get current usage for a specific limit type.
     */
    public function getCurrentUsage(Workspace $workspace, string $limitType): int
    {
        return match($limitType) {
            'publications' => $this->getPublicationsUsage($workspace),
            'social_accounts' => $this->getSocialAccountsUsage($workspace),
            'storage' => $this->getStorageUsage($workspace),
            'ai_requests' => $this->getAiRequestsUsage($workspace),
            'team_members' => $this->getTeamMembersUsage($workspace),
            'workspaces' => $this->getWorkspacesUsage($workspace),
            default => 0,
        };
    }

    /**
     * Get limit value for a specific type.
     */
    public function getLimit(array $limits, string $limitType): int
    {
        return match($limitType) {
            'publications' => $limits['publications_per_month'] ?? 0,
            'social_accounts' => $limits['social_accounts'] ?? 0,
            'storage' => $limits['storage_gb'] ?? 0,
            'ai_requests' => $limits['ai_requests_per_month'] ?? 0,
            'team_members' => $limits['team_members'] ?? 0,
            'workspaces' => $limits['workspaces'] ?? 0,
            default => 0,
        };
    }

    /**
     * Get usage percentage for a specific limit type.
     */
    public function getUsagePercentage(Workspace $workspace, string $limitType): float
    {
        $subscription = $workspace->subscription;
        
        if (!$subscription) {
            return 0;
        }

        $limits = $subscription->getPlanLimits()['limits'] ?? [];
        $limit = $this->getLimit($limits, $limitType);

        if ($limit === -1) {
            return 0; // Ilimitado
        }

        if ($limit === 0) {
            return 100;
        }

        $currentUsage = $this->getCurrentUsage($workspace, $limitType);
        
        return min(100, ($currentUsage / $limit) * 100);
    }

    /**
     * Get remaining usage for a specific limit type.
     */
    public function getRemainingUsage(Workspace $workspace, string $limitType): int
    {
        $subscription = $workspace->subscription;
        
        if (!$subscription) {
            return 0;
        }

        $limits = $subscription->getPlanLimits()['limits'] ?? [];
        $limit = $this->getLimit($limits, $limitType);

        if ($limit === -1) {
            return -1; // Ilimitado
        }

        $currentUsage = $this->getCurrentUsage($workspace, $limitType);
        
        return max(0, $limit - $currentUsage);
    }

    /**
     * Check if usage is near limit (default 80%).
     */
    public function isNearLimit(Workspace $workspace, string $limitType, int $threshold = 80): bool
    {
        return $this->getUsagePercentage($workspace, $limitType) >= $threshold;
    }

    /**
     * Get upgrade message for a specific limit type.
     */
    public function getUpgradeMessage(Workspace $workspace, string $limitType): array
    {
        $subscription = $workspace->subscription;
        $currentPlan = $subscription?->plan ?? 'free';

        $messages = [
            'publications' => [
                'title' => 'Límite de publicaciones alcanzado',
                'message' => 'Has alcanzado el límite de publicaciones mensuales de tu plan.',
                'action' => 'Actualiza tu plan para publicar más contenido.',
            ],
            'social_accounts' => [
                'title' => 'Límite de cuentas sociales alcanzado',
                'message' => 'Has conectado el máximo de cuentas sociales permitidas.',
                'action' => 'Actualiza tu plan para conectar más cuentas.',
            ],
            'storage' => [
                'title' => 'Límite de almacenamiento alcanzado',
                'message' => 'Has alcanzado el límite de almacenamiento de tu plan.',
                'action' => 'Actualiza tu plan para obtener más espacio.',
            ],
            'ai_requests' => [
                'title' => 'Límite de solicitudes IA alcanzado',
                'message' => 'Has usado todas tus solicitudes de IA este mes.',
                'action' => 'Actualiza tu plan para solicitudes ilimitadas.',
            ],
            'team_members' => [
                'title' => 'Límite de miembros del equipo alcanzado',
                'message' => 'Has alcanzado el máximo de miembros permitidos.',
                'action' => 'Actualiza tu plan para agregar más miembros.',
            ],
        ];

        $message = $messages[$limitType] ?? [
            'title' => 'Límite alcanzado',
            'message' => 'Has alcanzado un límite de tu plan actual.',
            'action' => 'Actualiza tu plan para continuar.',
        ];

        $message['current_plan'] = $currentPlan;
        $message['suggested_plan'] = $this->getSuggestedPlan($currentPlan);
        
        return $message;
    }

    /**
     * Get suggested plan for upgrade.
     */
    private function getSuggestedPlan(string $currentPlan): string
    {
        return match($currentPlan) {
            'free' => 'starter',
            'demo' => 'starter',
            'starter' => 'professional',
            'professional' => 'enterprise',
            default => 'professional',
        };
    }

    /**
     * Get publications usage from usage metrics.
     */
    private function getPublicationsUsage(Workspace $workspace): int
    {
        $metric = $workspace->getUsageMetric('publications');
        return $metric?->current_usage ?? 0;
    }

    /**
     * Get social accounts usage (count of connected accounts).
     */
    private function getSocialAccountsUsage(Workspace $workspace): int
    {
        return Cache::remember(
            "workspace.{$workspace->id}.social_accounts.count",
            now()->addMinutes(5),
            fn() => $workspace->socialAccounts()->count()
        );
    }

    /**
     * Get storage usage in GB.
     */
    private function getStorageUsage(Workspace $workspace): int
    {
        return (int) $workspace->getStorageUsageGB();
    }

    /**
     * Get AI requests usage from usage metrics.
     */
    private function getAiRequestsUsage(Workspace $workspace): int
    {
        $metric = $workspace->getUsageMetric('ai_requests');
        return $metric?->current_usage ?? 0;
    }

    /**
     * Get team members usage (count of workspace users).
     */
    private function getTeamMembersUsage(Workspace $workspace): int
    {
        return Cache::remember(
            "workspace.{$workspace->id}.team_members.count",
            now()->addMinutes(5),
            fn() => $workspace->users()->count()
        );
    }

    /**
     * Get workspaces usage (count of user's workspaces).
     */
    private function getWorkspacesUsage(Workspace $workspace): int
    {
        $owner = $workspace->owner();
        
        if (!$owner) {
            return 0;
        }

        return Cache::remember(
            "user.{$owner->id}.workspaces.count",
            now()->addMinutes(5),
            fn() => $owner->workspaces()->count()
        );
    }
}
