<?php

namespace App\Observers;

use App\Helpers\LogHelper;
use App\Models\Publications\Publication;

/**
 * Observer para loguear eventos importantes de publicaciones
 */
class PublicationObserver
{
    /**
     * Handle the Publication "created" event.
     */
    public function created(Publication $publication): void
    {
        LogHelper::publication('publication.created', [
            'publication_id' => $publication->id,
            'type' => $publication->type,
            'status' => $publication->status,
            'scheduled_at' => $publication->scheduled_at?->toIso8601String(),
        ]);
    }

    /**
     * Handle the Publication "updated" event.
     */
    public function updated(Publication $publication): void
    {
        // Solo loguear cambios importantes
        if ($publication->isDirty('status')) {
            $oldStatus = $publication->getOriginal('status');
            $newStatus = $publication->status;

            LogHelper::publication('publication.status_changed', [
                'publication_id' => $publication->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]);

            // Log específico para publicación exitosa
            if ($newStatus === 'published') {
                LogHelper::publication('publication.published', [
                    'publication_id' => $publication->id,
                    'type' => $publication->type,
                ]);
            }

            // Log específico para publicación fallida
            if ($newStatus === 'failed') {
                LogHelper::publicationError('publication.failed', 'Publication status changed to failed', [
                    'publication_id' => $publication->id,
                    'type' => $publication->type,
                ]);
            }
        }
    }

    /**
     * Handle the Publication "deleted" event.
     */
    public function deleted(Publication $publication): void
    {
        LogHelper::publication('publication.deleted', [
            'publication_id' => $publication->id,
            'type' => $publication->type,
            'status' => $publication->status,
        ]);
    }
}
