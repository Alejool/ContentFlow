<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\MediaFiles\MediaFile;

class MonitorReelGeneration extends Command
{
  protected $signature = 'reels:monitor {media_file_id?} {--follow}';
  protected $description = 'Monitor reel generation progress in real-time';

  public function handle()
  {
    $mediaFileId = $this->argument('media_file_id');
    $follow = $this->option('follow');

    if ($mediaFileId) {
      $this->monitorSpecificFile($mediaFileId, $follow);
    } else {
      $this->monitorAllJobs($follow);
    }
  }

  private function monitorSpecificFile($mediaFileId, $follow)
  {
    do {
      $this->info("\n" . now()->format('H:i:s') . " - Checking media file {$mediaFileId}...");
      
      $mediaFile = MediaFile::find($mediaFileId);
      
      if (!$mediaFile) {
        $this->error("Media file not found");
        return 1;
      }

      $this->table(
        ['Property', 'Value'],
        [
          ['Status', $mediaFile->status],
          ['File Name', $mediaFile->file_name],
          ['File Type', $mediaFile->file_type],
          ['Size (MB)', round($mediaFile->size / 1024 / 1024, 2)],
          ['Created', $mediaFile->created_at->diffForHumans()],
          ['Updated', $mediaFile->updated_at->diffForHumans()],
        ]
      );

      if ($mediaFile->processing_error) {
        $this->error("Processing Error: " . $mediaFile->processing_error);
      }

      // Check for related jobs
      $jobs = DB::table('jobs')
        ->where('payload', 'like', "%GenerateReelsFromVideo%")
        ->where('payload', 'like', "%\"mediaFileId\":{$mediaFileId}%")
        ->get();

      if ($jobs->count() > 0) {
        $this->info("\n📋 Active Jobs: " . $jobs->count());
        foreach ($jobs as $job) {
          $this->line("  Job ID: {$job->id}");
          $this->line("  Queue: {$job->queue}");
          $this->line("  Attempts: {$job->attempts}");
          $this->line("  Reserved: " . ($job->reserved_at ? date('H:i:s', $job->reserved_at) : 'No'));
          $this->line("  Available: " . date('H:i:s', $job->available_at));
        }
      } else {
        $this->warn("No active jobs found");
      }

      // Check for failed jobs
      $failedJobs = DB::table('failed_jobs')
        ->where('payload', 'like', "%GenerateReelsFromVideo%")
        ->where('payload', 'like', "%\"mediaFileId\":{$mediaFileId}%")
        ->get();

      if ($failedJobs->count() > 0) {
        $this->error("\n❌ Failed Jobs: " . $failedJobs->count());
        foreach ($failedJobs as $job) {
          $this->line("  Failed at: {$job->failed_at}");
          $this->line("  Exception: " . substr($job->exception, 0, 200) . "...");
        }
      }

      // Check generated reels (check if metadata column exists)
      $generatedReels = collect();
      try {
        if (Schema::hasColumn('media_files', 'metadata')) {
          $generatedReels = MediaFile::where('metadata->original_media_id', $mediaFileId)
            ->where('metadata->platform', '!=', null)
            ->get();
        }
      } catch (\Exception $e) {
        // Ignore metadata query errors
      }

      if ($generatedReels->count() > 0) {
        $this->info("\n✅ Generated Reels: " . $generatedReels->count());
        foreach ($generatedReels as $reel) {
          $platform = $reel->metadata['platform'] ?? 'unknown';
          $sizeMB = round($reel->size / 1024 / 1024, 2);
          $this->line("  {$platform}: {$reel->file_name} ({$sizeMB} MB)");
        }
      }

      if ($follow) {
        if ($mediaFile->status === 'completed' || $mediaFile->status === 'failed') {
          $this->info("\n✅ Job finished with status: {$mediaFile->status}");
          break;
        }
        sleep(3);
      }

    } while ($follow);

    return 0;
  }

  private function monitorAllJobs($follow)
  {
    do {
      $this->info("\n" . now()->format('H:i:s') . " - Monitoring all reel generation jobs...");

      // Active jobs
      $activeJobs = DB::table('jobs')
        ->where('payload', 'like', "%GenerateReelsFromVideo%")
        ->get();

      $this->info("📋 Active Jobs: " . $activeJobs->count());
      
      if ($activeJobs->count() > 0) {
        $data = [];
        foreach ($activeJobs as $job) {
          // Try to extract media_file_id from payload
          preg_match('/"mediaFileId":(\d+)/', $job->payload, $matches);
          $mediaFileId = $matches[1] ?? 'unknown';
          
          $data[] = [
            $job->id,
            $mediaFileId,
            $job->queue,
            $job->attempts,
            $job->reserved_at ? date('H:i:s', $job->reserved_at) : 'No',
            date('H:i:s', $job->available_at),
          ];
        }
        
        $this->table(
          ['Job ID', 'Media File', 'Queue', 'Attempts', 'Reserved', 'Available'],
          $data
        );
      }

      // Processing files
      $processingFiles = MediaFile::where('status', 'processing')
        ->where('file_type', 'video')
        ->get();

      $this->info("\n🔄 Processing Files: " . $processingFiles->count());
      
      if ($processingFiles->count() > 0) {
        $data = [];
        foreach ($processingFiles as $file) {
          $data[] = [
            $file->id,
            substr($file->file_name, 0, 30),
            $file->updated_at->diffForHumans(),
          ];
        }
        
        $this->table(
          ['ID', 'File Name', 'Last Updated'],
          $data
        );
      }

      // Failed jobs
      $failedJobs = DB::table('failed_jobs')
        ->where('payload', 'like', "%GenerateReelsFromVideo%")
        ->where('failed_at', '>', now()->subHours(24))
        ->count();

      if ($failedJobs > 0) {
        $this->error("\n❌ Failed Jobs (last 24h): " . $failedJobs);
      }

      if ($follow) {
        sleep(5);
      }

    } while ($follow);

    return 0;
  }
}
