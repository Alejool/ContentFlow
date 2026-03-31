<?php

namespace App\Services\Subscription;

use App\Events\ConfigurationChanged;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Event;

class DemoModeService
{
    /**
     * Check if demo mode is currently active.
     * Uses getFresh() to bypass cache and reflect changes immediately.
     *
     * Requisito 1.6
     */
    public function isActive(): bool
    {
        return (bool) SystemSetting::getFresh('subscription.demo_mode', false);
    }

    /**
     * Activate demo mode.
     * Persists the setting and fires ConfigurationChanged for audit logging.
     *
     * Requisito 1.1
     */
    public function activate(int $adminUserId): void
    {
        SystemSetting::set('subscription.demo_mode', true, $adminUserId);

        Event::dispatch(new ConfigurationChanged(
            action: 'demo_mode.activated',
            newValues: ['subscription.demo_mode' => true],
            metadata: ['admin_user_id' => $adminUserId],
        ));
    }

    /**
     * Deactivate demo mode.
     * Persists the setting and fires ConfigurationChanged for audit logging.
     *
     * Requisito 1.4
     */
    public function deactivate(int $adminUserId): void
    {
        SystemSetting::set('subscription.demo_mode', false, $adminUserId);

        Event::dispatch(new ConfigurationChanged(
            action: 'demo_mode.deactivated',
            newValues: ['subscription.demo_mode' => false],
            metadata: ['admin_user_id' => $adminUserId],
        ));
    }
}
