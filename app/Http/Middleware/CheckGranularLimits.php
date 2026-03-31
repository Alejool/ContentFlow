<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Subscription\GranularLimitValidator;
use App\Exceptions\LimitReachedException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para verificar límites granulares específicos.
 * 
 * Uso:
 * Route::post('/publications', ...)->middleware('granular.limit:daily_publications');
 * Route::post('/campaigns', ...)->middleware('granular.limit:campaigns');
 */
class CheckGranularLimits
{
    public function __construct(
        private GranularLimitValidator $validator
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

        // Verificar el límite específico
        $canPerform = match($limitType) {
            'daily_publications' => $this->validator->canPublishToday($workspace),
            'simultaneous_publications' => $this->validator->canPublishSimultaneously($workspace),
            'campaigns' => $this->validator->canCreateCampaign($workspace),
            'approval_workflows' => $this->validator->canCreateApprovalWorkflow($workspace),
            'exports' => $this->validator->canExport($workspace),
            'discord_integration' => $this->validator->canAddExternalIntegration($workspace, 'discord'),
            'slack_integration' => $this->validator->canAddExternalIntegration($workspace, 'slack'),
            'webhook_integration' => $this->validator->canAddExternalIntegration($workspace, 'webhook'),
            default => true,
        };

        if (!$canPerform) {
            $message = $this->getErrorMessage($limitType, $workspace);
            
            throw new LimitReachedException(
                $message['message'],
                [
                    'limit_type' => $limitType,
                    'current_plan' => $workspace->subscription?->plan ?? 'demo',
                    'workspace_id' => $workspace->id,
                    'workspace_name' => $workspace->name,
                    'remaining' => $this->validator->getRemainingCount($workspace, $limitType),
                    'upgrade_required' => true,
                ]
            );
        }

        return $next($request);
    }

    private function getErrorMessage(string $limitType, $workspace): array
    {
        $limits = $this->validator->getGranularLimits($workspace);
        
        return match($limitType) {
            'daily_publications' => [
                'title' => 'Límite diario alcanzado',
                'message' => 'Has alcanzado el límite de publicaciones por día (' . ($limits['publications_per_day'] ?? 0) . '). Intenta mañana o actualiza tu plan.',
            ],
            'simultaneous_publications' => [
                'title' => 'Demasiadas publicaciones simultáneas',
                'message' => 'Ya tienes el máximo de publicaciones publicándose al mismo tiempo (' . ($limits['publications_simultaneous'] ?? 1) . '). Espera a que terminen o actualiza tu plan.',
            ],
            'campaigns' => [
                'title' => 'Límite de campañas alcanzado',
                'message' => 'Has alcanzado el límite de campañas activas (' . ($limits['active_campaigns'] ?? 1) . '). Desactiva alguna o actualiza tu plan.',
            ],
            'approval_workflows' => [
                'title' => 'Límite de workflows alcanzado',
                'message' => 'Has alcanzado el límite de workflows de aprobación (' . ($limits['approval_workflows'] ?? 0) . '). Actualiza tu plan para crear más.',
            ],
            'exports' => [
                'title' => 'Límite de exportaciones alcanzado',
                'message' => 'Has alcanzado el límite de exportaciones este mes (' . ($limits['exports_per_month'] ?? 5) . '). Actualiza tu plan para exportar más.',
            ],
            'discord_integration' => [
                'title' => 'Límite de integraciones Discord alcanzado',
                'message' => 'Has alcanzado el límite de webhooks de Discord. Actualiza tu plan para agregar más.',
            ],
            'slack_integration' => [
                'title' => 'Límite de integraciones Slack alcanzado',
                'message' => 'Has alcanzado el límite de webhooks de Slack. Actualiza tu plan para agregar más.',
            ],
            'webhook_integration' => [
                'title' => 'Límite de webhooks alcanzado',
                'message' => 'Has alcanzado el límite de webhooks personalizados. Actualiza tu plan para agregar más.',
            ],
            default => [
                'title' => 'Límite alcanzado',
                'message' => 'Has alcanzado un límite de tu plan actual. Actualiza para continuar.',
            ],
        };
    }
}
