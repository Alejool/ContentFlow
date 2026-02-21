<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use App\Services\Calendar\ExternalCalendarSyncService;
use Illuminate\Console\Command;

class SyncPublicationToCalendar extends Command
{
    protected $signature = 'calendar:sync-publication {publication_id}';
    protected $description = 'Manually sync a publication to external calendars';

    public function handle(ExternalCalendarSyncService $syncService): int
    {
        $publicationId = $this->argument('publication_id');
        
        $publication = Publication::with(['user', 'platforms', 'campaign'])->find($publicationId);
        
        if (!$publication) {
            $this->error("Publication {$publicationId} not found");
            return 1;
        }
        
        if (!$publication->user) {
            $this->error("Publication has no user associated");
            return 1;
        }
        
        if (!$publication->scheduled_at) {
            $this->error("Publication is not scheduled");
            return 1;
        }
        
        $this->info("Syncing publication {$publication->id} to external calendars...");
        
        try {
            $syncService->syncPublication($publication, $publication->user);
            $this->info("✓ Publication synced successfully");
            return 0;
        } catch (\Exception $e) {
            $this->error("✗ Failed to sync: " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }
}
