<?php

namespace App\Jobs;

use App\Models\MediaFiles\MediaFile;

use App\Models\Publications\Publication;
use App\Notifications\MediaUploadProcessed;
use App\Services\Media\MediaProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\Social\SocialPostLog;
use App\Events\Publications\PublicationUpdated;

class ProcessBackgroundUpload implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  /**
   * The number of seconds the job can run before timing out.
   *
   * @var int
   */
  public $timeout = 3600;

  public function __construct(
    protected Publication $publication,
    protected MediaFile $mediaFile,
    protected ?string $tempPath,
    protected array $options = []
  ) {}

  public function handle(MediaProcessingService $mediaService): void
  {
    try {
      try {
        $this->mediaFile->update(['status' => 'processing']);
        
        // Broadcast processing start
        $this->broadcastProgress(0, 'Starting media processing...');

        if ($this->tempPath) {
          // 1. Move file to S3 (Standard Upload Flow)
          $this->broadcastProgress(10, 'Reading temporary file...');
          $fileContent = Storage::disk('local')->get($this->tempPath);
          if (!$fileContent) {
            throw new \Exception("Temporary file not found at: {$this->tempPath}");
          }

          $targetPath = $this->mediaFile->file_path;
          
          $this->broadcastProgress(30, 'Uploading to S3...');
          // Upload to S3
          Storage::disk('s3')->put($targetPath, $fileContent);

          $this->broadcastProgress(50, 'Cleaning up temporary files...');
          // Cleanup temp file
          Storage::disk('local')->delete($this->tempPath);
        } else {
          // 2. Direct Upload Flow (Already on S3)
          $this->broadcastProgress(10, 'Verifying S3 file...');
          
          // Check for S3 existence with retries and timeout
          $path = $this->mediaFile->getRawOriginal('file_path');
          $pathTrimmed = ltrim($path, '/');

          $found = false;
          $attempts = 0;
          $maxAttempts = 3; // Reduced from 5 to prevent hanging
          $timeout = 30; // 30 second total timeout
          $startTime = time();

          while (!$found && $attempts < $maxAttempts && (time() - $startTime) < $timeout) {
            try {
              if (Storage::disk('s3')->exists($path)) {
                $found = true;
              } elseif (Storage::disk('s3')->exists($pathTrimmed)) {
                $found = true;
                $path = $pathTrimmed;
              } else {
                $attempts++;
                if ($attempts < $maxAttempts && (time() - $startTime) < $timeout) {
                  Log::warning("ProcessBackgroundUpload: File not found yet in S3 ($path). Retrying ($attempts/$maxAttempts)...");
                  $this->broadcastProgress(20 + ($attempts * 10), "Verifying file existence (attempt $attempts)...");
                  sleep(1); // Reduced from 2 seconds
                }
              }
            } catch (\Exception $s3Error) {
              Log::error('S3 verification error', [
                'error' => $s3Error->getMessage(),
                'path' => $path,
                'attempt' => $attempts
              ]);
              $attempts++;
              if ($attempts < $maxAttempts && (time() - $startTime) < $timeout) {
                sleep(1);
              }
            }
          }

          if (!$found) {
            throw new \Exception("Direct upload file not found in S3 after {$maxAttempts} attempts or {$timeout}s timeout at: {$pathTrimmed}");
          }

          // Normalize path in DB if needed
          if ($this->mediaFile->getRawOriginal('file_path') !== $path) {
            $this->mediaFile->update(['file_path' => $path]);
          }
        }

        // Process video metadata if it's a video file
        $metadata = [];
        if ($this->mediaFile->file_type === 'video') {
          try {
            $this->broadcastProgress(60, 'Extracting video metadata...');
            $metadata = $this->extractVideoMetadata();
            Log::info('Video metadata extracted', [
              'media_file_id' => $this->mediaFile->id,
              'metadata' => $metadata
            ]);
          } catch (\Exception $e) {
            Log::warning('Failed to extract video metadata', [
              'media_file_id' => $this->mediaFile->id,
              'error' => $e->getMessage()
            ]);
            // Don't fail the entire job for metadata extraction failure
            $metadata = [];
          }
        }

        $this->broadcastProgress(80, 'Finalizing processing...');

        // Update status and metadata
        $this->mediaFile->update([
          'status' => 'completed',
          'size' => Storage::disk('s3')->size($this->mediaFile->getRawOriginal('file_path')),
          'metadata' => $metadata
        ]);

        // Auto-suggest content type based on duration if available
        if (isset($metadata['duration']) && $metadata['duration'] > 0) {
          $this->autoSuggestContentType($metadata['duration']);
        }

        // Auto-generate reels if enabled, it's a video, and AI is configured
        if ($this->mediaFile->file_type === 'video' 
            && config('media.reels.auto_generate', false)
            && $this->hasAIConfigured()) {
          Log::info('Auto-generating reels for video', ['media_file_id' => $this->mediaFile->id]);
          \App\Jobs\GenerateReelsFromVideo::dispatch(
            $this->mediaFile->id,
            $this->publication->id,
            [
              'platforms' => config('media.reels.default_platforms'),
              'add_subtitles' => config('media.reels.add_subtitles'),
              'language' => config('media.reels.default_language'),
            ]
          );
        }

        $this->broadcastProgress(90, 'Sending notifications...');

        // Notify user of success
        $this->publication->user->notify(new MediaUploadProcessed($this->publication, $this->mediaFile, 'success'));
        
        // Broadcast success via WebSocket
        $this->broadcastCompletion('success');

        // Update publication image if this was the main image
        if ($this->mediaFile->file_type === 'image' && !$this->publication->image) {
          $this->publication->update(['image' => Storage::url($this->mediaFile->getRawOriginal('file_path'))]);
        }

        $this->broadcastProgress(100, 'Processing completed successfully');

        // Check if we can release the "processing" lock
        if ($this->publication->status === 'processing') {
          // Check if there are any media files still processing
          $hasProcessingMedia = $this->publication->mediaFiles()
            ->where('media_files.status', 'processing')
            ->exists(); // current mediaFile is already 'completed' at this point

          if (!$hasProcessingMedia) {
            // Restore status based on schedule
            $newStatus = $this->publication->scheduled_at ? 'scheduled' : 'draft';
            $this->publication->update(['status' => $newStatus]);
          }
        }

        // Fire event to update frontend lists
        event(new PublicationUpdated($this->publication));
      } catch (\Exception $e) {
        Log::error('Background upload failed', [
          'error' => $e->getMessage(),
          'media_id' => $this->mediaFile->id,
          'publication_id' => $this->publication->id,
          'trace' => $e->getTraceAsString()
        ]);

        $this->mediaFile->update([
          'status' => 'failed',
          'processing_error' => $e->getMessage()
        ]);

        // Create a SocialPostLog entry for the failure so it appears in the logs tab
        SocialPostLog::create([
          'user_id' => $this->publication->user_id,
          'workspace_id' => $this->publication->workspace_id,
          'publication_id' => $this->publication->id,
          'media_file_id' => $this->mediaFile->id,
          'platform' => 'upload', // Indicate this is an upload failure
          'account_name' => 'Media Upload',
          'post_type' => $this->mediaFile->file_type,
          'content' => "Failed to process {$this->mediaFile->file_type}: {$this->mediaFile->file_name}",
          'status' => 'failed',
          'error_message' => $e->getMessage(),
          'published_at' => now(),
        ]);

        // Update publication status to failed if it's in processing state
        if ($this->publication->status === 'processing') {
          $this->publication->update(['status' => 'failed']);
        }

        // Log activity for tracking
        $this->publication->logActivity('media_upload_failed', [
          'media_file_id' => $this->mediaFile->id,
          'file_name' => $this->mediaFile->file_name,
          'error' => $e->getMessage()
        ]);

        $this->publication->user->notify(new MediaUploadProcessed($this->publication, $this->mediaFile, 'failed'));
      }
    } catch (\Throwable $outerException) {
      // Catch any exception that might occur in the catch block itself
      Log::error('Critical error in ProcessBackgroundUpload job', [
        'error' => $outerException->getMessage(),
        'media_id' => $this->mediaFile->id ?? null,
        'publication_id' => $this->publication->id ?? null,
        'trace' => $outerException->getTraceAsString()
      ]);

      // Try to update media file status if possible
      try {
        if (isset($this->mediaFile) && $this->mediaFile->id) {
          $this->mediaFile->update([
            'status' => 'failed',
            'processing_error' => 'Critical error: ' . $outerException->getMessage()
          ]);
        }
      } catch (\Exception $updateException) {
        Log::error('Failed to update media file status after critical error', [
          'error' => $updateException->getMessage()
        ]);
      }
    }
  }

  /**
   * Check if AI is configured for reel generation
   */
  private function hasAIConfigured(): bool
  {
    return !empty(config('services.openai.api_key'))
      || !empty(config('services.anthropic.api_key'))
      || !empty(config('services.gemini.api_key'))
      || !empty(config('services.deepseek.api_key'));
  }

  /**
   * Extract video metadata using FFmpeg or fallback methods
   */
  private function extractVideoMetadata(): array
  {
    $filePath = $this->mediaFile->getRawOriginal('file_path');
    $metadata = [];

    try {
      // Try FFmpeg if available
      if ($this->isFFmpegAvailable()) {
        $metadata = $this->extractWithFFmpeg($filePath);
      }
      
      // If no duration found, try to get it from file size estimation (rough approximation)
      if (!isset($metadata['duration'])) {
        Log::info('FFmpeg not available or failed, using fallback metadata extraction', [
          'media_file_id' => $this->mediaFile->id
        ]);
        
        // For now, we'll rely on frontend-provided metadata
        // The frontend should have already extracted duration before upload
        $metadata['duration'] = null; // Will be updated by frontend
      }

    } catch (\Exception $e) {
      Log::error('Failed to extract video metadata', [
        'error' => $e->getMessage(),
        'media_file_id' => $this->mediaFile->id
      ]);
    }

    return $metadata;
  }

  /**
   * Check if FFmpeg is available
   */
  private function isFFmpegAvailable(): bool
  {
    $output = shell_exec('which ffprobe 2>/dev/null');
    return !empty($output);
  }

  /**
   * Extract metadata using FFmpeg
   */
  private function extractWithFFmpeg(string $filePath): array
  {
    $metadata = [];
    
    // Download file temporarily for processing
    $tempFile = tempnam(sys_get_temp_dir(), 'video_');
    $fileContent = Storage::disk('s3')->get($filePath);
    file_put_contents($tempFile, $fileContent);

    try {
      // Use FFprobe to get video metadata
      $command = "ffprobe -v quiet -print_format json -show_format -show_streams " . escapeshellarg($tempFile);
      $output = shell_exec($command);
      
      if ($output) {
        $data = json_decode($output, true);
        
        if (isset($data['streams'])) {
          foreach ($data['streams'] as $stream) {
            if ($stream['codec_type'] === 'video') {
              $metadata['duration'] = isset($stream['duration']) ? (float)$stream['duration'] : null;
              $metadata['width'] = isset($stream['width']) ? (int)$stream['width'] : null;
              $metadata['height'] = isset($stream['height']) ? (int)$stream['height'] : null;
              
              if ($metadata['width'] && $metadata['height']) {
                $metadata['aspect_ratio'] = $metadata['width'] / $metadata['height'];
              }
              break;
            }
          }
        }
        
        // Fallback to format duration if stream duration not available
        if (!isset($metadata['duration']) && isset($data['format']['duration'])) {
          $metadata['duration'] = (float)$data['format']['duration'];
        }
      }
    } finally {
      // Clean up temp file
      if (file_exists($tempFile)) {
        unlink($tempFile);
      }
    }

    return $metadata;
  }

  /**
   * Auto-suggest content type based on video duration
   */
  private function autoSuggestContentType(float $duration): void
  {
    try {
      $contentTypeService = app(\App\Services\Publications\ContentTypeValidationService::class);
      $currentType = $this->publication->content_type;
      
      $mediaFile = [
        'duration' => $duration,
        'mime_type' => $this->mediaFile->mime_type,
        'type' => $this->mediaFile->mime_type
      ];
      
      $suggestedType = $contentTypeService->suggestContentTypeByDuration($mediaFile, $currentType);
      
      if ($suggestedType !== $currentType) {
        Log::info('Auto-suggesting content type change', [
          'publication_id' => $this->publication->id,
          'current_type' => $currentType,
          'suggested_type' => $suggestedType,
          'duration' => $duration
        ]);
        
        // Update publication content type
        $this->publication->update(['content_type' => $suggestedType]);
        
        // Log the change
        $this->publication->logActivity('content_type_auto_changed', [
          'from' => $currentType,
          'to' => $suggestedType,
          'reason' => "Video duration ({$duration}s) suggests {$suggestedType} format",
          'media_file_id' => $this->mediaFile->id
        ]);
        
        // Fire event to update frontend
        event(new \App\Events\Publications\PublicationUpdated($this->publication));
      }
    } catch (\Exception $e) {
      Log::error('Failed to auto-suggest content type', [
        'error' => $e->getMessage(),
        'publication_id' => $this->publication->id,
        'media_file_id' => $this->mediaFile->id
      ]);
    }
  }

  /**
   * Broadcast processing progress via WebSocket
   */
  private function broadcastProgress(int $percentage, string $message = ''): void
  {
    try {
      $userId = $this->publication->user_id;
      $jobId = "media_processing_{$this->mediaFile->id}";
      
      broadcast(new \App\Events\ProcessingProgressUpdated(
        $userId,
        $jobId,
        $this->publication->id,
        [
          'progress' => $percentage,
          'message' => $message,
          'media_file_id' => $this->mediaFile->id,
          'file_name' => $this->mediaFile->file_name,
          'type' => 'media_processing'
        ]
      ));
    } catch (\Exception $e) {
      Log::warning('Failed to broadcast progress', [
        'error' => $e->getMessage(),
        'percentage' => $percentage,
        'message' => $message
      ]);
    }
  }

  /**
   * Broadcast processing completion via WebSocket
   */
  private function broadcastCompletion(string $status, string $errorMessage = ''): void
  {
    try {
      $userId = $this->publication->user_id;
      
      broadcast(new \App\Events\VideoProcessingCompleted(
        $userId,
        $this->publication->id,
        $status,
        $errorMessage
      ));
    } catch (\Exception $e) {
      Log::warning('Failed to broadcast completion', [
        'error' => $e->getMessage(),
        'status' => $status,
        'errorMessage' => $errorMessage
      ]);
    }
  }
}
