<?php

namespace App\Console\Commands;

use App\Models\Social\SocialPostLog;
use App\Models\Publications\Publication;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanOrphanedPublishingLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'publications:clean-orphaned-logs 
                            {--dry-run : Show what would be cleaned without making changes}
                            {--minutes=30 : Consider logs orphaned after this many minutes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean orphaned publishing logs that are stuck in pending/publishing status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $minutes = (int) $this->option('minutes');
        
        $this->info("Searching for orphaned logs older than {$minutes} minutes...");
        
        // Find logs stuck in pending/publishing for more than X minutes
        $orphanedLogs = SocialPostLog::whereIn('status', ['pending', 'publishing'])
            ->where('updated_at', '<', now()->subMinutes($minutes))
            ->get();
        
        if ($orphanedLogs->isEmpty()) {
            $this->info('✓ No orphaned logs found.');
            return 0;
        }
        
        $this->warn("Found {$orphanedLogs->count()} orphaned logs:");
        
        $table = [];
        foreach ($orphanedLogs as $log) {
            $publication = Publication::find($log->publication_id);
            $table[] = [
                'Log ID' => $log->id,
                'Publication' => $log->publication_id,
                'Pub Status' => $publication?->status ?? 'N/A',
                'Platform' => $log->platform,
                'Log Status' => $log->status,
                'Updated' => $log->updated_at->diffForHumans(),
            ];
        }
        
        $this->table(
            ['Log ID', 'Publication', 'Pub Status', 'Platform', 'Log Status', 'Updated'],
            $table
        );
        
        if ($dryRun) {
            $this->info('DRY RUN - No changes made. Remove --dry-run to apply changes.');
            return 0;
        }
        
        if (!$this->confirm('Do you want to mark these logs as failed?', true)) {
            $this->info('Operation cancelled.');
            return 0;
        }
        
        DB::beginTransaction();
        
        try {
            $updated = 0;
            $publicationsToUpdate = [];
            
            foreach ($orphanedLogs as $log) {
                $log->update([
                    'status' => 'failed',
                    'error_message' => 'Publicación cancelada o timeout - limpieza automática',
                    'updated_at' => now()
                ]);
                
                $updated++;
                
                // Track publications that need status update
                $publication = Publication::find($log->publication_id);
                if ($publication && in_array($publication->status, ['publishing', 'retrying'])) {
                    $publicationsToUpdate[$publication->id] = $publication;
                }
            }
            
            // Update publications to failed if all their logs are now failed
            foreach ($publicationsToUpdate as $publication) {
                $hasActiveLogs = SocialPostLog::where('publication_id', $publication->id)
                    ->whereIn('status', ['pending', 'publishing', 'published'])
                    ->exists();
                
                if (!$hasActiveLogs) {
                    $publication->update(['status' => 'failed']);
                    $this->info("  → Updated publication {$publication->id} to 'failed'");
                }
            }
            
            DB::commit();
            
            $this->info("✓ Successfully updated {$updated} logs to 'failed' status.");
            $this->info("✓ Updated " . count($publicationsToUpdate) . " publications.");
            
            return 0;
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Failed to clean logs: " . $e->getMessage());
            return 1;
        }
    }
}
