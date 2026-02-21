<?php

namespace App\Listeners;

use App\Events\Publications\PublicationCreated;
use App\Events\Publications\PublicationUpdated;
use App\Events\Publications\PublicationDeleted;
use App\Services\Calendar\ExternalCalendarSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use App\Helpers\LogHelper;

class SyncPublicationToExternalCalendars implements ShouldQueue
{
    use InteractsWithQueue;

    private ExternalCalendarSyncService $syncService;

    /**
     * Create the event listener.
     */
    public function __construct(ExternalCalendarSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Determine if the listener should be queued.
     * In local environment, run synchronously for easier debugging.
     */
    public function shouldQueue(): bool
    {
        return config('app.env') !== 'local' || config('queue.sync_calendar', false);
    }

    /**
     * Handle PublicationCreated event
     */
    public function handleCreated(PublicationCreated $event): void
    {
        try {
            $publication = $event->publication;
            $user = $publication->user;

            if ($user && $publication->scheduled_at) {
                Log::info('Syncing created publication to external calendars', [
                    'publication_id' => $publication->id,
                    'user_id' => $user->id,
                    'scheduled_at' => $publication->scheduled_at,
                ]);
                
                $this->syncService->syncPublication($publication, $user);
                
                Log::info('Publication synced successfully to external calendars', [
                    'publication_id' => $publication->id,
                ]);
            } else {
                Log::debug('Skipping calendar sync - no user or not scheduled', [
                    'publication_id' => $publication->id,
                    'has_user' => !is_null($user),
                    'has_scheduled_at' => !is_null($publication->scheduled_at),
                ]);
            }
        } catch (\Exception $e) {
            LogHelper::publicationError('Failed to sync created publication to external calendars', [
                'publication_id' => $event->publication->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't throw - sync errors should not block publication creation
        }
    }

    /**
     * Handle PublicationUpdated event
     */
    public function handleUpdated(PublicationUpdated $event): void
    {
        try {
            $publication = $event->publication;

            if ($publication->scheduled_at) {
                Log::info('Syncing updated publication to external calendars', [
                    'publication_id' => $publication->id,
                ]);
                
                $this->syncService->handlePublicationUpdated($publication);
                
                Log::info('Updated publication synced successfully', [
                    'publication_id' => $publication->id,
                ]);
            }
        } catch (\Exception $e) {
            LogHelper::publicationError('Failed to sync updated publication to external calendars', [
                'publication_id' => $event->publication->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't throw - sync errors should not block publication updates
        }
    }

    /**
     * Handle PublicationDeleted event
     */
    public function handleDeleted(PublicationDeleted $event): void
    {
        try {
            $publication = $event->publication;
            
            Log::info('Syncing deleted publication to external calendars', [
                'publication_id' => $publication->id,
            ]);
            
            $this->syncService->handlePublicationDeleted($publication);
            
            Log::info('Deleted publication synced successfully', [
                'publication_id' => $publication->id,
            ]);
        } catch (\Exception $e) {
            LogHelper::publicationError('Failed to sync deleted publication to external calendars', [
                'publication_id' => $event->publication->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't throw - sync errors should not block publication deletion
        }
    }
}
