<?php

namespace App\Traits;

use App\Models\Workspace\Workspace;
use App\Services\Subscription\PlanLimitValidator;
use App\Exceptions\LimitReachedException;
use App\Exceptions\FeatureNotAvailableException;

trait ChecksSubscriptionLimits
{
    /**
     * Check if workspace can perform action, throw exception if not.
     */
    protected function checkLimit(Workspace $workspace, string $limitType): void
    {
        $validator = app(PlanLimitValidator::class);

        if (!$validator->canPerformAction($workspace, $limitType)) {
            $upgradeMessage = $validator->getUpgradeMessage($workspace, $limitType);
            
            throw new LimitReachedException(
                $upgradeMessage['message'],
                $upgradeMessage
            );
        }
    }

    /**
     * Check if workspace has feature access, throw exception if not.
     */
    protected function checkFeature(Workspace $workspace, string $feature): void
    {
        $validator = app(PlanLimitValidator::class);

        if (!$validator->hasFeatureAccess($workspace, $feature)) {
            $subscription = $workspace->subscription;
            
            throw new FeatureNotAvailableException(
                $feature,
                $subscription?->plan ?? 'free'
            );
        }
    }

    /**
     * Get usage information for a specific limit type.
     */
    protected function getUsageInfo(Workspace $workspace, string $limitType): array
    {
        $validator = app(PlanLimitValidator::class);
        $subscription = $workspace->subscription;
        $limits = $subscription?->getPlanLimits()['limits'] ?? [];

        return [
            'current' => $validator->getCurrentUsage($workspace, $limitType),
            'limit' => $validator->getLimit($limits, $limitType),
            'percentage' => $validator->getUsagePercentage($workspace, $limitType),
            'remaining' => $validator->getRemainingUsage($workspace, $limitType),
            'can_perform' => $validator->canPerformAction($workspace, $limitType),
        ];
    }
}
