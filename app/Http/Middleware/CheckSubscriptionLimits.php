<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Subscription\PlanLimitValidator;
use App\Services\Subscription\LimitNotificationService;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionLimits
{
    public function __construct(
        private PlanLimitValidator $validator,
        private LimitNotificationService $notificationService
    ) {}

    public function handle(Request $request, Closure $next, string $limitType): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $subscription = $workspace->subscription;
        
        if (!$subscription || !$subscription->isActive()) {
            return response()->json([
                'error' => 'No active subscription',
                'upgrade_required' => true,
                'message' => 'Tu suscripción no está activa. Por favor, actualiza tu plan.',
                'redirect_to' => '/subscription/pricing',
            ], 403);
        }

        // Verificar límite específico
        if (!$this->validator->canPerformAction($workspace, $limitType)) {
            $upgradeMessage = $this->validator->getUpgradeMessage($workspace, $limitType);
            $currentUsage = $this->validator->getCurrentUsage($workspace, $limitType);
            $limits = $subscription->getPlanLimits()['limits'] ?? [];
            $limit = $this->validator->getLimit($limits, $limitType);
            
            return response()->json([
                'error' => 'Limit reached',
                'limit_type' => $limitType,
                'current_usage' => $currentUsage,
                'limit' => $limit,
                'upgrade_required' => true,
                'upgrade_message' => $upgradeMessage,
                'redirect_to' => '/subscription/pricing',
            ], 403);
        }

        // Check and send notifications if near limit
        $this->notificationService->checkAndNotify($workspace, $limitType);

        return $next($request);
    }
}
