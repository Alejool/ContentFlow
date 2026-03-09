<?php

namespace App\Services\Subscription;

use App\Models\Workspace\Workspace;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Validador de límites granulares.
 * Extiende la funcionalidad de PlanLimitValidator con límites más específicos.
 */
class GranularLimitValidator
{
    /**
     * Get granular limits for a workspace.
     */
    public function getGranularLimits(Workspace $workspace): array
    {
        $plan = $workspace->subscription?->plan ?? 'demo';
        return config("rate_limits.{$plan}", config('rate_limits.demo', []));
    }

    /**
     * Check if workspace can publish today (daily limit).
     */
    public function canPublishToday(Workspace $workspace): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $dailyLimit = $limits['publications_per_day'] ?? 0;

        if ($dailyLimit === -1) {
            return true;
        }

        $todayCount = $this->getTodayPublicationsCount($workspace);
        return $todayCount < $dailyLimit;
    }

    /**
     * Get today's publications count.
     */
    public function getTodayPublicationsCount(Workspace $workspace): int
    {
        return Cache::remember(
            "workspace.{$workspace->id}.publications.today",
            now()->addMinutes(5),
            fn() => $workspace->publications()
                ->whereDate('created_at', today())
                ->count()
        );
    }

    /**
     * Check if workspace can have more simultaneous publications.
     */
    public function canPublishSimultaneously(Workspace $workspace): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $simultaneousLimit = $limits['publications_simultaneous'] ?? 1;

        if ($simultaneousLimit === -1) {
            return true;
        }

        $currentPublishing = $this->getCurrentPublishingCount($workspace);
        return $currentPublishing < $simultaneousLimit;
    }

    /**
     * Get count of publications currently being published.
     */
    public function getCurrentPublishingCount(Workspace $workspace): int
    {
        return $workspace->publications()
            ->where('status', 'publishing')
            ->count();
    }

    /**
     * Check API rate limit (requests per minute).
     */
    public function checkApiRateLimit(Workspace $workspace, string $endpoint = 'general'): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $perMinute = $limits['api_requests_per_minute'] ?? 10;

        if ($perMinute === -1) {
            return true;
        }

        $key = "api_rate_limit.{$workspace->id}.{$endpoint}.minute";
        $current = Cache::get($key, 0);

        if ($current >= $perMinute) {
            return false;
        }

        Cache::put($key, $current + 1, now()->addMinute());
        return true;
    }

    /**
     * Check API rate limit (requests per hour).
     */
    public function checkApiRateLimitHourly(Workspace $workspace, string $endpoint = 'general'): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $perHour = $limits['api_requests_per_hour'] ?? 100;

        if ($perHour === -1) {
            return true;
        }

        $key = "api_rate_limit.{$workspace->id}.{$endpoint}.hour";
        $current = Cache::get($key, 0);

        if ($current >= $perHour) {
            return false;
        }

        Cache::put($key, $current + 1, now()->addHour());
        return true;
    }

    /**
     * Check if workspace can create more campaigns.
     */
    public function canCreateCampaign(Workspace $workspace): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $campaignLimit = $limits['active_campaigns'] ?? 1;

        if ($campaignLimit === -1) {
            return true;
        }

        $activeCampaigns = $this->getActiveCampaignsCount($workspace);
        return $activeCampaigns < $campaignLimit;
    }

    /**
     * Get active campaigns count.
     */
    public function getActiveCampaignsCount(Workspace $workspace): int
    {
        return Cache::remember(
            "workspace.{$workspace->id}.campaigns.active",
            now()->addMinutes(5),
            fn() => $workspace->campaigns()
                ->where('status', 'active')
                ->count()
        );
    }

    /**
     * Check if workspace can create more approval workflows.
     */
    public function canCreateApprovalWorkflow(Workspace $workspace): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $workflowLimit = $limits['approval_workflows'] ?? 0;

        if ($workflowLimit === -1) {
            return true;
        }

        if ($workflowLimit === 0) {
            return false;
        }

        $activeWorkflows = $this->getApprovalWorkflowsCount($workspace);
        return $activeWorkflows < $workflowLimit;
    }

    /**
     * Get approval workflows count.
     */
    public function getApprovalWorkflowsCount(Workspace $workspace): int
    {
        return Cache::remember(
            "workspace.{$workspace->id}.workflows.count",
            now()->addMinutes(5),
            fn() => $workspace->approvalWorkflows()->count()
        );
    }

    /**
     * Check if workspace can add external integration.
     */
    public function canAddExternalIntegration(Workspace $workspace, string $type): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $integrationLimits = $limits['external_integrations'] ?? [];
        
        $limitKey = match($type) {
            'discord' => 'discord_webhooks',
            'slack' => 'slack_webhooks',
            'webhook' => 'custom_webhooks',
            default => 'custom_webhooks',
        };

        $limit = $integrationLimits[$limitKey] ?? 0;

        if ($limit === -1) {
            return true;
        }

        if ($limit === 0) {
            return false;
        }

        $currentCount = $this->getExternalIntegrationsCount($workspace, $type);
        return $currentCount < $limit;
    }

    /**
     * Get external integrations count by type.
     */
    public function getExternalIntegrationsCount(Workspace $workspace, string $type): int
    {
        return Cache::remember(
            "workspace.{$workspace->id}.integrations.{$type}",
            now()->addMinutes(5),
            fn() => $workspace->externalIntegrations()
                ->where('type', $type)
                ->where('is_active', true)
                ->count()
        );
    }

    /**
     * Check if user can export this month.
     */
    public function canExport(Workspace $workspace): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $exportLimit = $limits['exports_per_month'] ?? 5;

        if ($exportLimit === -1) {
            return true;
        }

        $monthlyExports = $this->getMonthlyExportsCount($workspace);
        return $monthlyExports < $exportLimit;
    }

    /**
     * Get monthly exports count.
     */
    public function getMonthlyExportsCount(Workspace $workspace): int
    {
        return Cache::remember(
            "workspace.{$workspace->id}.exports.monthly",
            now()->addMinutes(10),
            fn() => DB::table('export_logs')
                ->where('workspace_id', $workspace->id)
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count()
        );
    }

    /**
     * Get max export rows allowed.
     */
    public function getMaxExportRows(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        return $limits['export_max_rows'] ?? 1000;
    }

    /**
     * Check if user can create more workspaces.
     */
    public function canCreateWorkspace(User $user): bool
    {
        // Get limits from user's primary workspace or first workspace
        $workspace = $user->workspaces()->first();
        
        if (!$workspace) {
            return true; // Allow first workspace
        }

        $limits = $this->getGranularLimits($workspace);
        $workspaceLimit = $limits['workspaces_per_user'] ?? 1;

        if ($workspaceLimit === -1) {
            return true;
        }

        $currentWorkspaces = $user->workspaces()->count();
        return $currentWorkspaces < $workspaceLimit;
    }

    /**
     * Check if file size is within limits.
     */
    public function canUploadFileSize(Workspace $workspace, int $fileSizeBytes): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $maxSizeMB = $limits['max_file_size_mb'] ?? 50;

        if ($maxSizeMB === -1) {
            return true;
        }

        $maxSizeBytes = $maxSizeMB * 1024 * 1024;
        return $fileSizeBytes <= $maxSizeBytes;
    }

    /**
     * Get max file size in bytes.
     */
    public function getMaxFileSize(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        $maxSizeMB = $limits['max_file_size_mb'] ?? 50;

        if ($maxSizeMB === -1) {
            return PHP_INT_MAX;
        }

        return $maxSizeMB * 1024 * 1024;
    }

    /**
     * Check if video duration is within limits.
     */
    public function canUploadVideoDuration(Workspace $workspace, int $durationMinutes): bool
    {
        $limits = $this->getGranularLimits($workspace);
        $maxDuration = $limits['max_video_duration_minutes'] ?? 5;

        if ($maxDuration === -1) {
            return true;
        }

        return $durationMinutes <= $maxDuration;
    }

    /**
     * Get max video duration in minutes.
     */
    public function getMaxVideoDuration(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        return $limits['max_video_duration_minutes'] ?? 5;
    }

    /**
     * Get remaining count for a specific limit type.
     */
    public function getRemainingCount(Workspace $workspace, string $limitType): int
    {
        $limits = $this->getGranularLimits($workspace);
        
        return match($limitType) {
            'publications_per_day' => $this->getRemainingDailyPublications($workspace),
            'publications_simultaneous' => $this->getRemainingSimultaneousSlots($workspace),
            'active_campaigns' => $this->getRemainingCampaigns($workspace),
            'approval_workflows' => $this->getRemainingWorkflows($workspace),
            'exports_per_month' => $this->getRemainingExports($workspace),
            default => 0,
        };
    }

    private function getRemainingDailyPublications(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        $limit = $limits['publications_per_day'] ?? 0;
        
        if ($limit === -1) return -1;
        
        $used = $this->getTodayPublicationsCount($workspace);
        return max(0, $limit - $used);
    }

    private function getRemainingSimultaneousSlots(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        $limit = $limits['publications_simultaneous'] ?? 1;
        
        if ($limit === -1) return -1;
        
        $used = $this->getCurrentPublishingCount($workspace);
        return max(0, $limit - $used);
    }

    private function getRemainingCampaigns(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        $limit = $limits['active_campaigns'] ?? 1;
        
        if ($limit === -1) return -1;
        
        $used = $this->getActiveCampaignsCount($workspace);
        return max(0, $limit - $used);
    }

    private function getRemainingWorkflows(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        $limit = $limits['approval_workflows'] ?? 0;
        
        if ($limit === -1) return -1;
        
        $used = $this->getApprovalWorkflowsCount($workspace);
        return max(0, $limit - $used);
    }

    private function getRemainingExports(Workspace $workspace): int
    {
        $limits = $this->getGranularLimits($workspace);
        $limit = $limits['exports_per_month'] ?? 5;
        
        if ($limit === -1) return -1;
        
        $used = $this->getMonthlyExportsCount($workspace);
        return max(0, $limit - $used);
    }

    /**
     * Clear all caches for a workspace.
     */
    public function clearAllCaches(Workspace $workspace): void
    {
        $keys = [
            "workspace.{$workspace->id}.publications.today",
            "workspace.{$workspace->id}.campaigns.active",
            "workspace.{$workspace->id}.workflows.count",
            "workspace.{$workspace->id}.exports.monthly",
            "workspace.{$workspace->id}.integrations.discord",
            "workspace.{$workspace->id}.integrations.slack",
            "workspace.{$workspace->id}.integrations.webhook",
        ];

        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }
}
