<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanFailedPublications extends Command
{
  protected $signature = 'publications:clean-failed {--reset : Reset failed publications to draft status}';
  protected $description = 'Clean up failed publications and optionally reset them';

  public function handle()
  {
    $this->info('Cleaning failed publications...');

    // Get all publications stuck in publishing status
    $stuckPublications = Publication::where('status', 'publishing')
      ->where('updated_at', '<', now()->subMinutes(30))
      ->get();

    if ($stuckPublications->isNotEmpty()) {
      $this->warn("Found {$stuckPublications->count()} publications stuck in 'publishing' status");
      
      foreach ($stuckPublications as $publication) {
        $publication->update(['status' => 'failed']);
        $publication->logActivity('failed', [
          'reason' => 'Stuck in publishing status for more than 30 minutes',
          'cleaned_by' => 'system'
        ]);
        
        $this->line("  - Publication #{$publication->id}: {$publication->title} marked as failed");
      }
    }

    // Get failed publications
    $failedPublications = Publication::where('status', 'failed')->get();
    
    $this->info("Found {$failedPublications->count()} failed publications");

    if ($this->option('reset')) {
      $this->warn('Resetting failed publications to draft status...');
      
      foreach ($failedPublications as $publication) {
        $publication->update([
          'status' => 'draft',
          'published_by' => null,
          'published_at' => null,
        ]);
        
        $publication->logActivity('reset', [
          'reason' => 'Manual reset via command',
          'previous_status' => 'failed'
        ]);
        
        $this->line("  - Publication #{$publication->id}: {$publication->title} reset to draft");
      }
      
      $this->info('All failed publications have been reset to draft status');
    }

    // Clean failed jobs from the database
    $this->info('Cleaning failed jobs from database...');
    
    $deletedCount = DB::table('failed_jobs')
      ->where('payload', 'like', '%PublishToSocialMedia%')
      ->delete();
    
    $this->info("Deleted {$deletedCount} failed PublishToSocialMedia jobs");

    $this->info('Cleanup completed!');
    
    return 0;
  }
}
