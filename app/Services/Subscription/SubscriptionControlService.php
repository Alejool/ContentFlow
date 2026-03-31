<?php

namespace App\Services\Subscription;

use App\Events\ConfigurationChanged;
use App\Models\SystemSetting;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\DTOs\PurchaseEligibility;
use App\Services\SystemConfigService;
use Illuminate\Support\Facades\Event;

class SubscriptionControlService
{
    public function __construct(
        private readonly DemoModeService $demoModeService,
        private readonly SystemConfigService $systemConfigService,
    ) {}

    /**
     * Check if purchases are enabled system-wide.
     * Uses getFresh() to bypass cache and reflect changes immediately.
     * Returns false if demo mode is active, regardless of the purchases_enabled setting.
     *
     * Requisitos: 1.3, 2.6, 5.3
     */
    public function arePurchasesEnabled(): bool
    {
        if ($this->demoModeService->isActive()) {
            return false;
        }

        return (bool) SystemSetting::getFresh('subscription.purchases_enabled', true);
    }

    /**
     * Determine if a purchase flow can be initiated.
     * Combines demo_mode and purchases_enabled checks.
     *
     * Requisitos: 1.2, 1.3, 2.2, 2.4
     */
    public function canInitiatePurchase(?Workspace $workspace = null): PurchaseEligibility
    {
        if ($this->demoModeService->isActive()) {
            return new PurchaseEligibility(
                canPurchase: false,
                reason: 'Las compras están temporalmente deshabilitadas (modo demo activo).',
                errorCode: 'DEMO_MODE_ACTIVE',
            );
        }

        $purchasesEnabled = (bool) SystemSetting::getFresh('subscription.purchases_enabled', true);

        if (! $purchasesEnabled) {
            return new PurchaseEligibility(
                canPurchase: false,
                reason: 'Las compras están temporalmente deshabilitadas.',
                errorCode: 'PURCHASES_DISABLED',
            );
        }

        return new PurchaseEligibility(
            canPurchase: true,
            reason: null,
            errorCode: null,
        );
    }

    /**
     * Get the list of plans available for purchase.
     * Returns only ['free'] when demo mode is active.
     * Otherwise delegates to SystemConfigService for enabled plans.
     *
     * Requisitos: 1.2
     */
    public function getAvailablePlansForPurchase(): array
    {
        if ($this->demoModeService->isActive()) {
            return ['free'];
        }

        $enabledPlans = $this->systemConfigService->getAvailablePlans();

        if (empty($enabledPlans)) {
            return ['free', 'starter', 'growth', 'professional', 'enterprise'];
        }

        return array_keys($enabledPlans);
    }

    /**
     * Check if a workspace can access its active paid plan.
     * Returns true if the workspace has an active paid subscription,
     * regardless of demo_mode or purchases_enabled.
     *
     * Requisitos: 1.5, 2.3
     */
    public function canAccessActivePlan(Workspace $workspace): bool
    {
        $subscription = $workspace->subscription;

        if (! $subscription) {
            return false;
        }

        if (! $subscription->isActive()) {
            return false;
        }

        $plan = $subscription->plan ?? 'free';
        $planConfig = config("plans.{$plan}");

        // A paid plan has a price > 0
        $price = $planConfig['price'] ?? 0;

        return $price > 0;
    }

    /**
     * Enable purchases system-wide.
     *
     * Requisitos: 2.5
     */
    public function enablePurchases(int $adminUserId): void
    {
        SystemSetting::set('subscription.purchases_enabled', true, $adminUserId);

        Event::dispatch(new ConfigurationChanged(
            action: 'purchases.enabled',
            newValues: ['subscription.purchases_enabled' => true],
            metadata: ['admin_user_id' => $adminUserId],
        ));
    }

    /**
     * Disable purchases system-wide.
     *
     * Requisitos: 2.1
     */
    public function disablePurchases(int $adminUserId): void
    {
        SystemSetting::set('subscription.purchases_enabled', false, $adminUserId);

        Event::dispatch(new ConfigurationChanged(
            action: 'purchases.disabled',
            newValues: ['subscription.purchases_enabled' => false],
            metadata: ['admin_user_id' => $adminUserId],
        ));
    }
}
