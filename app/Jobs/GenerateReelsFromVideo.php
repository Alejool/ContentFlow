<?php

namespace App\Jobs;

use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationMedia;
use App\Services\Video\VideoClipGeneratorService;
use App\Services\Video\VideoAnalysisService;
use App\Notifications\ReelsGenerationCompleted;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateReelsFromVideo implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 1800; // 30 minutes
  public $tries = 2;
  public $uniqueFor = 3600; // Prevent duplicate jobs for 1 hour
  public $maxExceptions = 1; // Fail after 1 exception

  private float $startTime;
  private int $totalSteps = 3;

  public function __construct(
    private int $mediaFileId,
    private ?int $publicationId = null,
    private array $options = []
  ) {
    $this->onQueue('default');
  }

  /**
   * Get the unique ID for the job to prevent duplicates
   * More robust deduplication using hash of all parameters
   */
  public function uniqueId(): string
  {
    $platforms = $this->options['platforms'] ?? ['instagram'];
    sort($platforms); // Ensure consistent ordering
    
    $uniqueData = [
      'media_file_id' => $this->mediaFileId,
      'publication_id' => $this->publicationId ?? 'none',
      'platforms' => implode(',', $platforms),
      'add_subtitles' => $this->options['add_subtitles'] ?? true,
      'language' => $this->options['language'] ?? 'es',
      'generate_clips' => $this->options['generate_clips'] ?? false,
    ];
    
    return 'reel-gen-' . md5(json_encode($uniqueData));
  }

  /**
   * Get tags for better queue monitoring
   */
  public function tags(): array
  {
    return [
      'reel-generation',
      "media:{$this->mediaFileId}",
      "publication:{$this->publicationId}",
      'user:' . (MediaFile::find($this->mediaFileId)?->user_id ?? 'unknown'),
    ];
  }

  public function handle(
    VideoClipGeneratorService $clipGenerator,
    VideoAnalysisService $analysisService
  ): void {
    $this->startTime = microtime(true);
    $jobId = $this->job?->getJobId() ?? uniqid('job_', true);
    
    Log::info('🎬 Starting reel generation job', [
      'media_file_id' => $this->mediaFileId,
      'publication_id' => $this->publicationId,
      'options' => $this->options,
      'job_id' => $jobId
    ]);

    $mediaFile = MediaFile::find($this->mediaFileId);
    
    if (!$mediaFile) {
      Log::error('MediaFile not found for reel generation', ['id' => $this->mediaFileId]);
      return;
    }

    $userId = $mediaFile->user_id;

    try {
      $mediaFile->update(['status' => 'processing']);
      
      // Initialize progress tracking
      $this->updateProgress($jobId, $userId, 5, 'Starting reel generation', 0);

      // Step 1: Download and analyze video content
      $stepStart = microtime(true);
      $this->updateProgress($jobId, $userId, 15, 'Downloading and analyzing video', 1);
      
      Log::info('📥 Step 1/3: Downloading and analyzing video', ['media_file_id' => $this->mediaFileId]);
      
      $s3Path = $mediaFile->getRawOriginal('file_path');
      $videoPath = $this->downloadVideo($s3Path);
      
      Log::info('🤖 Calling AI analysis service', ['video_path' => $videoPath]);
      $analysis = $analysisService->analyzeVideoContent($videoPath);
      
      $stepDuration = round(microtime(true) - $stepStart, 2);
      Log::info('✅ Step 1 completed', [
        'duration_seconds' => $stepDuration,
        'analysis_keys' => array_keys($analysis ?? [])
      ]);
      
      $this->updateProgress($jobId, $userId, 35, 'Analysis complete', 1);

      // Step 2: Generate optimized reels for each platform
      $stepStart = microtime(true);
      // OPTIMIZED: Generate only 1 reel by default for speed
      $platforms = $this->options['platforms'] ?? ['instagram'];
      $this->updateProgress($jobId, $userId, 40, 'Generating reels for platforms', 2);
      
      Log::info("🎥 Step 2/3: Generating reels for platforms", [
        'platforms' => $platforms,
        'count' => count($platforms)
      ]);
      
      $generatedReels = [];

      foreach ($platforms as $index => $platform) {
        $platformStart = microtime(true);
        
        // Update progress for each platform
        $platformProgress = 40 + (($index + 1) / count($platforms)) * 30;
        $this->updateProgress($jobId, $userId, (int) $platformProgress, "Generating {$platform} reel", 2);
        
        Log::info("🔄 Processing platform {$platform} (" . ($index + 1) . "/" . count($platforms) . ")", [
          'media_file_id' => $this->mediaFileId
        ]);
        
        $reelOptions = [
          'add_subtitles' => $this->options['add_subtitles'] ?? true,
          'language' => $this->options['language'] ?? 'es',
          'watermark_path' => $this->options['watermark_path'] ?? null,
        ];

        $reel = $clipGenerator->createOptimizedReel($mediaFile, $platform, $reelOptions);
        
        Log::info("💾 Creating MediaFile record for {$platform} reel");
        
        // Create new MediaFile for the generated reel
        $reelMediaFile = MediaFile::create([
          'user_id' => $mediaFile->user_id,
          'workspace_id' => $mediaFile->workspace_id,
          'publication_id' => $this->publicationId,
          'file_path' => $reel['path'],
          'file_name' => basename($reel['path']),
          'file_type' => 'reel',
          'mime_type' => 'video/mp4',
          'size' => \Illuminate\Support\Facades\Storage::size($reel['path']),
          'status' => 'completed',
          'metadata' => [
            'platform' => $platform,
            'optimized_for' => $platform,
            'original_media_id' => $this->mediaFileId,
            'duration' => $reel['duration'],
            'specs' => $reel['specs'],
            'ai_analysis' => $analysis,
            'ai_generated' => true,
            'generation_type' => 'ai_reel',
          ],
        ]);

        $generatedReels[$platform] = $reelMediaFile;

        // If publication exists, attach the reel
        if ($this->publicationId) {
          Log::info("🔗 Attaching reel to publication", [
            'publication_id' => $this->publicationId,
            'platform' => $platform
          ]);
          
          $publication = Publication::find($this->publicationId);
          if ($publication) {
            $maxOrder = $publication->media()->max('order') ?? -1;
            
            PublicationMedia::create([
              'publication_id' => $this->publicationId,
              'media_file_id' => $reelMediaFile->id,
              'order' => $maxOrder + 1,
            ]);

            // Update publication with AI-generated content suggestions (only once)
            if ($index === 0 && empty($publication->description)) {
              Log::info("📝 Generating content suggestions for publication");
              $suggestions = $analysisService->generateContentSuggestions($analysis, $platform);
              $publication->update([
                'description' => $suggestions['description'] ?? $analysis['ai_description'] ?? '',
                'hashtags' => implode(' ', $suggestions['hashtags'] ?? $analysis['suggested_hashtags'] ?? []),
              ]);
            }
          }
        }

        $platformDuration = round(microtime(true) - $platformStart, 2);
        Log::info("✅ Platform {$platform} completed", ['duration_seconds' => $platformDuration]);
      }

      $stepDuration = round(microtime(true) - $stepStart, 2);
      Log::info('✅ Step 2 completed', [
        'duration_seconds' => $stepDuration,
        'platforms_generated' => count($generatedReels)
      ]);

      // Step 3: Generate highlight clips if requested
      if ($this->options['generate_clips'] ?? false) {
        $stepStart = microtime(true);
        $this->updateProgress($jobId, $userId, 75, 'Generating highlight clips', 3);
        
        Log::info('✂️ Step 3/3: Generating highlight clips', ['media_file_id' => $this->mediaFileId]);
        
        $clips = $clipGenerator->generateClipsFromVideo($mediaFile, [
          'clip_duration' => $this->options['clip_duration'] ?? 15,
          'max_clips' => $this->options['max_clips'] ?? 3,
          'auto_detect_highlights' => true,
        ]);

        foreach ($clips as $index => $clip) {
          $clipMediaFile = MediaFile::create([
            'user_id' => $mediaFile->user_id,
            'workspace_id' => $mediaFile->workspace_id,
            'publication_id' => $this->publicationId,
            'file_path' => $clip['path'],
            'file_name' => "clip_{$index}_" . basename($clip['path']),
            'file_type' => 'video',
            'mime_type' => 'video/mp4',
            'size' => \Illuminate\Support\Facades\Storage::size($clip['path']),
            'status' => 'completed',
            'metadata' => [
              'type' => 'highlight_clip',
              'original_media_id' => $this->mediaFileId,
              'start_time' => $clip['start_time'],
              'duration' => $clip['duration'],
              'highlight_score' => $clip['highlight_score'] ?? null,
            ],
          ]);

          if ($this->publicationId) {
            $publication = Publication::find($this->publicationId);
            if ($publication) {
              $maxOrder = $publication->media()->max('order') ?? -1;
              
              PublicationMedia::create([
                'publication_id' => $this->publicationId,
                'media_file_id' => $clipMediaFile->id,
                'order' => $maxOrder + 1,
              ]);
            }
          }
        }

        $stepDuration = round(microtime(true) - $stepStart, 2);
        Log::info('✅ Step 3 completed', [
          'duration_seconds' => $stepDuration,
          'clips_generated' => count($clips)
        ]);
        
        $this->updateProgress($jobId, $userId, 95, 'Clips generated', 3);
      } else {
        Log::info('⏭️ Step 3 skipped: Clip generation not requested');
        $this->updateProgress($jobId, $userId, 95, 'Finalizing', 3);
      }

      $mediaFile->update([
        'status' => 'completed',
        'metadata' => array_merge($mediaFile->metadata ?? [], [
          'reels_generated' => true,
          'analysis' => $analysis,
          'generated_at' => now()->toIso8601String(),
        ]),
      ]);
      
      // Complete progress
      $this->updateProgress($jobId, $userId, 100, 'Completed', 3);
      
      // Clear progress cache
      \Illuminate\Support\Facades\Cache::forget("processing_progress:{$jobId}");

      // Notify user
      if ($mediaFile->user) {
        Log::info('📧 Sending notification to user');
        $mediaFile->user->notify(new ReelsGenerationCompleted(
          $mediaFile, 
          $generatedReels,
          $this->publicationId
        ));
      }
      
      // Broadcast completion
      if ($this->publicationId) {
        broadcast(new \App\Events\VideoProcessingCompleted($userId, $this->publicationId, 'completed'));
      }

      $totalDuration = round(microtime(true) - $this->startTime, 2);
      Log::info('🎉 Reels generation completed successfully', [
        'media_file_id' => $this->mediaFileId,
        'platforms' => array_keys($generatedReels),
        'total_duration_seconds' => $totalDuration,
        'total_duration_minutes' => round($totalDuration / 60, 2)
      ]);

    } catch (\Exception $e) {
      $totalDuration = round(microtime(true) - $this->startTime, 2);
      Log::error('❌ Reels generation failed', [
        'media_file_id' => $this->mediaFileId,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'duration_seconds' => $totalDuration,
        'trace' => $e->getTraceAsString(),
      ]);

      $mediaFile->update([
        'status' => 'failed',
        'processing_error' => $e->getMessage()
      ]);
      
      // Update progress with error
      $jobId = $this->job?->getJobId() ?? uniqid('job_', true);
      $this->updateProgressError($jobId, $userId, $e->getMessage());
      
      // Broadcast failure
      if ($this->publicationId) {
        broadcast(new \App\Events\VideoProcessingCompleted($userId, $this->publicationId, 'failed', $e->getMessage()));
      }
      
      throw $e;
    }
  }

  /**
   * Handle job failure
   */
  public function failed(\Throwable $exception): void
  {
    Log::error('❌ Reel generation job failed', [
      'media_file_id' => $this->mediaFileId,
      'error' => $exception->getMessage(),
    ]);

    $mediaFile = MediaFile::find($this->mediaFileId);
    if ($mediaFile) {
      $userId = $mediaFile->user_id;
      
      $mediaFile->update([
        'status' => 'failed',
        'processing_error' => $exception->getMessage()
      ]);
      
      // Clear progress cache
      $jobId = $this->job?->getJobId() ?? uniqid('job_', true);
      \Illuminate\Support\Facades\Cache::forget("processing_progress:{$jobId}");
      
      // Broadcast failure
      if ($this->publicationId) {
        broadcast(new \App\Events\VideoProcessingCompleted($userId, $this->publicationId, 'failed', $exception->getMessage()));
      }
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
    \Illuminate\Support\Facades\Cache::put($key, $data, now()->addHours(2));
    
    // Broadcast via WebSocket
    if ($this->publicationId) {
      broadcast(new \App\Events\ProcessingProgressUpdated($userId, $jobId, $this->publicationId, $data));
    }
  }

  /**
   * Update progress with error state
   */
  private function updateProgressError(string $jobId, int $userId, string $errorMessage): void
  {
    $key = "processing_progress:{$jobId}";
    
    $data = [
      'progress' => 0,
      'current_step' => 'Failed: ' . $errorMessage,
      'completed_steps' => 0,
      'total_steps' => $this->totalSteps,
      'eta' => null,
      'updated_at' => now()->timestamp,
      'error' => $errorMessage,
    ];
    
    \Illuminate\Support\Facades\Cache::put($key, $data, now()->addHours(2));
    
    if ($this->publicationId) {
      broadcast(new \App\Events\ProcessingProgressUpdated($userId, $jobId, $this->publicationId, $data));
    }
  }

  /**
   * Download video with streaming and chunked processing
   * Optimized for large files (1GB+)
   */
  private function downloadVideo(string $s3Path): string
  {
    // Validate S3 file exists and has content
    if (!\Illuminate\Support\Facades\Storage::exists($s3Path)) {
      throw new \Exception("Video file not found in S3: {$s3Path}");
    }

    $fileSize = \Illuminate\Support\Facades\Storage::size($s3Path);
    if ($fileSize === 0 || $fileSize === false) {
      throw new \Exception("Video file is empty or inaccessible in S3: {$s3Path} (size: {$fileSize})");
    }

    $fileSizeMB = round($fileSize / 1024 / 1024, 2);
    
    Log::info('Starting video download with streaming', [
      's3_path' => $s3Path,
      'file_size' => $fileSize,
      'file_size_mb' => $fileSizeMB,
      'strategy' => $fileSizeMB > 500 ? 'chunked_streaming' : 'direct_streaming'
    ]);

    $tempPath = sys_get_temp_dir() . '/' . \Illuminate\Support\Str::uuid() . '.mp4';
    $startTime = microtime(true);
    
    try {
      // Use streaming to avoid loading entire file into memory
      $stream = \Illuminate\Support\Facades\Storage::readStream($s3Path);
      
      if ($stream === false) {
        throw new \Exception("Failed to open stream from S3: {$s3Path}");
      }

      $localStream = fopen($tempPath, 'w');
      if ($localStream === false) {
        fclose($stream);
        throw new \Exception("Failed to create local file: {$tempPath}");
      }

      // Stream copy in chunks to avoid memory issues
      // Use 8MB chunks for better performance with large files
      $chunkSize = 8 * 1024 * 1024; // 8MB
      $bytesWritten = 0;
      $lastLogTime = microtime(true);
      
      while (!feof($stream)) {
        $chunk = fread($stream, $chunkSize);
        if ($chunk === false) {
          break;
        }
        
        $written = fwrite($localStream, $chunk);
        if ($written === false) {
          throw new \Exception("Failed to write chunk to local file");
        }
        
        $bytesWritten += $written;
        
        // Log progress every 5 seconds for large files
        if ($fileSizeMB > 100 && (microtime(true) - $lastLogTime) > 5) {
          $progress = round(($bytesWritten / $fileSize) * 100, 1);
          Log::info("Download progress: {$progress}%", [
            'bytes_written' => $bytesWritten,
            'bytes_written_mb' => round($bytesWritten / 1024 / 1024, 2),
            'total_mb' => $fileSizeMB
          ]);
          $lastLogTime = microtime(true);
        }
      }
      
      fclose($stream);
      fclose($localStream);
      
      // Verify downloaded file
      if (!file_exists($tempPath) || filesize($tempPath) === 0) {
        throw new \Exception("Failed to download video or file is empty: {$tempPath}");
      }

      $downloadTime = round(microtime(true) - $startTime, 2);
      $downloadSpeed = $fileSizeMB / max($downloadTime, 0.1); // MB/s
      
      Log::info('Video downloaded successfully', [
        'temp_path' => $tempPath,
        'downloaded_size' => filesize($tempPath),
        'downloaded_size_mb' => round(filesize($tempPath) / 1024 / 1024, 2),
        'download_time_seconds' => $downloadTime,
        'download_speed_mbps' => round($downloadSpeed, 2)
      ]);

      return $tempPath;
      
    } catch (\Exception $e) {
      // Clean up on failure
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
}
