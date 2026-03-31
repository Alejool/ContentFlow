<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Subscription\PlanLimitValidator;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureAccess
{
    public function __construct(
        private PlanLimitValidator $validator
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  string  $feature  Feature name to check (e.g., 'advanced_analytics', 'api_access')
     */
    public function handle(Request $request, Closure $next, string $feature): Response
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
                'feature_locked' => true,
                'message' => 'Esta función requiere una suscripción activa.',
                'redirect_to' => '/subscription/pricing',
            ], 403);
        }

        // Check if plan has access to the feature
        if (!$this->validator->hasFeatureAccess($workspace, $feature)) {
            $featureNames = [
                'advanced_analytics' => 'Analytics Avanzados',
                'api_access' => 'Acceso API',
                'white_label' => 'White Label',
                'custom_branding' => 'Branding Personalizado',
                'bulk_operations' => 'Operaciones en Lote',
                'calendar_sync' => 'Sincronización de Calendario',
                'custom_integrations' => 'Integraciones Personalizadas',
                'sla_guarantee' => 'Garantía SLA',
                'priority_support' => 'Soporte Prioritario',
                'dedicated_support' => 'Soporte Dedicado',
            ];

            $featureName = $featureNames[$feature] ?? $feature;
            
            return response()->json([
                'error' => 'Feature not available',
                'feature' => $feature,
                'feature_name' => $featureName,
                'feature_locked' => true,
                'message' => "La función '{$featureName}' no está disponible en tu plan actual.",
                'current_plan' => $subscription->plan,
                'upgrade_required' => true,
                'redirect_to' => '/subscription/pricing',
            ], 403);
        }

        return $next($request);
    }
}
