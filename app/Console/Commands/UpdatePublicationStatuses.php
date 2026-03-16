<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use App\Services\Publications\PublicationStatusService;
use Illuminate\Console\Command;

class UpdatePublicationStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'publications:update-statuses {--force : Force update all publications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update publication statuses based on their social post logs';

    /**
     * Execute the console command.
     */
    public function handle(PublicationStatusService $statusService)
    {
        $this->info('Starting publication status update...');
        
        $force = $this->option('force');
        
        // Get all publications with their logs
        $publications = Publication::withoutGlobalScope('workspace')
            ->with('socialPostLogs')
            ->get();
        
        $this->info("Found {$publications->count()} publications to process");
        
        $bar = $this->output->createProgressBar($publications->count());
        $bar->start();
        
        $updated = 0;
        $skipped = 0;
        $errors = 0;
        
        foreach ($publications as $publication) {
            try {
                $wasUpdated = $statusService->updatePublicationStatus($publication, $force);
                
                if ($wasUpdated) {
                    $updated++;
                } else {
                    $skipped++;
                }
            } catch (\Exception $e) {
                $errors++;
                $this->error("\nError updating publication {$publication->id}: {$e->getMessage()}");
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Update complete!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Updated', $updated],
                ['Skipped', $skipped],
                ['Errors', $errors],
            ]
        );
        
        return Command::SUCCESS;
    }
}
