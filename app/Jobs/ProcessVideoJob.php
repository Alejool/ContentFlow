<?php

namespace App\Jobs;

use App\Models\VideoProcessingJob as VideoProcessingJobModel;
use App\Services\VideoProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessVideoJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 600; // 10 minutes
  public $tries = 3;

  /**
   * Create a new job instance.
   */
  public function __construct(
    public int $jobId
  ) {}

  /**
   * Execute the job.
   */
  public function handle(VideoProcessingService $service): void
  {
    $job = VideoProcessingJobModel::findOrFail($this->jobId);

    try {
      $job->update([
        'status' => 'processing',
        'started_at' => now(),
      ]);

      Log::info("Processing video job #{$this->jobId}", [
        'operation' => $job->operation,
        'input' => $job->input_path,
      ]);

      $outputPaths = [];
      $inputPath = $job->input_path;

      // Download video if it's a URL
      if (filter_var($inputPath, FILTER_VALIDATE_URL)) {
        $inputPath = $service->downloadVideo($inputPath);
      }

      // Execute operation based on type
      switch ($job->operation) {
        case 'trim':
          $segments = $job->parameters['segments'] ?? [];
          $outputDir = 'processed/' . $job->user_id . '/' . time();
          $outputPaths = $service->trim($inputPath, $segments, $outputDir);
          break;

        case 'merge':
          $videoPaths = $job->parameters['videos'] ?? [];
          $outputPath = 'processed/' . $job->user_id . '/merged_' . time() . '.mp4';
          $outputPaths = [$service->merge($videoPaths, $outputPath)];
          break;

        case 'resize':
          $width = $job->parameters['width'] ?? 1920;
          $height = $job->parameters['height'] ?? 1080;
          $outputPath = 'processed/' . $job->user_id . '/resized_' . time() . '.mp4';
          $outputPaths = [$service->resize($inputPath, $width, $height, $outputPath)];
          break;

        case 'watermark':
          $watermarkPath = $job->parameters['watermark'] ?? '';
          $position = $job->parameters['position'] ?? 'bottom-right';
          $outputPath = 'processed/' . $job->user_id . '/watermarked_' . time() . '.mp4';
          $outputPaths = [$service->addWatermark($inputPath, $watermarkPath, $outputPath, $position)];
          break;

        default:
          throw new \Exception("Unknown operation: {$job->operation}");
      }

      // Upload to S3 if configured
      if (config('filesystems.default') === 's3') {
        $s3Paths = [];
        foreach ($outputPaths as $path) {
          $s3Path = 'publications/' . basename($path);
          // Get from local, put to S3 (force 'private' or no ACL by avoiding visibility param if possible, but let's just do put)
          Storage::disk('s3')->put($s3Path, Storage::disk('local')->get($path));
          $s3Paths[] = Storage::disk('s3')->url($s3Path);

          // Clean up local file
          Storage::disk('local')->delete($path);
        }
        $outputPaths = $s3Paths;
      } else {
        // Convert to URLs for local storage
        $outputPaths = array_map(fn($path) => Storage::url($path), $outputPaths);
      }

      $job->update([
        'status' => 'completed',
        'output_paths' => $outputPaths,
        'progress' => 100,
        'completed_at' => now(),
      ]);

      Log::info("Video job #{$this->jobId} completed successfully", [
        'outputs' => $outputPaths,
      ]);

      // Broadcast completion event
      broadcast(new \App\Events\VideoProcessingCompleted($job))->toOthers();
    } catch (\Exception $e) {
      Log::error("Video job #{$this->jobId} failed", [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);

      $job->update([
        'status' => 'failed',
        'error_message' => $e->getMessage(),
        'completed_at' => now(),
      ]);

      throw $e;
    }
  }

  /**
   * Handle a job failure.
   */
  public function failed(\Throwable $exception): void
  {
    $job = VideoProcessingJobModel::find($this->jobId);

    if ($job) {
      $job->update([
        'status' => 'failed',
        'error_message' => $exception->getMessage(),
        'completed_at' => now(),
      ]);
    }
  }
}
