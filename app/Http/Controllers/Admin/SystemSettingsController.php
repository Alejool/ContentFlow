<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SystemSettingsController extends Controller
{
    /**
     * Display the admin dashboard
     */
    public function dashboard()
    {
        $systemStatus = [
            'plans' => [
                'free' => SystemSetting::isPlanEnabled('free'),
                'starter' => SystemSetting::isPlanEnabled('starter'),
                'growth' => SystemSetting::isPlanEnabled('growth'),
                'professional' => SystemSetting::isPlanEnabled('professional'),
                'enterprise' => SystemSetting::isPlanEnabled('enterprise'),
                'demo' => SystemSetting::isPlanEnabled('demo'),
            ],
            'addons' => [
                'ai_credits' => SystemSetting::isAddonEnabled('ai_credits'),
                'storage' => SystemSetting::isAddonEnabled('storage'),
                'team_members' => SystemSetting::isAddonEnabled('team_members'),
                'publications' => SystemSetting::isAddonEnabled('publications'),
            ],
            'features' => [
                'ai' => SystemSetting::isFeatureEnabled('ai'),
                'analytics' => SystemSetting::isFeatureEnabled('analytics'),
                'reels' => SystemSetting::isFeatureEnabled('reels'),
                'approval_workflows' => SystemSetting::isFeatureEnabled('approval_workflows'),
                'calendar_sync' => SystemSetting::isFeatureEnabled('calendar_sync'),
                'bulk_operations' => SystemSetting::isFeatureEnabled('bulk_operations'),
                'white_label' => SystemSetting::isFeatureEnabled('white_label'),
            ],
            'integrations' => [
                'rss' => SystemSetting::isIntegrationEnabled('rss'),
                'zapier' => SystemSetting::isIntegrationEnabled('zapier'),
                'google_drive' => SystemSetting::isIntegrationEnabled('google_drive'),
                'dropbox' => SystemSetting::isIntegrationEnabled('dropbox'),
                'slack' => SystemSetting::isIntegrationEnabled('slack'),
            ],
            'payment_methods' => [
                'stripe' => SystemSetting::isPaymentMethodEnabled('stripe'),
                'wompi' => SystemSetting::isPaymentMethodEnabled('wompi'),
                'mercadopago' => SystemSetting::isPaymentMethodEnabled('mercadopago'),
                'payu' => SystemSetting::isPaymentMethodEnabled('payu'),
                'epayco' => SystemSetting::isPaymentMethodEnabled('epayco'),
            ],
            'general' => [
                'maintenance_mode' => SystemSetting::get('system.maintenance_mode', false),
                'new_registrations' => SystemSetting::get('system.new_registrations', true),
            ],
        ];

        // Opcional: agregar estadísticas del sistema
        $stats = [
            'total_users' => \App\Models\User::count(),
            'active_subscriptions' => \App\Models\Subscription\Subscription::where('stripe_status', 'active')->count(),
            'total_publications' => \App\Models\Publications\Publication::count(),
            'system_health' => 'healthy',
        ];

        return Inertia::render('Admin/Dashboard', [
            'systemStatus' => $systemStatus,
            'stats' => $stats,
        ]);
    }

    /**
     * Display the system settings page
     */
    public function index()
    {
        $settings = SystemSetting::with('updatedBy:id,name')
            ->orderBy('category')
            ->orderBy('label')
            ->get()
            ->groupBy('category')
            ->map(function ($categorySettings) {
                return $categorySettings->map(function ($setting) {
                    return [
                        'id' => $setting->id,
                        'key' => $setting->key,
                        'value' => $this->castValue($setting->value, $setting->type),
                        'type' => $setting->type,
                        'label' => $setting->label,
                        'description' => $setting->description,
                        'updated_at' => $setting->updated_at,
                        'updated_by' => $setting->updatedBy?->name,
                    ];
                });
            });

        return Inertia::render('Admin/SystemSettings', [
            'settings' => $settings,
            'categories' => [
                'plans' => 'Planes de Suscripción',
                'addons' => 'Add-ons',
                'features' => 'Características',
                'integrations' => 'Integraciones',
                'payment_methods' => 'Métodos de Pago',
                'general' => 'General',
            ],
        ]);
    }

    /**
     * Update a system setting
     */
    public function update(Request $request, SystemSetting $setting)
    {
        $validated = $request->validate([
            'value' => 'required',
        ]);

        $setting->value = $this->prepareValue($validated['value'], $setting->type);
        $setting->updated_by = Auth::id();
        $setting->save();

        // Log the change
        \Log::info('System setting updated', [
            'user_id' => Auth::id(),
            'setting_id' => $setting->id,
            'key' => $setting->key,
            'old_value' => $setting->getOriginal('value'),
            'new_value' => $setting->value,
        ]);

        return back()->with('success', 'Configuración actualizada correctamente');
    }

    /**
     * Bulk update settings
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.id' => 'required|exists:system_settings,id',
            'settings.*.value' => 'required',
        ]);

        $updated = [];
        
        foreach ($validated['settings'] as $settingData) {
            $setting = SystemSetting::find($settingData['id']);
            
            if ($setting) {
                $oldValue = $setting->value;
                $setting->value = $this->prepareValue($settingData['value'], $setting->type);
                $setting->updated_by = Auth::id();
                $setting->save();

                $updated[] = [
                    'key' => $setting->key,
                    'old_value' => $oldValue,
                    'new_value' => $setting->value,
                ];
            }
        }

        // Log bulk change
        \Log::info('System settings bulk updated', [
            'user_id' => Auth::id(),
            'updated' => $updated
        ]);

        // Limpiar caché adicional para asegurar que los cambios se reflejen inmediatamente
        \Artisan::call('system:clear-config-cache');

        return back()->with('success', count($updated) . ' configuraciones actualizadas correctamente');
    }

    /**
     * Get current system status
     */
    public function status()
    {
        return response()->json([
            'plans' => [
                'free' => SystemSetting::isPlanEnabled('free'),
                'starter' => SystemSetting::isPlanEnabled('starter'),
                'growth' => SystemSetting::isPlanEnabled('growth'),
                'professional' => SystemSetting::isPlanEnabled('professional'),
                'enterprise' => SystemSetting::isPlanEnabled('enterprise'),
                'demo' => SystemSetting::isPlanEnabled('demo'),
            ],
            'addons' => [
                'ai_credits' => SystemSetting::isAddonEnabled('ai_credits'),
                'storage' => SystemSetting::isAddonEnabled('storage'),
                'team_members' => SystemSetting::isAddonEnabled('team_members'),
                'publications' => SystemSetting::isAddonEnabled('publications'),
            ],
            'features' => [
                'ai' => SystemSetting::isFeatureEnabled('ai'),
                'analytics' => SystemSetting::isFeatureEnabled('analytics'),
                'reels' => SystemSetting::isFeatureEnabled('reels'),
                'approval_workflows' => SystemSetting::isFeatureEnabled('approval_workflows'),
                'calendar_sync' => SystemSetting::isFeatureEnabled('calendar_sync'),
                'bulk_operations' => SystemSetting::isFeatureEnabled('bulk_operations'),
                'white_label' => SystemSetting::isFeatureEnabled('white_label'),
            ],
            'integrations' => [
                'rss' => SystemSetting::isIntegrationEnabled('rss'),
                'zapier' => SystemSetting::isIntegrationEnabled('zapier'),
                'google_drive' => SystemSetting::isIntegrationEnabled('google_drive'),
                'dropbox' => SystemSetting::isIntegrationEnabled('dropbox'),
                'slack' => SystemSetting::isIntegrationEnabled('slack'),
            ],
            'payment_methods' => [
                'stripe' => SystemSetting::isPaymentMethodEnabled('stripe'),
                'wompi' => SystemSetting::isPaymentMethodEnabled('wompi'),
                'mercadopago' => SystemSetting::isPaymentMethodEnabled('mercadopago'),
                'payu' => SystemSetting::isPaymentMethodEnabled('payu'),
                'epayco' => SystemSetting::isPaymentMethodEnabled('epayco'),
            ],
            'general' => [
                'maintenance_mode' => SystemSetting::get('system.maintenance_mode', false),
                'new_registrations' => SystemSetting::get('system.new_registrations', true),
            ],
        ]);
    }

    /**
     * Cast value based on type
     */
    private function castValue($value, string $type)
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Prepare value for storage
     */
    private function prepareValue($value, string $type): string
    {
        return match ($type) {
            'boolean' => $value ? 'true' : 'false',
            'json' => json_encode($value),
            default => (string) $value,
        };
    }
}
