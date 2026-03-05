<?php

namespace App\Console\Commands;

use App\Models\Calendar\ExternalCalendarEvent;
use App\Services\Calendar\ExternalCalendarSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanDuplicateExternalCalendarEvents extends Command
{
    protected $signature = 'calendar:clean-duplicates {--dry-run : Show what would be deleted without actually deleting}';
    protected $description = 'Remove duplicate external calendar events';

    public function handle(ExternalCalendarSyncService $syncService): int
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }
        
        $this->info('Finding duplicate external calendar events...');

        try {
            // Find duplicates for publications
            $publicationDuplicates = DB::table('external_calendar_events')
                ->select('connection_id', 'publication_id', DB::raw('COUNT(*) as count'))
                ->whereNotNull('publication_id')
                ->groupBy('connection_id', 'publication_id')
                ->having('count', '>', 1)
                ->get();

            // Find duplicates for user events
            $userEventDuplicates = DB::table('external_calendar_events')
                ->select('connection_id', 'user_calendar_event_id', DB::raw('COUNT(*) as count'))
                ->whereNotNull('user_calendar_event_id')
                ->groupBy('connection_id', 'user_calendar_event_id')
                ->having('count', '>', 1)
                ->get();

            $totalDuplicates = $publicationDuplicates->count() + $userEventDuplicates->count();

            if ($totalDuplicates === 0) {
                $this->info('No duplicates found.');
                return 0;
            }

            $this->warn("Found {$totalDuplicates} duplicate group(s)");

            $deleted = 0;
            $failed = 0;

            // Clean publication duplicates
            foreach ($publicationDuplicates as $duplicate) {
                $this->line("Processing publication #{$duplicate->publication_id} duplicates ({$duplicate->count} copies)...");

                $events = ExternalCalendarEvent::where('connection_id', $duplicate->connection_id)
                    ->where('publication_id', $duplicate->publication_id)
                    ->orderBy('id')
                    ->get();

                // Keep the first one, delete the rest
                $keepEvent = $events->first();
                $duplicateEvents = $events->skip(1);

                foreach ($duplicateEvents as $event) {
                    try {
                        if (!$dryRun) {
                            $connection = $event->connection;
                            
                            if ($connection) {
                                // Try to delete from external calendar
                                try {
                                    $provider = $syncService->getProviderInstance($connection);
                                    
                                    if ($connection->needsRefresh()) {
                                        $syncService->refreshConnectionToken($connection, $provider);
                                    }

                                    $provider->setAccessToken(decrypt($connection->access_token));
                                    $provider->deleteEvent($event->external_event_id);
                                } catch (\Exception $e) {
                                    $this->warn("  Could not delete from external calendar: {$e->getMessage()}");
                                }
                            }

                            // Delete local record
                            $event->delete();
                        }
                        
                        $deleted++;
                        $this->line("  ✓ " . ($dryRun ? 'Would delete' : 'Deleted') . " duplicate event #{$event->id}");
                    } catch (\Exception $e) {
                        $failed++;
                        $this->error("  ✗ Failed to delete event #{$event->id}: {$e->getMessage()}");
                    }
                }
            }

            // Clean user event duplicates
            foreach ($userEventDuplicates as $duplicate) {
                $this->line("Processing user event #{$duplicate->user_calendar_event_id} duplicates ({$duplicate->count} copies)...");

                $events = ExternalCalendarEvent::where('connection_id', $duplicate->connection_id)
                    ->where('user_calendar_event_id', $duplicate->user_calendar_event_id)
                    ->orderBy('id')
                    ->get();

                // Keep the first one, delete the rest
                $keepEvent = $events->first();
                $duplicateEvents = $events->skip(1);

                foreach ($duplicateEvents as $event) {
                    try {
                        if (!$dryRun) {
                            $connection = $event->connection;
                            
                            if ($connection) {
                                // Try to delete from external calendar
                                try {
                                    $provider = $syncService->getProviderInstance($connection);
                                    
                                    if ($connection->needsRefresh()) {
                                        $syncService->refreshConnectionToken($connection, $provider);
                                    }

                                    $provider->setAccessToken(decrypt($connection->access_token));
                                    $provider->deleteEvent($event->external_event_id);
                                } catch (\Exception $e) {
                                    $this->warn("  Could not delete from external calendar: {$e->getMessage()}");
                                }
                            }

                            // Delete local record
                            $event->delete();
                        }
                        
                        $deleted++;
                        $this->line("  ✓ " . ($dryRun ? 'Would delete' : 'Deleted') . " duplicate event #{$event->id}");
                    } catch (\Exception $e) {
                        $failed++;
                        $this->error("  ✗ Failed to delete event #{$event->id}: {$e->getMessage()}");
                    }
                }
            }

            $this->newLine();
            $this->info("Cleanup completed!");
            $this->info(($dryRun ? 'Would delete: ' : 'Deleted: ') . $deleted);
            
            if ($failed > 0) {
                $this->warn("Failed: {$failed}");
            }

            if ($dryRun) {
                $this->newLine();
                $this->info('Run without --dry-run to actually delete duplicates');
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Fatal error during cleanup: {$e->getMessage()}");
            Log::error('Duplicate calendar events cleanup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }
}
