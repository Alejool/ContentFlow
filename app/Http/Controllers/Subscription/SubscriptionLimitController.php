<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Services\Subscription\PlanLimitValidator;
use App\Services\Subscription\PlanMigrationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubscriptionLimitController extends Controller
{
    public function __construct(
        private PlanLimitValidator $validator,
        private PlanMigrationService $migrationService
    ) {}

    /**
     * Get current usage for all metrics.
     */
    public function getUsage(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $subscription = $workspace->subscription;
        $limits = $this->validator->getPlanLimits($workspace);
        $plan = $subscription?->plan ?? 'free';

        $usage = [
            'success' => true,
            'data' => [
                'period' => [
                    'year' => now()->year,
                    'month' => now()->month,
                    'start' => now()->startOfMonth()->toDateString(),
                    'end' => now()->endOfMonth()->toDateString(),
                ],
                'plan' => $plan,
                'limits_reached' => false, // Will be set to true if any metric is at 100%
            ]
        ];

        $metricTypes = ['publications', 'social_accounts', 'storage', 'ai_requests', 'team_members'];

        $limitsReached = false;

        foreach ($metricTypes as $metricType) {
            $currentLimit = $this->validator->getLimit($limits, $metricType);
            $currentUsageAmount = $this->validator->getCurrentUsage($workspace, $metricType);
            $percentage = $this->validator->getUsagePercentage($workspace, $metricType);

            if ($percentage >= 100) {
                $limitsReached = true;
            }

            if ($metricType === 'storage') {
                $usage['data'][$metricType] = [
                    'used_bytes' => $currentUsageAmount,
                    'used_mb' => round($currentUsageAmount / (1024 * 1024), 2),
                    'used_gb' => round($currentUsageAmount / (1024 * 1024 * 1024), 2),
                    'limit_bytes' => $currentLimit,
                    'limit_gb' => $currentLimit === -1 ? -1 : round($currentLimit / (1024 * 1024 * 1024), 2),
                    'remaining_bytes' => $this->validator->getRemainingUsage($workspace, $metricType),
                    'percentage' => $percentage,
                    'limit_reached' => $percentage >= 100,
                ];
            } else {
                $usage['data'][$metricType] = [
                    'used' => $currentUsageAmount,
                    'limit' => $currentLimit,
                    'remaining' => $this->validator->getRemainingUsage($workspace, $metricType),
                    'percentage' => $percentage,
                    'limit_reached' => $percentage >= 100,
                ];
            }
        }

        $usage['data']['limits_reached'] = $limitsReached;

        return response()->json($usage);
    }

    /**
     * Check if can perform a specific action.
     */
    public function checkLimit(Request $request, string $limitType): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $canPerform = $this->validator->canPerformAction($workspace, $limitType);

        if (!$canPerform) {
            $upgradeMessage = $this->validator->getUpgradeMessage($workspace, $limitType);

            return response()->json([
                'can_perform' => false,
                'upgrade_message' => $upgradeMessage,
            ], 403);
        }

        return response()->json([
            'can_perform' => true,
            'usage_info' => [
                'current' => $this->validator->getCurrentUsage($workspace, $limitType),
                'remaining' => $this->validator->getRemainingUsage($workspace, $limitType),
            ],
        ]);
    }

    /**
     * Check if workspace can downgrade to a specific plan.
     */
    public function checkDowngrade(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => 'required|string|in:free,starter,professional,enterprise',
        ]);

        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $result = $this->migrationService->canDowngradeTo($workspace, $request->plan);

        return response()->json($result);
    }

    /**
     * Get available features for current plan.
     */
    public function getFeatures(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $subscription = $workspace->subscription;
        $plan = $subscription?->plan ?? 'free';
        $features = config("plans.{$plan}.features", []);

        return response()->json([
            'plan' => $plan,
            'features' => $features,
        ]);
    }
}
