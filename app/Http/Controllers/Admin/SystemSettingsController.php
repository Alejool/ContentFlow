<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Publications\Publication;
use App\Models\Subscription\Subscription;
use App\Models\Social\SocialAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
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

        $stats = $this->buildDashboardStats();
        $recentActivity = $this->getRecentSettingsActivity();

        return Inertia::render('Admin/Dashboard', [
            'systemStatus' => $systemStatus,
            'stats' => $stats,
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * Build comprehensive system statistics
     */
    private function buildDashboardStats(): array
    {
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sevenDaysAgo = $now->copy()->subDays(7);

        // Users
        $totalUsers = User::count();
        $newUsersLast30d = User::where('created_at', '>=', $thirtyDaysAgo)->count();
        $newUsersLast7d = User::where('created_at', '>=', $sevenDaysAgo)->count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();

        // Workspaces
        $totalWorkspaces = Workspace::count();
        $activeWorkspaces = Workspace::whereHas('publications', function ($q) use ($thirtyDaysAgo) {
            $q->where('created_at', '>=', $thirtyDaysAgo);
        })->count();

        // Subscriptions — cuenta todos los gateways activos
        $activeSubscriptions = Subscription::where(function ($q) {
            $q->where('stripe_status', 'active')
              ->orWhere('status', 'active');
        })->count();

        $trialSubscriptions = Subscription::where('trial_ends_at', '>', $now)->count();

        $subscriptionsByPlan = Subscription::where(function ($q) {
            $q->where('stripe_status', 'active')->orWhere('status', 'active');
        })
        ->select('plan', DB::raw('count(*) as total'))
        ->groupBy('plan')
        ->pluck('total', 'plan')
        ->toArray();

        // Publications
        $totalPublications = Publication::withoutGlobalScopes()->count();
        $publishedPublications = Publication::withoutGlobalScopes()->where('status', 'published')->count();
        $failedPublications = Publication::withoutGlobalScopes()->where('status', 'failed')->count();
        $pendingReview = Publication::withoutGlobalScopes()->where('status', 'pending_review')->count();
        $newPublicationsLast30d = Publication::withoutGlobalScopes()
            ->where('created_at', '>=', $thirtyDaysAgo)->count();

        // Social accounts
        $totalSocialAccounts = SocialAccount::count();
        $socialAccountsByPlatform = SocialAccount::select('platform', DB::raw('count(*) as total'))
            ->groupBy('platform')
            ->pluck('total', 'platform')
            ->toArray();

        // System health — checks reales
        $systemHealth = $this->checkSystemHealth($failedPublications);

        return [
            // Usuarios
            'total_users' => $totalUsers,
            'new_users_30d' => $newUsersLast30d,
            'new_users_7d' => $newUsersLast7d,
            'verified_users' => $verifiedUsers,
            'unverified_users' => $totalUsers - $verifiedUsers,

            // Workspaces
            'total_workspaces' => $totalWorkspaces,
            'active_workspaces_30d' => $activeWorkspaces,

            // Suscripciones
            'active_subscriptions' => $activeSubscriptions,
            'trial_subscriptions' => $trialSubscriptions,
            'subscriptions_by_plan' => $subscriptionsByPlan,

            // Publicaciones
            'total_publications' => $totalPublications,
            'published_publications' => $publishedPublications,
            'failed_publications' => $failedPublications,
            'pending_review' => $pendingReview,
            'new_publications_30d' => $newPublicationsLast30d,

            // Redes sociales
            'total_social_accounts' => $totalSocialAccounts,
            'social_accounts_by_platform' => $socialAccountsByPlatform,

            // Salud del sistema
            'system_health' => $systemHealth['status'],
            'system_health_issues' => $systemHealth['issues'],
        ];
    }

    /**
     * Check real system health indicators
     */
    private function checkSystemHealth(int $failedPublications): array
    {
        $issues = [];

        // Publicaciones fallidas recientes
        $recentFailed = Publication::withoutGlobalScopes()
            ->where('status', 'failed')
            ->where('updated_at', '>=', Carbon::now()->subHours(24))
            ->count();

        if ($recentFailed > 10) {
            $issues[] = "High publication failure rate: {$recentFailed} in last 24h";
        }

        // Verificar conectividad a DB (si llegamos aquí, la DB funciona)
        // Verificar si hay settings sin valor
        $nullSettings = SystemSetting::whereNull('value')->orWhere('value', '')->count();
        if ($nullSettings > 0) {
            $issues[] = "{$nullSettings} system settings with empty values";
        }

        // Usuarios sin verificar > 50% del total
        $totalUsers = User::count();
        $unverified = User::whereNull('email_verified_at')->count();
        if ($totalUsers > 0 && ($unverified / $totalUsers) > 0.5) {
            $issues[] = "More than 50% of users are unverified ({$unverified}/{$totalUsers})";
        }

        $status = match(true) {
            count($issues) === 0 => 'healthy',
            count($issues) <= 2 => 'warning',
            default => 'critical',
        };

        return ['status' => $status, 'issues' => $issues];
    }

    /**
     * Get recent system settings activity (real data)
     */
    private function getRecentSettingsActivity(): array
    {
        return SystemSetting::with('updatedBy:id,name')
            ->whereNotNull('updated_by')
            ->orderBy('updated_at', 'desc')
            ->limit(8)
            ->get()
            ->map(fn($s) => [
                'key' => $s->key,
                'label' => $s->label,
                'category' => $s->category,
                'value' => $this->castValue($s->value, $s->type),
                'updated_at' => $s->updated_at->toISOString(),
                'updated_by' => $s->updatedBy?->name ?? 'System',
            ])
            ->toArray();
    }

    /**
     * Display the system settings page
     */
    public function index()
    {
        // Obtener métodos de pago disponibles desde config
        $availableMethods = config('payment.available_methods', []);
        $availableMethodKeys = array_keys($availableMethods);
        
        $settings = SystemSetting::with('updatedBy:id,name')
            ->orderBy('category')
            ->orderBy('label')
            ->get()
            ->filter(function ($setting) use ($availableMethodKeys) {
                // Si es un método de pago, filtrar solo los que están en available_methods
                if ($setting->category === 'payment_methods') {
                    // Extraer el nombre del método del key (payment.stripe.enabled -> stripe)
                    preg_match('/payment\.([^.]+)\.enabled/', $setting->key, $matches);
                    $methodName = $matches[1] ?? null;
                    
                    // Solo incluir si está en available_methods
                    return $methodName && in_array($methodName, $availableMethodKeys);
                }
                
                // Para otras categorías, incluir todos
                return true;
            })
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
