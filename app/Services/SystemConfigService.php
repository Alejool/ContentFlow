<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class SystemConfigService
{
    /**
     * Check if a feature is enabled system-wide
     */
    public function isFeatureEnabled(string $feature): bool
    {
        return SystemSetting::isFeatureEnabled($feature);
    }

    /**
     * Check if a plan is available for new subscriptions
     */
    public function isPlanAvailable(string $plan): bool
    {
        return SystemSetting::isPlanEnabled($plan);
    }

    /**
     * Check if an addon type is available for purchase
     */
    public function isAddonAvailable(string $addonType): bool
    {
        return SystemSetting::isAddonEnabled($addonType);
    }

    /**
     * Check if an integration is enabled
     */
    public function isIntegrationEnabled(string $integration): bool
    {
        return SystemSetting::isIntegrationEnabled($integration);
    }

    /**
     * Get all enabled plans
     */
    public function getEnabledPlans(): array
    {
        $plans = config('plans');
        $enabledPlans = [];

        foreach ($plans as $key => $plan) {
            if ($this->isPlanAvailable($key)) {
                $enabledPlans[$key] = $plan;
            }
        }

        return $enabledPlans;
    }

    /**
     * Get all enabled addons by type
     */
    public function getEnabledAddons(string $type): array
    {
        if (!$this->isAddonAvailable($type)) {
            return [];
        }

        $addons = config("addons.{$type}.packages", []);
        return array_filter($addons, fn($addon) => $addon['enabled'] ?? true);
    }

    /**
     * Filter plans configuration based on system settings
     * NO usar caché aquí porque necesitamos reflejar cambios inmediatamente
     */
    public function getAvailablePlans(): array
    {
        $plans = config('plans');
        $available = [];

        foreach ($plans as $key => $plan) {
            // Verificar si el plan está habilitado en system_settings
            $isEnabledInSystem = $this->isPlanAvailable($key);
            
            // Verificar si el plan está habilitado en config/plans.php
            $isEnabledInConfig = ($plan['enabled'] ?? true);
            
            \Log::info("Plan {$key}: system={$isEnabledInSystem}, config={$isEnabledInConfig}");
            
            if ($isEnabledInSystem && $isEnabledInConfig) {
                $available[$key] = $plan;
            }
        }

        return $available;
    }

    /**
     * Filter addons configuration based on system settings
     * NO usar caché aquí porque necesitamos reflejar cambios inmediatamente
     */
    public function getAvailableAddons(): array
    {
        $addons = config('addons');
        $available = [];

        foreach ($addons as $type => $config) {
            if ($type === 'settings') {
                continue;
            }

            if ($this->isAddonAvailable($type) && ($config['enabled'] ?? true)) {
                $available[$type] = $config;
            }
        }

        return $available;
    }

    /**
     * Check if system is in maintenance mode
     */
    public function isMaintenanceMode(): bool
    {
        return SystemSetting::get('system.maintenance_mode', false);
    }

    /**
     * Check if new registrations are allowed
     */
    public function areRegistrationsEnabled(): bool
    {
        return SystemSetting::get('system.new_registrations', true);
    }

    /**
     * Get system status summary
     */
    public function getSystemStatus(): array
    {
        return [
            'maintenance_mode' => $this->isMaintenanceMode(),
            'registrations_enabled' => $this->areRegistrationsEnabled(),
            'features' => [
                'ai' => $this->isFeatureEnabled('ai'),
                'analytics' => $this->isFeatureEnabled('analytics'),
                'reels' => $this->isFeatureEnabled('reels'),
                'approval_workflows' => $this->isFeatureEnabled('approval_workflows'),
                'calendar_sync' => $this->isFeatureEnabled('calendar_sync'),
                'bulk_operations' => $this->isFeatureEnabled('bulk_operations'),
                'white_label' => $this->isFeatureEnabled('white_label'),
            ],
            'enabled_plans_count' => count($this->getAvailablePlans()),
            'enabled_addons_count' => count($this->getAvailableAddons()),
        ];
    }
}
