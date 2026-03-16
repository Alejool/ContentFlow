<?php

namespace App\Services\Publications;

use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para manejar y determinar el estado de las publicaciones
 * basado en el estado de los logs de publicación en plataformas
 */
class PublicationStatusService
{
    /**
     * Estados posibles de una publicación
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_PUBLISHING = 'publishing';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_PUBLISHED_WITH_ERRORS = 'published_with_errors';
    public const STATUS_PARTIALLY_PUBLISHED = 'partially_published';
    public const STATUS_RETRYING = 'retrying';
    public const STATUS_FAILED = 'failed';

    /**
     * Determina el estado apropiado de una publicación basado en sus logs
     */
    public function determinePublicationStatus(Publication $publication): array
    {
        // Obtener el último log por cada cuenta social
        $latestLogs = $publication->socialPostLogs()
            ->whereIn('id', function ($query) use ($publication) {
                $query->selectRaw('MAX(id)')
                    ->from('social_post_logs')
                    ->where('publication_id', $publication->id)
                    ->groupBy('social_account_id');
            })
            ->get();

        if ($latestLogs->isEmpty()) {
            // No hay logs, mantener el estado actual si es draft, pending_review, approved, rejected, o scheduled
            if (in_array($publication->status, [
                self::STATUS_DRAFT,
                self::STATUS_PENDING_REVIEW,
                self::STATUS_APPROVED,
                self::STATUS_REJECTED,
                self::STATUS_SCHEDULED
            ])) {
                return [
                    'status' => $publication->status,
                    'summary' => $this->generateStatusSummary($publication, $latestLogs),
                    'should_update' => false
                ];
            }
            
            return [
                'status' => self::STATUS_DRAFT,
                'summary' => $this->generateStatusSummary($publication, $latestLogs),
                'should_update' => true
            ];
        }

        // Contar estados
        $statusCounts = $latestLogs->groupBy('status')->map->count();
        $totalPlatforms = $latestLogs->count();

        $published = $statusCounts->get('published', 0);
        $publishing = $statusCounts->get('publishing', 0);
        $pending = $statusCounts->get('pending', 0);
        $failed = $statusCounts->get('failed', 0);
        $deleted = $statusCounts->get('deleted', 0);

        // Determinar el estado basado en la lógica de negocio
        $newStatus = $this->calculateStatus(
            $totalPlatforms,
            $published,
            $publishing,
            $pending,
            $failed,
            $deleted,
            $publication->status
        );

        $summary = $this->generateStatusSummary($publication, $latestLogs);

        return [
            'status' => $newStatus,
            'summary' => $summary,
            'should_update' => $newStatus !== $publication->status
        ];
    }

    /**
     * Calcula el estado apropiado basado en los conteos
     */
    private function calculateStatus(
        int $total,
        int $published,
        int $publishing,
        int $pending,
        int $failed,
        int $deleted,
        string $currentStatus
    ): string {
        // Si hay alguna plataforma publicando o pendiente, el estado es "publishing"
        if ($publishing > 0 || $pending > 0) {
            return self::STATUS_PUBLISHING;
        }

        // Si todas las plataformas están publicadas exitosamente
        if ($published === $total && $total > 0) {
            return self::STATUS_PUBLISHED;
        }

        // Si hay publicaciones exitosas y fallidas
        if ($published > 0 && $failed > 0) {
            return self::STATUS_PUBLISHED_WITH_ERRORS;
        }

        // Si hay algunas publicadas y otras eliminadas
        if ($published > 0 && $deleted > 0 && $failed === 0) {
            return self::STATUS_PARTIALLY_PUBLISHED;
        }

        // Si todas fallaron
        if ($failed === $total && $total > 0) {
            return self::STATUS_FAILED;
        }

        // Si todas fueron eliminadas (despublicadas)
        if ($deleted === $total && $total > 0) {
            return self::STATUS_DRAFT;
        }

        // Si hay mix de deleted y failed, pero no published
        if ($published === 0 && ($deleted > 0 || $failed > 0)) {
            return $failed > 0 ? self::STATUS_FAILED : self::STATUS_DRAFT;
        }

        // Mantener estados especiales del workflow de aprobación
        if (in_array($currentStatus, [
            self::STATUS_PENDING_REVIEW,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
            self::STATUS_SCHEDULED
        ])) {
            return $currentStatus;
        }

        // Por defecto, draft
        return self::STATUS_DRAFT;
    }

