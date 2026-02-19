<?php

namespace App\Jobs;

use App\Events\ProcessingProgressUpdated;
use App\Events\VideoProcessingCompleted;
use App\Models\Publications\Publication;
use App\Services\Video\VideoProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessVideoJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 1800; // 30 minutes
  public $tries = 2;

  private int $totalSteps = 5;
  private float $startTime;

  public function __construct(
    public int $publicationId,
    public string $videoKey
  ) {
    $this->onQueue('default');
  }

  /**
   * Get tags for better queue monitoring
   */
  public function tags(): array
  {
    return [
      'video-processing',
      "publication:{$this->publicationId}",
    ];
  }

  public function handle(VideoProcessingService $service): void
  {
    $this->startTime = microtime(true);
    $jobId = $this->job?->getJobId() ?? uniqid('job_', true);
    
    $publication = Publication::find($this->publicationId);
    
    if (!$publication) {
      Log::error('Publication not found for video processing', ['id' => $this->publicationId]);
      return;
    }

    $userId = $publication->user_id;

    Log::info('🎬 Starting video processing job', [
      'publication_id' => $this->publicationId,
      'video_key' => $this->videoKey,
      'job_id' => $jobId,
      'user_id' => $userId,
    ]);

    try {
      // Update publication status
      $publication->update(['processing_status' => 'processing']);

      // Step 1: Download from S3
      $this->updateProgress($jobId, $userId, 10, 'Downloading video', 1);
      $localPath = $this->downloadFromS3($this->videoKey);
      
      // Step 2: Extract metadata
      $this->updateProgress($jobId, $userId, 30, 'Analyzing video', 2);
      $metadata = $service->extractMetadata($localPath);
      
      // Step 3: Generate thumbnails
      $this->updateProgress($jobId, $userId, 50, 'Generating thumbnails', 3);
      $thumbnails = $service->generateThumbnails($localPath);
      
      // Step 4: Optimize video
      $this->updateProgress($jobId, $userId, 70, 'Optimizing video', 4);
      $optimizedPath = $service->optimizeVideo($localPath);
      
      // Step 5: Upload results
      $this->updateProgress($jobId, $userId, 90, 'Uploading results', 5);
      $resultKey = $service->uploadToS3($optimizedPath);
      
      // Complete
      $this->updateProgress($jobId, $userId, 100, 'Completed', 5);
      
      // Update publication with processed video
      $publication->update([
        'processed_video_key' => $resultKey,
        'processing_status' => 'completed',
        'metadata' => array_merge($publication->metadata ?? [], [
          'video_metadata' => $metadata,
          'thumbnails' => $thumbnails,
          'processed_at' => now()->toIso8601String(),
        ]),
      ]);
      
      // Cleanup temporary files
      $this->cleanupTempFiles([$localPath, $optimizedPath]);
      
      // Clear progress cache
      Cache::forget("processing_progress:{$jobId}");
      
      // Broadcast completion
      broadcast(new VideoProcessingCompleted($userId, $this->publicationId, 'completed'));
      
      $totalDuration = round(microtime(true) - $this->startTime, 2);
      Log::info('🎉 Video processing completed successfully', [
        'publication_id' => $this->publicationId,
        'job_id' => $jobId,
        'total_duration_seconds' => $totalDuration,
      ]);
      
    } catch (\Exception $e) {
      $this->handleProcessingFailure($jobId, $userId, $publication, $e);
      throw $e;
    }
  }

  /**
   * Handle job failure
   */
  public function failed(\Throwable $exception): void
  {
    $jobId = $this->job?->getJobId() ?? 'unknown';
    
    Log::error('❌ Video processing job failed', [
      'publication_id' => $this->publicationId,
      'job_id' => $jobId,
      'error' => $exception->getMessage(),
      'trace' => $exception->getTraceAsString(),
    ]);

    $publication = Publication::find($this->publicationId);
    if ($publication) {
      $userId = $publication->user_id;
      
      $publication->update([
        'processing_status' => 'failed',
        'processing_error' => $exception->getMessage(),
      ]);
      
      // Clear progress cache
      Cache::forget("processing_progress:{$jobId}");
      
      // Broadcast failure
      broadcast(new VideoProcessingCompleted(
        $userId,
        $this->publicationId,
        'failed',
        $exception->getMessage()
      ));
    }
  }

  /**
   * Update processing progress and broadcast to frontend
   */
  private function updateProgress(
    string $jobId,
    int $userId,
    int $percentage,
    string $currentStep,
    int $completedSteps
  ): void {
    $key = "processing_progress:{$jobId}";
    
    // Calculate ETA based on elapsed time and progress
    $elapsedTime = microtime(true) - $this->startTime;
    $eta = null;
    
    if ($percentage > 0 && $percentage < 100) {
      $estimatedTotalTime = ($elapsedTime / $percentage) * 100;
      $eta = (int) round($estimatedTotalTime - $elapsedTime);
    }
    
    $data = [
      'progress' => $percentage,
      'current_step' => $currentStep,
      'completed_steps' => $completedSteps,
      'total_steps' => $this->totalSteps,
      'eta' => $eta,
      'updated_at' => now()->timestamp,
    ];
    
    // Store in Redis cache with 2-hour expiry
    Cache::put($key, $data, now()->addHours(2));
    
    // Broadcast via WebSocket
    broadcast(new ProcessingProgressUpdated($userId, $jobId, $this->publicationId, $data));
    
    Log::info("📊 Processing progress: {$percentage}%", [
      'job_id' => $jobId,
      'publication_id' => $this->publicationId,
      'step' => $currentStep,
      'eta_seconds' => $eta,
    ]);
  }

  /**
   * Download video from S3 to local temporary file
   */
  private function downloadFromS3(string $s3Key): string
  {
    if (!Storage::disk('s3')->exists($s3Key)) {
      throw new \Exception("Video file not found in S3: {$s3Key}");
    }

    $fileSize = Storage::disk('s3')->size($s3Key);
    if ($fileSize === 0 || $fileSize === false) {
      throw new \Exception("Video file is empty or inaccessible in S3: {$s3Key}");
    }

    $tempPath = sys_get_temp_dir() . '/' . uniqid('video_', true) . '.mp4';
    
    Log::info('📥 Downloading video from S3', [
      's3_key' => $s3Key,
      'file_size_mb' => round($fileSize / 1024 / 1024, 2),
      'temp_path' => $tempPath,
    ]);

    try {
      $stream = Storage::disk('s3')->readStream($s3Key);
      
      if ($stream === false) {
        throw new \Exception("Failed to open stream from S3: {$s3Key}");
      }

      $localStream = fopen($tempPath, 'w');
      if ($localStream === false) {
        fclose($stream);
        throw new \Exception("Failed to create local file: {$tempPath}");
      }

      // Stream copy in chunks
      $chunkSize = 8 * 1024 * 1024; // 8MB chunks
      
      while (!feof($stream)) {
        $chunk = fread($stream, $chunkSize);
        if ($chunk === false) {
          break;
        }
        
        $written = fwrite($localStream, $chunk);
        if ($written === false) {
          throw new \Exception("Failed to write chunk to local file");
        }
      }
      
      fclose($stream);
      fclose($localStream);
      
      if (!file_exists($tempPath) || filesize($tempPath) === 0) {
        throw new \Exception("Failed to download video or file is empty: {$tempPath}");
      }

      Log::info('✅ Video downloaded successfully', [
        'temp_path' => $tempPath,
        'size_mb' => round(filesize($tempPath) / 1024 / 1024, 2),
      ]);

      return $tempPath;
      
    } catch (\Exception $e) {
      if (isset($stream) && is_resource($stream)) {
        fclose($stream);
      }
      if (isset($localStream) && is_resource($localStream)) {
        fclose($localStream);
      }
      if (file_exists($tempPath)) {
        @unlink($tempPath);
      }
      
      throw $e;
    }
  }

  /**
   * Handle processing failure with cleanup
   */
  private function handleProcessingFailure(
    string $jobId,
    int $userId,
    Publication $publication,
    \Exception $e
  ): void {
    $totalDuration = round(microtime(true) - $this->startTime, 2);
    
    Log::error('❌ Video processing failed', [
      'publication_id' => $this->publicationId,
      'job_id' => $jobId,
      'error' => $e->getMessage(),
      'file' => $e->getFile(),
      'line' => $e->getLine(),
      'duration_seconds' => $totalDuration,
    ]);

    // Update progress with error state
    $errorData = [
      'progress' => 0,
      'current_step' => 'Failed: ' . $e->getMessage(),
      'completed_steps' => 0,
      'total_steps' => $this->totalSteps,
      'eta' => null,
      'updated_at' => now()->timestamp,
      'error' => $e->getMessage(),
    ];
    
    Cache::put("processing_progress:{$jobId}", $errorData, now()->addHours(2));
    
    // Update publication
    $publication->update([
      'processing_status' => 'failed',
      'processing_error' => $e->getMessage(),
    ]);
    
    // Broadcast failure
    broadcast(new VideoProcessingCompleted(
      $userId,
      $this->publicationId,
      'failed',
      $e->getMessage()
    ));
  }

  /**
   * Cleanup temporary files
   */
  private function cleanupTempFiles(array $paths): void
  {
    foreach ($paths as $path) {
      if ($path && file_exists($path)) {
        try {
          @unlink($path);
          Log::info('🗑️ Cleaned up temporary file', ['path' => $path]);
        } catch (\Exception $e) {
          Log::warning('Failed to cleanup temporary file', [
            'path' => $path,
            'error' => $e->getMessage(),
          ]);
        }
      }
    }
  }
}
