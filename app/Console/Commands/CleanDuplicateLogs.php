<?php

namespace App\Console\Commands;

use App\Models\SocialPostLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanDuplicateLogs extends Command
{
    protected $signature = 'logs:clean-duplicates 
                            {--publication= : Clean logs for a specific publication ID}
                            {--dry-run : Show what would be deleted without actually deleting}';

    protected $description = 'Clean duplicate social post logs that may cause publishing issues';

    public function handle()
    {
        $publicationId = $this->option('publication');
        $dryRun = $this->option('dry-run');

        $this->info('Starting duplicate log cleanup...');
        
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        // Find logs with multiple active entries for the same publication + account
        $query = DB::table('social_post_logs as spl1')
            ->select('spl1.publication_id', 'spl1.social_account_id', DB::raw('COUNT(*) as count'))
            ->whereIn('spl1.status', ['pending', 'publishing'])
            ->groupBy('spl1.publication_id', 'spl1.social_account_id')
            ->having(DB::raw('COUNT(*)'), '>', 1);

        if ($publicationId) {
            $query->where('spl1.publication_id', $publicationId);
        }

        $duplicates = $query->get();

        if ($duplicates->isEmpty()) {
            $this->info('No duplicate logs found!');
            return 0;
        }

        $this->info("Found {$duplicates->count()} publication-account combinations with duplicate logs");

        $totalDeleted = 0;

        foreach ($duplicates as $duplicate) {
            $this->line("\nPublication ID: {$duplicate->publication_id}, Account ID: {$duplicate->social_account_id}, Count: {$duplicate->count}");

            // Get all logs for this combination, ordered by updated_at DESC
            $logs = SocialPostLog::where('publication_id', $duplicate->publication_id)
                ->where('social_account_id', $duplicate->social_account_id)
                ->whereIn('status', ['pending', 'publishing'])
                ->orderBy('updated_at', 'desc')
                ->get();

            // Keep the most recent one, delete the rest
            $logsToDelete = $logs->skip(1);

            foreach ($logsToDelete as $log) {
                $this->line("  - Deleting log ID {$log->id} (status: {$log->status}, updated: {$log->updated_at})");
                
                if (!$dryRun) {
                    $log->delete();
                    $totalDeleted++;
                }
            }
        }

        if ($dryRun) {
            $this->info("\nDRY RUN: Would have deleted {$totalDeleted} logs");
        } else {
            $this->info("\nSuccessfully deleted {$totalDeleted} duplicate logs");
        }

        // Also clean up old failed/skipped logs (older than 7 days)
        $this->line("\nCleaning up old failed/skipped logs...");
        
        $oldLogsQuery = SocialPostLog::whereIn('status', ['failed', 'skipped'])
            ->where('updated_at', '<', now()->subDays(7));

        if ($publicationId) {
            $oldLogsQuery->where('publication_id', $publicationId);
        }

        $oldLogsCount = $oldLogsQuery->count();

        if ($oldLogsCount > 0) {
            $this->line("Found {$oldLogsCount} old failed/skipped logs");
            
            if (!$dryRun) {
                $oldLogsQuery->delete();
                $this->info("Deleted {$oldLogsCount} old logs");
            } else {
                $this->info("DRY RUN: Would have deleted {$oldLogsCount} old logs");
            }
        } else {
            $this->info('No old logs to clean up');
        }

        $this->info("\nCleanup complete!");
        
        return 0;
    }
}
