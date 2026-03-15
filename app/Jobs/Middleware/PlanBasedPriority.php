<?php

namespace App\Jobs\Middleware;

use App\Models\Publications\Publication;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * Middleware para asignar prioridad a jobs basado en el plan de suscripción
 * 
 * Prioridades por plan:
 * - Enterprise: Prioridad máxima (100)
 * - Professional: Prioridad alta (75)
 * - Growth: Prioridad media (50)
 * - Starter: Prioridad baja (25)
 * - Free/Demo: Prioridad mínima (10)
 */
class PlanBasedPriority
{
    /**
     * Mapeo de planes a niveles de prioridad
     * Enterprise tiene prioridad MUCHÍSIMO mayor
     */
    private const PLAN_PRIORITIES = [
        'enterprise' => 200,    // Prioridad DOBLE (máxima absoluta)
        'professional' => 75,   // Prioridad alta
        'growth' => 50,         // Prioridad media
        'starter' => 25,        // Prioridad baja
        'free' => 10,           // Prioridad mínima
        'demo' => 10,           // Prioridad mínima
    ];

    /**
     * Process the queued job.
     */
    public function handle(object $job, callable $next): void
    {
        $priority = $this->determinePriority($job);
        
        if ($priority !== null) {
            $this->applyPriority($job, $priority);
        }

        $next($job);
    }

    /**
     * Determinar la prioridad basada en el plan del usuario
     */
    private function determinePriority(object $job): ?int
    {
        try {
            // Obtener el workspace del job
            $workspace = $this->getWorkspaceFromJob($job);
            
            if (!$workspace) {
                Log::debug('No workspace found for job, using default priority');
                return null;
            }

            // Obtener el plan del workspace
            $planSlug = $workspace->subscription_plan ?? 'free';
            
            $priority = self::PLAN_PRIORITIES[$planSlug] ?? self::PLAN_PRIORITIES['free'];
            
            Log::info('Plan-based priority assigned', [
                'job_class' => get_class($job),
                'workspace_id' => $workspace->id,
                'plan' => $planSlug,
                'priority' => $priority
            ]);
            
            return $priority;
            
        } catch (\Exception $e) {
            Log::warning('Failed to determine plan-based priority', [
                'job_class' => get_class($job),
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Obtener el workspace desde el job
     */
    private function getWorkspaceFromJob(object $job): ?object
    {
        // Para PublishToSocialMedia
        if (isset($job->publicationId)) {
            $publication = Publication::with('workspace')->find($job->publicationId);
            return $publication?->workspace;
        }

        // Para otros jobs que tengan workspace_id directamente
        if (isset($job->workspaceId)) {
            return \App\Models\Workspace::find($job->workspaceId);
        }

        // Para jobs que tengan user_id
        if (isset($job->userId)) {
            $user = User::with('currentWorkspace')->find($job->userId);
            return $user?->currentWorkspace;
        }

        return null;
    }

    /**
     * Aplicar la prioridad al job usando Redis sorted sets
     */
    private function applyPriority(object $job, int $priority): void
    {
        try {
            $jobId = $job->job?->getJobId();
            
            if (!$jobId) {
                return;
            }

            // Guardar la prioridad en Redis para que los workers la procesen
            $key = "job:priority:{$jobId}";
            Redis::setex($key, 3600, $priority); // Expira en 1 hora
            
            // También registrar en métricas
            $this->recordPriorityMetrics($job, $priority);
            
        } catch (\Exception $e) {
            Log::warning('Failed to apply job priority', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Registrar métricas de prioridad para monitoreo
     */
    private function recordPriorityMetrics(object $job, int $priority): void
    {
        try {
            $queue = $job->queue ?? 'default';
            $date = now()->format('Y-m-d');
            
            // Incrementar contador de jobs por prioridad
            $key = "metrics:queue:{$queue}:priority:{$priority}:{$date}";
            Redis::incr($key);
            Redis::expire($key, 86400 * 7); // Mantener por 7 días
            
        } catch (\Exception $e) {
            // Silenciar errores de métricas
        }
    }

    /**
     * Obtener la prioridad de un plan específico
     */
    public static function getPriorityForPlan(string $planSlug): int
    {
        return self::PLAN_PRIORITIES[$planSlug] ?? self::PLAN_PRIORITIES['free'];
    }

    /**
     * Obtener todos los niveles de prioridad
     */
    public static function getAllPriorities(): array
    {
        return self::PLAN_PRIORITIES;
    }
}
