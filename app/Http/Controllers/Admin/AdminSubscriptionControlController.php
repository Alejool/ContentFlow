<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\Subscription\DemoModeService;
use App\Services\Subscription\SubscriptionControlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminSubscriptionControlController extends Controller
{
    public function __construct(
        private readonly DemoModeService $demoModeService,
        private readonly SubscriptionControlService $subscriptionControlService,
    ) {}

    /**
     * Display the subscription control panel with current settings.
     *
     * Requisito 5.6
     */
    public function index()
    {
        $settings = [
            'demo_mode' => (bool) SystemSetting::getFresh('subscription.demo_mode', false),
            'purchases_enabled' => (bool) SystemSetting::getFresh('subscription.purchases_enabled', true),
            'grace_period_days' => (int) SystemSetting::get('subscription.grace_period_days', 3),
            'max_retry_attempts' => (int) SystemSetting::get('subscription.max_retry_attempts', 3),
            'retry_interval_hours' => (int) SystemSetting::get('subscription.retry_interval_hours', 24),
        ];

        return Inertia::render('Admin/SubscriptionControl/Index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update subscription control settings.
     *
     * Requisito 5.6
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'demo_mode' => 'sometimes|boolean',
            'purchases_enabled' => 'sometimes|boolean',
            'grace_period_days' => 'sometimes|integer|min:1|max:365',
            'max_retry_attempts' => 'sometimes|integer|min:1|max:10',
            'retry_interval_hours' => 'sometimes|integer|min:1|max:168',
        ]);

        $adminUserId = Auth::id();

        // Handle boolean toggles via dedicated service methods for proper event dispatching
        if (array_key_exists('demo_mode', $validated)) {
            if ($validated['demo_mode']) {
                $this->demoModeService->activate($adminUserId);
            } else {
                $this->demoModeService->deactivate($adminUserId);
            }
        }

        if (array_key_exists('purchases_enabled', $validated)) {
            if ($validated['purchases_enabled']) {
                $this->subscriptionControlService->enablePurchases($adminUserId);
            } else {
                $this->subscriptionControlService->disablePurchases($adminUserId);
            }
        }

        // Handle numeric settings directly
        $numericKeys = ['grace_period_days', 'max_retry_attempts', 'retry_interval_hours'];
        foreach ($numericKeys as $key) {
            if (array_key_exists($key, $validated)) {
                SystemSetting::set("subscription.{$key}", $validated[$key], $adminUserId);
            }
        }

        return back()->with('success', 'Configuración de suscripciones actualizada correctamente.');
    }
}
