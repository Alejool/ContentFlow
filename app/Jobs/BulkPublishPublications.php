<?php

namespace App\Jobs;

use App\Models\Publications\Publication;
use App\Models\Workspace\Workspace;
use App\Services\Queue\QueuePriorityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Bus;

/**
 * Job para publicar múltiples publicaciones en lote
 * Respeta la prioridad del plan de suscripción
 */
class BulkPublishPublications implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutos para coordinar el batch
    public $tries = 1; // No reintentar el batch completo
    public $failOnTimeout = true;

    /**
     * Get the middleware the job should pass through.
     */
    public function middleware(): array
    {
        return [
            new \App\Jobs\Middleware\PlanBasedPriority,
        ];
    }

    public function __construct(
        public array $publicationIds,
        public array $socialAccountIds,
        public int $workspaceId,
        public int $userId
    ) {}

    public function handle(): void
    {
        $startTime = microtime(true);
        
        Log::info('Starting bulk publish operation', [
            'publication_count' => count($this->publicationIds),
            'workspace_id' => $this->workspaceId,
            'user_id' => $this->userId
        ]);

        $workspace = Workspace::find($this->workspaceId);
        
        if (!$workspace) {
            Log::error('Workspace not found for bulk operation', [
                'workspace_id' => $this->workspaceId
            ]);
            return;
        }

        // Obtener el plan y calcular prioridad
        $planSlug = $workspace->subscription_plan ?? 'free';
        $queueService = app(QueuePriorityService::class);
        $effectivePriority = $queueService->getEffectivePriority('bulk', $planSlug);

        Log::info('Bulk operation priority calculated', [
            'plan' => $planSlug,
            'effective_priority' => $effectivePriority,
            'workspace_id' => $this->workspaceId
        ]);

        // Validar que las publicaciones existen y pertenecen al workspace
        $publications = Publication::whereIn('id', $this->publicationIds)
            ->where('workspace_id', $this->workspaceId)
            ->get();

        if ($publications->isEmpty()) {
            Log::warning('No valid publications found for bulk operation', [
                'publication_ids' => $this->publicationIds,
                'workspace_id' => $this->workspaceId
            ]);
            return;
        }

        // Crear jobs individuales para cada publicación
        $jobs = [];
        foreach ($publications as $publication) {
            $jobs[] = new PublishToSocialMedia(
                $publication->id,
                $this->socialAccountIds
            );
        }

        // Crear batch con prioridad basada en el plan
        $batch = Bus::batch($jobs)
            ->name("Bulk Publish - Workspace {$this->workspaceId} - Plan: {$planSlug}")
            ->allowFailures() // Permitir que algunos fallen sin detener el batch
            ->onQueue('bulk') // Cola específica para operaciones en lote
            ->then(function () use ($startTime, $planSlug) {
                $duration = round(microtime(true) - $startTime, 2);
                Log::info('Bulk publish operation completed', [
                    'workspace_id' => $this->workspaceId,
                    'plan' => $planSlug,
                    'duration_seconds' => $duration
                ]);
                
                // Notificar al usuario
                $this->notifyCompletion(true);
            })
            ->catch(function (\Throwable $e) use ($planSlug) {
                Log::error('Bulk publish operation failed', [
                    'workspace_id' => $this->workspaceId,
                    'plan' => $planSlug,
                    'error' => $e->getMessage()
                ]);
                
                // Notificar al usuario del error
                $this->notifyCompletion(false, $e->getMessage());
            })
            ->finally(function () {
                Log::info('Bulk publish operation finalized', [
                    'workspace_id' => $this->workspaceId
                ]);
            })
            ->dispatch();

        Log::info('Bulk publish batch dispatched', [
            'batch_id' => $batch->id,
            'job_count' => count($jobs),
            'workspace_id' => $this->workspaceId,
            'plan' => $planSlug,
            'effective_priority' => $effectivePriority
        ]);

        // Notificar al usuario que el batch ha comenzado
        $this->notifyBatchStarted($batch->id, count($jobs), $planSlug);
    }

    /**
     * Notificar al usuario que el batch ha comenzado
     */
    private function notifyBatchStarted(string $batchId, int $jobCount, string $planSlug): void
    {
        try {
            $user = \App\Models\User::find($this->userId);
            
            if ($user) {
                $user->notify(new \App\Notifications\BulkPublishStartedNotification(
                    $batchId,
                    $jobCount,
                    $planSlug,
                    $this->workspaceId
                ));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send bulk publish started notification', [
                'user_id' => $this->userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notificar al usuario sobre la finalización del batch
     */
    private function notifyCompletion(bool $success, ?string $error = null): void
    {
        try {
            $user = \App\Models\User::find($this->userId);
            
            if ($user) {
                $user->notify(new \App\Notifications\BulkPublishCompletedNotification(
                    count($this->publicationIds),
                    $success,
                    $this->workspaceId,
                    $error
                ));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send bulk publish completion notification', [
                'user_id' => $this->userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Bulk publish job failed permanently', [
            'workspace_id' => $this->workspaceId,
            'user_id' => $this->userId,
            'publication_count' => count($this->publicationIds),
            'error' => $exception->getMessage()
        ]);

        $this->notifyCompletion(false, $exception->getMessage());
    }
}