    /**
     * Genera un resumen detallado del estado de publicación
     */
    private function generateStatusSummary(Publication $publication, $logs): array
    {
        $summary = [
            'total_platforms' => $logs->count(),
            'published' => 0,
            'publishing' => 0,
            'pending' => 0,
            'failed' => 0,
            'deleted' => 0,
            'platforms' => [],
            'has_errors' => false,
            'all_successful' => false,
            'partially_successful' => false,
            'in_progress' => false,
        ];

        foreach ($logs as $log) {
            $status = $log->status;
            $summary[$status] = ($summary[$status] ?? 0) + 1;

            $summary['platforms'][] = [
                'platform' => $log->platform,
                'account_id' => $log->social_account_id,
                'account_name' => $log->account_name,
                'status' => $status,
                'published_at' => $log->published_at,
                'error' => $log->error_message,
                'url' => $log->post_url,
            ];
        }

        // Calcular flags
        $summary['has_errors'] = $summary['failed'] > 0;
        $summary['all_successful'] = $summary['published'] === $summary['total_platforms'] && $summary['total_platforms'] > 0;
        $summary['partially_successful'] = $summary['published'] > 0 && $summary['published'] < $summary['total_platforms'];
        $summary['in_progress'] = $summary['publishing'] > 0 || $summary['pending'] > 0;

        return $summary;
    }

    /**
     * Actualiza el estado de una publicación basado en sus logs
     */
    public function updatePublicationStatus(Publication $publication, bool $force = false): bool
    {
        $result = $this->determinePublicationStatus($publication);

        if (!$result['should_update'] && !$force) {
            Log::info('PublicationStatusService: No status update needed', [
                'publication_id' => $publication->id,
                'current_status' => $publication->status,
                'calculated_status' => $result['status']
            ]);
            return false;
        }

        $oldStatus = $publication->status;
        
        $publication->update([
            'status' => $result['status'],
            'publication_status_summary' => $result['summary']
        ]);

        Log::info('PublicationStatusService: Status updated', [
            'publication_id' => $publication->id,
            'old_status' => $oldStatus,
            'new_status' => $result['status'],
            'summary' => $result['summary']
        ]);

        return true;
    }

    /**
     * Obtiene una descripción legible del estado
     */
    public function getStatusDescription(string $status, ?array $summary = null): string
    {
        $descriptions = [
            self::STATUS_DRAFT => 'Borrador',
            self::STATUS_PENDING_REVIEW => 'Pendiente de revisión',
            self::STATUS_APPROVED => 'Aprobado',
            self::STATUS_REJECTED => 'Rechazado',
            self::STATUS_SCHEDULED => 'Programado',
            self::STATUS_PUBLISHING => 'Publicando',
            self::STATUS_PUBLISHED => 'Publicado en todas las plataformas',
            self::STATUS_PUBLISHED_WITH_ERRORS => 'Publicado con errores',
            self::STATUS_PARTIALLY_PUBLISHED => 'Publicado parcialmente',
            self::STATUS_RETRYING => 'Reintentando',
            self::STATUS_FAILED => 'Falló en todas las plataformas',
        ];

        $baseDescription = $descriptions[$status] ?? $status;

        if ($summary) {
            $details = [];
            if ($summary['published'] > 0) {
                $details[] = "{$summary['published']} publicadas";
            }
            if ($summary['failed'] > 0) {
                $details[] = "{$summary['failed']} fallidas";
            }
            if ($summary['publishing'] > 0) {
                $details[] = "{$summary['publishing']} en proceso";
            }

            if (!empty($details)) {
                $baseDescription .= ' (' . implode(', ', $details) . ')';
            }
        }

        return $baseDescription;
    }

    /**
     * Obtiene el color/variante apropiado para el estado
     */
    public function getStatusVariant(string $status): string
    {
        return match ($status) {
            self::STATUS_DRAFT => 'gray',
            self::STATUS_PENDING_REVIEW => 'amber',
            self::STATUS_APPROVED => 'blue',
            self::STATUS_REJECTED => 'red',
            self::STATUS_SCHEDULED => 'purple',
            self::STATUS_PUBLISHING, self::STATUS_RETRYING => 'blue',
            self::STATUS_PUBLISHED => 'green',
            self::STATUS_PUBLISHED_WITH_ERRORS => 'amber',
            self::STATUS_PARTIALLY_PUBLISHED => 'amber',
            self::STATUS_FAILED => 'red',
            default => 'gray',
        };
    }
}
