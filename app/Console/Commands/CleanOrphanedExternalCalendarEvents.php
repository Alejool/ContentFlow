<?php

namespace App\Console\Commands;

use App\Models\Calendar\ExternalCalendarEvent;
use App\Services\Calendar\ExternalCalendarSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanOrphanedExternalCalendarEvents extends Command
{
    protected $signature = 'calendar:clean-orphaned';
    protected $description = 'Remove external calendar events that no longer have a corresponding publication or user event';

    public function handle(ExternalCalendarSyncService $syncService): int
    {
        $this->info('Cleaning orphaned external calendar events...');

        try {
            // Find events where the publication or user event no longer exists
            $orphanedEvents = ExternalCalendarEvent::whereDoesntHave('publication')
                ->whereDoesntHave('userCalendarEvent')
                ->with('connection')
                ->get();

            if ($orphanedEvents->isEmpty()) {
                $this->info('No orphaned events found.');
                return 0;
            }

            $this->info("Found {$orphanedEvents->count()} orphaned event(s).");

            $deleted = 0;
            $failed = 0;

            foreach ($orphanedEvents as $event) {
                $connection = $event->connection;

                if (!$connection) {
                    // Connection no longer exists, just delete the record
                    $event->delete();
                    $deleted++;
                    continue;
                }

                try {
                    // Try to delete from external calendar
                    $provider = $syncService->getProviderInstance($connection);
                    
                    if ($connection->needsRefresh()) {
                        $syncService->refreshConnectionToken($connection, $provider);
                    }

                    $provider->setAccessToken(decrypt($connection->access_token));
                    $provider->deleteEvent($event->external_event_id);

                    // Delete local record
                    $event->delete();
                    $deleted++;

                    $this->line("  ✓ Deleted event {$event->external_event_id} from {$connection->provider}");
                } catch (\Exception $e) {
                    $failed++;
                    $this->warn("  ✗ Failed to delete event {$event->external_event_id}: {$e->getMessage()}");
                    
                    // Delete local record anyway since the source is gone
                    $event->delete();
                    
                    Log::warning('Failed to delete orphaned external calendar event', [
                        'event_id' => $event->id,
                        'external_event_id' => $event->external_event_id,
                        'provider' => $connection->provider,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $this->newLine();
            $this->info("Cleanup completed!");
            $this->info("Deleted: {$deleted}");
            
            if ($failed > 0) {
                $this->warn("Failed: {$failed}");
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Fatal error during cleanup: {$e->getMessage()}");
            Log::error('Orphaned calendar events cleanup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }
}
