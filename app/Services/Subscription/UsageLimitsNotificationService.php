<?php

namespace App\Services\Subscription;

use App\Models\Workspace\Workspace;
use App\Events\Subscription\UsageLimitsUpdated;
use App\Services\Subscription\PlanLimitValidator;
use App\Services\WorkspaceAddonService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class UsageLimitsNotificationService
{
    public function __construct(
        private PlanLimitValidator $validator,
        private WorkspaceAddonService $addonService
    ) {}

    /**
     * Notify workspace about updated usage limits via WebSocket.
     */
    public function notifyLimitsUpdated(Workspace $workspace, string $triggerAction = 'usage_updated'): void
    {
        $limitsData = $this->buildLimitsData($workspace);
        
        // Broadcast to WebSocket channel
        event(new UsageLimitsUpdated($workspace, $limitsData, $triggerAction));
        
        // Update cache for immediate API responses
        $this->updateLimitsCache($workspace, $limitsData);
        
        Log::info('Usage limits updated via WebSocket', [
            'workspace_id' => $workspace->id,
            'trigger_action' => $triggerAction,
            'limits_count' => count($limitsData),
        ]);
    }

    /**
     * Build complete limits data structure.
     */
    private function buildLimitsData(Workspace $workspace): array
    {
        $subscription = $workspace->subscription;
        $limits = $this->validator->getPlanLimits($workspace);
        $plan = $workspace->getPlanName();

        $data = [
            'success' => true,
            'data' => [
                'period' => [
                    'year' => now()->year,
                    'month' => now()->month,
                    'start' => now()->startOfMonth()->toDateString(),
                    'end' => now()->endOfMonth()->toDateString(),
                ],
                'plan' => $plan,
                'limits_reached' => false,
            ]
        ];

        $metricTypes = ['publications', 'social_accounts', 'storage', 'ai_requests', 'team_members'];
        $limitsReached = false;

        foreach ($metricTypes as $metricType) {
            $baseLimit = $this->validator->getLimit($limits, $metricType);
            $totalAvailable = $this->validator->getTotalAvailableWithAddons($workspace, $metricType, $limits);
            $currentUsageAmount = $this->validator->getCurrentUsage($workspace, $metricType);
            
            // Calculate percentage based on total available (plan + addons)
            $percentage = 0;
            if ($totalAvailable > 0) {
                $percentage = ($currentUsageAmount / $totalAvailable) * 100;
            } elseif ($totalAvailable === -1) {
                $percentage = 0; // Unlimited
            } else {
                $percentage = $currentUsageAmount > 0 ? 100 : 0;
            }

            if ($percentage >= 100) {
                $limitsReached = true;
            }

            // Get addon information
            $addonInfo = null;
            $addonTypeMap = [
                'ai_requests' => 'ai_credits',
                'storage' => 'storage',
                'publications' => 'publications',
                'team_members' => 'team_members',
            ];

            $addonType = $addonTypeMap[$metricType] ?? null;
            if ($addonType) {
                $addonBalance = $this->addonService->getAddonBalance($workspace, $addonType);
                if ($addonBalance['total'] > 0) {
                    $addonInfo = [
                        'type' => $addonType,
                        'total' => $addonBalance['total'],
                        'used' => $addonBalance['used'],
                        'remaining' => $addonBalance['remaining'],
                    ];
                }
            }

            if ($metricType === 'storage') {
                $data['data'][$metricType] = [
                    'used_bytes' => $currentUsageAmount,
                    'used_mb' => round($currentUsageAmount / (1024 * 1024), 2),
                    'used_gb' => round($currentUsageAmount / (1024 * 1024 * 1024), 2),
                    'limit_bytes' => $baseLimit,
                    'limit_gb' => $baseLimit === -1 ? -1 : round($baseLimit / (1024 * 1024 * 1024), 2),
                    'total_available_bytes' => $totalAvailable,
                    'total_available_gb' => $totalAvailable === -1 ? -1 : round($totalAvailable / (1024 * 1024 * 1024), 2),
                    'remaining_bytes' => $totalAvailable === -1 ? -1 : max(0, $totalAvailable - $currentUsageAmount),
                    'percentage' => round($percentage, 1),
                    'limit_reached' => $percentage >= 100,
                    'addon_info' => $addonInfo,
                ];
            } else {
                $data['data'][$metricType] = [
                    'used' => $currentUsageAmount,
                    'limit' => $baseLimit,
                    'total_available' => $totalAvailable,
                    'remaining' => $totalAvailable === -1 ? -1 : max(0, $totalAvailable - $currentUsageAmount),
                    'percentage' => round($percentage, 1),
                    'limit_reached' => $percentage >= 100,
                    'addon_info' => $addonInfo,
                ];
            }
        }

        $data['data']['limits_reached'] = $limitsReached;

        return $data;
    }

    /**
     * Update cache with latest limits data.
     */
    private function updateLimitsCache(Workspace $workspace, array $limitsData): void
    {
        $cacheKey = "workspace.{$workspace->id}.limits.usage";
        Cache::put($cacheKey, $limitsData, now()->addMinutes(30));
    }

    /**
     * Get cached limits data or build fresh.
     */
    public function getCachedLimitsData(Workspace $workspace): array
    {
        $cacheKey = "workspace.{$workspace->id}.limits.usage";
        
        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($workspace) {
            return $this->buildLimitsData($workspace);
        });
    }
}