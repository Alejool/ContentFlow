<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Services\Subscription\PlanLimitValidator;
use App\Services\Subscription\PlanMigrationService;
use App\Services\WorkspaceAddonService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubscriptionLimitController extends Controller
{
    public function __construct(
        private PlanLimitValidator $validator,
        private PlanMigrationService $migrationService,
        private WorkspaceAddonService $addonService,
        private \App\Services\Subscription\UsageLimitsNotificationService $limitsNotificationService
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

        // Use cached data to avoid expensive calculations on every request
        $usage = $this->limitsNotificationService->getCachedLimitsData($workspace);

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
            'plan' => 'required|string|in:free,starter,growth,professional,enterprise',
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
        $plan = $workspace->getPlanName();
        $features = config("plans.{$plan}.features", []);

        return response()->json([
            'plan' => $plan,
            'features' => $features,
        ]);
    }

    /**
     * Force refresh limits and broadcast via WebSocket.
     */
    public function refreshLimits(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        // Force refresh limits and broadcast
        $this->limitsNotificationService->notifyLimitsUpdated($workspace, 'manual_refresh');

        return response()->json([
            'success' => true,
            'message' => 'Limits refreshed and broadcasted successfully',
            'workspace_id' => $workspace->id,
        ]);
    }
}