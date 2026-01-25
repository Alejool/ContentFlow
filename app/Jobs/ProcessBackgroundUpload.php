<?php

namespace App\Jobs;

use App\Models\MediaFile;
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

class ProcessBackgroundUpload implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  /**
   * The number of seconds the job can run before timing out.
   *
   * @var int
   */
  public $timeout = 3600; // 1 hour for large files

  public function __construct(
    protected Publication $publication,
    protected MediaFile $mediaFile,
    protected ?string $tempPath,
    protected array $options = []
  ) {}

  public function handle(MediaProcessingService $mediaService): void
  {
    try {
      $this->mediaFile->update(['status' => 'processing']);

      if ($this->tempPath) {
        // 1. Move file to S3 (Standard Upload Flow)
        $fileContent = Storage::disk('local')->get($this->tempPath);
        if (!$fileContent) {
          throw new \Exception("Temporary file not found at: {$this->tempPath}");
        }

        $targetPath = $this->mediaFile->file_path;

        // Upload to S3
        Storage::disk('s3')->put($targetPath, $fileContent);

        // Re-instantiate UploadedFile from tempPath for potential thumbnail generation
        // (Simplified: we skip complex thumbnail generation logic here for brevity,
        // assumes thumbnails were handled or will be handled by a separate dedicated job)

        // Cleanup temp file
        Storage::disk('local')->delete($this->tempPath);
      } else {
        // 2. Direct Upload Flow (Already on S3)
        // Check for S3 existence (account for potential leading slash mismatch)
        $path = $this->mediaFile->file_path;
        $pathTrimmed = ltrim($path, '/');

        if (!Storage::disk('s3')->exists($path) && !Storage::disk('s3')->exists($pathTrimmed)) {
          // Retry logic or soft-fail could be added here, but for now explicitly throw with the path
          // Try one wait cycle for S3 consistency?
          sleep(2);
          if (!Storage::disk('s3')->exists($pathTrimmed)) {
            throw new \Exception("Direct upload file not found in S3 at: {$pathTrimmed} (Original: {$path})");
          }
        }

        // Normalize path if needed (update BD if we found it under trimmed path but BD had slash)
        if ($path !== $pathTrimmed && Storage::disk('s3')->exists($pathTrimmed)) {
          $this->mediaFile->update(['file_path' => $pathTrimmed]);
          $path = $pathTrimmed;
        }
      }

      // Update status
      $this->mediaFile->update([
        'status' => 'completed',
        'size' => Storage::disk('s3')->size($this->mediaFile->file_path)
      ]);

      // Notify user
      $this->publication->user->notify(new MediaUploadProcessed($this->publication, $this->mediaFile, 'success'));

      // Update publication image if this was the main image
      if ($this->mediaFile->file_type === 'image' && !$this->publication->image) {
        $this->publication->update(['image' => \Illuminate\Support\Facades\Storage::url($this->mediaFile->file_path)]);
      }

      // Fire event to update frontend lists
      // event(new \App\Events\Publications\PublicationUpdated($this->publication));

    } catch (\Exception $e) {
      Log::error('Background upload failed', [
        'error' => $e->getMessage(),
        'media_id' => $this->mediaFile->id
      ]);

      $this->mediaFile->update([
        'status' => 'failed',
        'processing_error' => $e->getMessage()
      ]);

      $this->publication->user->notify(new MediaUploadProcessed($this->publication, $this->mediaFile, 'failed'));
    }
  }
}
