<?php

namespace App\Actions\Publications;

use App\Jobs\BulkPublishPublications;
use App\Models\Publications\Publication;
use App\Services\Queue\QueuePriorityService;
use Illuminate\Support\Facades\Log;

/**
 * Acción para publicar múltiples publicaciones en lote
 * con priorización basada en el plan de suscripción
 */
class BulkPublishAction
{
    public function __construct(
        protected QueuePriorityService $queueService
    ) {}

    /**
     * Ejecutar publicación en lote
     * 
     * @param array $publicationIds IDs de las publicaciones a publicar
     * @param array $socialAccountIds IDs de las cuentas sociales
     * @param int $workspaceId ID del workspace
     * @param int $userId ID del usuario que ejecuta la acción
     * @return array Información sobre el batch creado
     */
    public function execute(
        array $publicationIds,
        array $socialAccountIds,
        int $workspaceId,
        int $userId
    ): array {
        
        Log::info('Executing bulk publish action', [
            'publication_count' => count($publicationIds),
            'workspace_id' => $workspaceId,
            'user_id' => $userId
        ]);

        // Validar que hay publicaciones
        if (empty($publicationIds)) {
            throw new \InvalidArgumentException('No publications provided for bulk publish');
        }

        // Validar que hay cuentas sociales
        if (empty($socialAccountIds)) {
            throw new \InvalidArgumentException('No social accounts provided for bulk publish');
        }

        // Obtener el workspace y su plan
        $workspace = \App\Models\Workspace\Workspace::find($workspaceId);
        
        if (!$workspace) {
            throw new \Exception('Workspace not found');
        }

        $planSlug = $workspace->subscription_plan ?? 'free';

        // Validar límites del plan para operaciones en lote
        $this->validateBulkLimits($publicationIds, $planSlug);

        // Obtener información de prioridad
        $queueInfo = $this->queueService->getQueuePositionForPlan('bulk', $planSlug);

        Log::info('Bulk publish priority calculated', [
            'plan' => $planSlug,
            'effective_priority' => $queueInfo['effective_priority'],
            'estimated_position' => $queueInfo['estimated_position'],
            'estimated_wait_minutes' => $queueInfo['estimated_wait_minutes']
        ]);

        // Despachar el job de bulk publish
        BulkPublishPublications::dispatch(
            $publicationIds,
            $socialAccountIds,
            $workspaceId,
            $userId
        )->onQueue('bulk');

        return [
            'publication_count' => count($publicationIds),
            'plan' => $planSlug,
            'queue_info' => $queueInfo,
            'message' => $this->getQueueMessage($queueInfo, $planSlug, count($publicationIds))
        ];
    }

    /**
     * Validar límites del plan para operaciones en lote
     */
    private function validateBulkLimits(array $publicationIds, string $planSlug): void
    {
        $limits = [
            'enterprise' => 500, // Hasta 500 publicaciones por lote (MUCHÍSIMO mayor)
            'professional' => 50, // Máximo 50 publicaciones por lote
            'growth' => 20, // Máximo 20 publicaciones por lote
            'starter' => 10, // Máximo 10 publicaciones por lote
            'free' => 3, // Máximo 3 publicaciones por lote
            'demo' => 20, // Máximo 20 publicaciones por lote
        ];

        $limit = $limits[$planSlug] ?? $limits['free'];
        
        if (count($publicationIds) > $limit) {
            throw new \Exception(
                "Tu plan {$planSlug} permite un máximo de {$limit} publicaciones por lote. " .
                "Intenta con menos publicaciones o actualiza tu plan."
            );
        }
    }

    /**
     * Generar mensaje informativo sobre la cola
     */
    private function getQueueMessage(array $queueInfo, string $planSlug, int $count): string
    {
        $priorityLabels = [
            'enterprise' => 'Prioridad Máxima',
            'professional' => 'Prioridad Alta',
            'growth' => 'Prioridad Media',
            'starter' => 'Prioridad Estándar',
            'free' => '',
            'demo' => '',
        ];

        $priorityLabel = $priorityLabels[$planSlug] ?? '';
        $priorityText = $priorityLabel ? " ({$priorityLabel})" : '';

        if ($queueInfo['estimated_wait_minutes'] < 2) {
            return "Publicación en lote iniciada{$priorityText}. {$count} publicaciones comenzarán a procesarse pronto.";
        }

        return "Publicación en lote en cola{$priorityText}. {$count} publicaciones. Tiempo estimado: ~{$queueInfo['estimated_wait_minutes']} minutos.";
    }

    /**
     * Obtener límites de bulk por plan
     */
    public static function getBulkLimits(): array
    {
        return [
            'enterprise' => [
                'max_publications_per_batch' => 500,
                'max_concurrent_batches' => 10,
                'label' => 'Hasta 500 publicaciones por lote'
            ],
            'professional' => [
                'max_publications_per_batch' => 50,
                'max_concurrent_batches' => 3,
                'label' => 'Hasta 50 publicaciones'
            ],
            'growth' => [
                'max_publications_per_batch' => 20,
                'max_concurrent_batches' => 2,
                'label' => 'Hasta 20 publicaciones'
            ],
            'starter' => [
                'max_publications_per_batch' => 10,
                'max_concurrent_batches' => 1,
                'label' => 'Hasta 10 publicaciones'
            ],
            'free' => [
                'max_publications_per_batch' => 3,
                'max_concurrent_batches' => 1,
                'label' => 'Hasta 3 publicaciones'
            ],
            'demo' => [
                'max_publications_per_batch' => 20,
                'max_concurrent_batches' => 2,
                'label' => 'Hasta 20 publicaciones'
            ],
        ];
    }
}
