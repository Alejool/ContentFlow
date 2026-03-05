<?php

namespace App\Console\Commands;

use App\Models\Calendar\ExternalCalendarConnection;
use App\Services\Calendar\ExternalCalendarSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncExternalCalendars extends Command
{
    protected $signature = 'calendar:sync-external {--connection-id= : Sync specific connection ID} {--force : Force sync even if recently synced}';
    protected $description = 'Sync all publications and user events to external calendars (Google, Outlook)';

    public function handle(ExternalCalendarSyncService $syncService): int
    {
        $this->info('Starting external calendar sync...');

        try {
            // Get connections to sync
            $query = ExternalCalendarConnection::where('sync_enabled', true)
                ->where('status', 'connected');

            if ($connectionId = $this->option('connection-id')) {
                $query->where('id', $connectionId);
            }

            // Skip recently synced connections unless forced
            if (!$this->option('force')) {
                $query->where(function ($q) {
                    $q->whereNull('last_sync_at')
                        ->orWhere('last_sync_at', '<', now()->subMinutes(30));
                });
            }

            $connections = $query->get();

            if ($connections->isEmpty()) {
                $this->warn('No active calendar connections found to sync.');
                return 0;
            }

            $this->info("Found {$connections->count()} connection(s) to sync.");

            $totalSuccessful = 0;
            $totalFailed = 0;

            foreach ($connections as $connection) {
                $this->line("Syncing {$connection->provider} calendar for {$connection->email}...");

                try {
                    $results = $syncService->fullSync($connection);

                    $successful = count($results['successful']);
                    $failed = count($results['failed']);
                    $totalSuccessful += $successful;
                    $totalFailed += $failed;

                    $this->info("  ✓ Synced {$successful} events ({$results['publications']} publications, {$results['user_events']} user events)");
                    
                    if ($failed > 0) {
                        $this->warn("  ✗ Failed to sync {$failed} events");
                        
                        // Show first 3 errors
                        foreach (array_slice($results['failed'], 0, 3) as $failure) {
                            $this->error("    - {$failure['type']} #{$failure['id']}: {$failure['error']}");
                        }
                        
                        if ($failed > 3) {
                            $this->warn("    ... and " . ($failed - 3) . " more errors");
                        }
                    }
                } catch (\Exception $e) {
                    $this->error("  ✗ Failed to sync connection: {$e->getMessage()}");
                    Log::error('External calendar sync failed', [
                        'connection_id' => $connection->id,
                        'provider' => $connection->provider,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    // Update connection status
                    $connection->update([
                        'status' => 'error',
                        'error_message' => $e->getMessage(),
                    ]);
                }
            }

            $this->newLine();
            $this->info("Sync completed!");
            $this->info("Total successful: {$totalSuccessful}");
            
            if ($totalFailed > 0) {
                $this->warn("Total failed: {$totalFailed}");
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Fatal error during sync: {$e->getMessage()}");
            Log::error('External calendar sync command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }
}
