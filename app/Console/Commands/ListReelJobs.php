<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\MediaFiles\MediaFile;

class ListReelJobs extends Command
{
  protected $signature = 'reels:list {--status=all}';
  protected $description = 'List all media files and their reel generation status';

  public function handle()
  {
    $status = $this->option('status');

    $this->info("📋 Media Files - Reel Generation Status\n");

    // Get media files based on status
    $query = MediaFile::where('file_type', 'video')
      ->orderBy('updated_at', 'desc');

    if ($status !== 'all') {
      $query->where('status', $status);
    }

    $mediaFiles = $query->limit(20)->get();

    if ($mediaFiles->isEmpty()) {
      $this->warn("No media files found");
      return 0;
    }

    $data = [];
    foreach ($mediaFiles as $file) {
      // Check if there are active jobs for this file
      $hasActiveJob = DB::table('jobs')
        ->where('payload', 'like', "%GenerateReelsFromVideo%")
        ->where('payload', 'like', "%\"mediaFileId\":{$file->id}%")
        ->exists();

      // Check if there are failed jobs
      $hasFailedJob = DB::table('failed_jobs')
        ->where('payload', 'like', "%GenerateReelsFromVideo%")
        ->where('payload', 'like', "%\"mediaFileId\":{$file->id}%")
        ->exists();

      // Count generated reels (check if metadata column exists)
      $reelsCount = 0;
      try {
        if (Schema::hasColumn('media_files', 'metadata')) {
          $reelsCount = MediaFile::where('metadata->original_media_id', $file->id)
            ->where('metadata->platform', '!=', null)
            ->count();
        } else {
          // Fallback: check by file name pattern or publication_id
          $reelsCount = MediaFile::where('file_name', 'like', "%{$file->id}%")
            ->where('file_name', 'like', '%_instagram%')
            ->orWhere('file_name', 'like', '%_tiktok%')
            ->orWhere('file_name', 'like', '%_youtube_shorts%')
            ->count();
        }
      } catch (\Exception $e) {
        // Ignore metadata query errors
        $reelsCount = 0;
      }

      $statusIcon = match($file->status) {
        'processing' => '🔄',
        'completed' => '✅',
        'failed' => '❌',
        default => '⚪'
      };

      $jobStatus = '';
      if ($hasActiveJob) {
        $jobStatus = '🔵 Active Job';
      } elseif ($hasFailedJob) {
        $jobStatus = '🔴 Failed Job';
      } elseif ($reelsCount > 0) {
        $jobStatus = "✅ {$reelsCount} reels";
      }

      $data[] = [
        $file->id,
        $statusIcon . ' ' . $file->status,
        substr($file->file_name, 0, 30),
        round($file->size / 1024 / 1024, 1) . ' MB',
        $file->updated_at->diffForHumans(),
        $jobStatus,
      ];
    }

    $this->table(
      ['ID', 'Status', 'File Name', 'Size', 'Updated', 'Job Status'],
      $data
    );

    $this->newLine();
    $this->info("💡 Tips:");
    $this->line("  • Monitor a specific file: php artisan reels:monitor <ID> --follow");
    $this->line("  • Filter by status: php artisan reels:list --status=processing");
    $this->line("  • View all jobs: php artisan reels:monitor");
    $this->newLine();

    // Show active jobs summary
    $activeJobsCount = DB::table('jobs')
      ->where('payload', 'like', "%GenerateReelsFromVideo%")
      ->count();

    $processingCount = MediaFile::where('status', 'processing')
      ->where('file_type', 'video')
      ->count();

    if ($activeJobsCount > 0 || $processingCount > 0) {
      $this->info("📊 Summary:");
      $this->line("  • Active jobs in queue: {$activeJobsCount}");
      $this->line("  • Files processing: {$processingCount}");
      
      if ($activeJobsCount > 0) {
        $this->newLine();
        $this->warn("⚠️  There are active jobs. Make sure queue worker is running:");
        $this->line("     php artisan queue:work");
      }
    }

    return 0;
  }
}
