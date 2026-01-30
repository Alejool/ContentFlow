<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class VideoProcessingService
{
  /**
   * Trim video into segments
   *
   * @param string $inputPath Path to input video (can be URL or local path)
   * @param array $segments Array of segments: [['start' => 0, 'end' => 10], ...]
   * @param string $outputDir Directory to save output files
   * @return array Array of output file paths
   * @throws \Exception
   */
  public function trim(string $inputPath, array $segments, string $outputDir): array
  {
    $outputPaths = [];

    // Ensure output directory exists locally
    if (!Storage::disk('local')->exists($outputDir)) {
      Storage::disk('local')->makeDirectory($outputDir);
    }

    foreach ($segments as $index => $segment) {
      $start = $segment['start'];
      $end = $segment['end'];
      $duration = $end - $start;

      $outputFileName = 'segment_' . ($index + 1) . '_' . time() . '.mp4';
      // Use explicit local path
      $outputPath = storage_path('app/' . $outputDir . '/' . $outputFileName);

      // FFmpeg command: trim video
      // -ss: start time, -t: duration, -i: input, -c copy: copy codec (fast)
      $command = [
        'ffmpeg',
        '-ss',
        (string)$start,
        '-t',
        (string)$duration,
        '-i',
        $inputPath,
        '-c',
        'copy',
        '-avoid_negative_ts',
        'make_zero',
        $outputPath
      ];

      $this->executeFFmpeg($command);

      $outputPaths[] = $outputDir . '/' . $outputFileName;
    }

    return $outputPaths;
  }

  /**
   * Merge multiple videos into one
   *
   * @param array $videoPaths Array of video file paths
   * @param string $outputPath Output file path
   * @return string Output file path
   * @throws \Exception
   */
  public function merge(array $videoPaths, string $outputPath): string
  {
    // Create concat file list
    $concatFile = storage_path('app/temp/concat_' . time() . '.txt');
    $concatContent = '';

    foreach ($videoPaths as $path) {
      $fullPath = storage_path('app/' . $path);
      $concatContent .= "file '" . $fullPath . "'\n";
    }

    file_put_contents($concatFile, $concatContent);

    $fullOutputPath = storage_path('app/' . $outputPath);

    // FFmpeg command: concatenate videos
    $command = [
      'ffmpeg',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      $concatFile,
      '-c',
      'copy',
      $fullOutputPath
    ];

    $this->executeFFmpeg($command);

    // Clean up concat file
    unlink($concatFile);

    return $outputPath;
  }

  /**
   * Resize video
   *
   * @param string $inputPath Input video path
   * @param int $width Target width
   * @param int $height Target height
   * @param string $outputPath Output file path
   * @return string Output file path
   * @throws \Exception
   */
  public function resize(string $inputPath, int $width, int $height, string $outputPath): string
  {
    $fullInputPath = storage_path('app/' . $inputPath);
    $fullOutputPath = storage_path('app/' . $outputPath);

    // FFmpeg command: resize video
    $command = [
      'ffmpeg',
      '-i',
      $fullInputPath,
      '-vf',
      "scale={$width}:{$height}",
      '-c:a',
      'copy',
      $fullOutputPath
    ];

    $this->executeFFmpeg($command);

    return $outputPath;
  }

  /**
   * Add watermark to video
   *
   * @param string $inputPath Input video path
   * @param string $watermarkPath Watermark image path
   * @param string $outputPath Output file path
   * @param string $position Position: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
   * @return string Output file path
   * @throws \Exception
   */
  public function addWatermark(string $inputPath, string $watermarkPath, string $outputPath, string $position = 'bottom-right'): string
  {
    $fullInputPath = storage_path('app/' . $inputPath);
    $fullWatermarkPath = storage_path('app/' . $watermarkPath);
    $fullOutputPath = storage_path('app/' . $outputPath);

    // Calculate overlay position
    $overlay = match ($position) {
      'top-left' => 'overlay=10:10',
      'top-right' => 'overlay=W-w-10:10',
      'bottom-left' => 'overlay=10:H-h-10',
      'bottom-right' => 'overlay=W-w-10:H-h-10',
      'center' => 'overlay=(W-w)/2:(H-h)/2',
      default => 'overlay=W-w-10:H-h-10'
    };

    // FFmpeg command: add watermark
    $command = [
      'ffmpeg',
      '-i',
      $fullInputPath,
      '-i',
      $fullWatermarkPath,
      '-filter_complex',
      $overlay,
      '-c:a',
      'copy',
      $fullOutputPath
    ];

    $this->executeFFmpeg($command);

    return $outputPath;
  }

  /**
   * Get video metadata
   *
   * @param string $videoPath Video file path
   * @return array Video metadata
   * @throws \Exception
   */
  public function getMetadata(string $videoPath): array
  {
    $fullPath = storage_path('app/' . $videoPath);

    $command = [
      'ffprobe',
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      $fullPath
    ];

    $process = new Process($command);
    $process->setTimeout(60);
    $process->run();

    if (!$process->isSuccessful()) {
      throw new ProcessFailedException($process);
    }

    return json_decode($process->getOutput(), true);
  }

  /**
   * Execute FFmpeg command
   *
   * @param array $command Command array
   * @return void
   * @throws \Exception
   */
  protected function executeFFmpeg(array $command): void
  {
    Log::info('Executing FFmpeg command', ['command' => implode(' ', $command)]);

    $process = new Process($command);
    $process->setTimeout(300); // 5 minutes timeout
    $process->run();

    if (!$process->isSuccessful()) {
      Log::error('FFmpeg command failed', [
        'command' => implode(' ', $command),
        'error' => $process->getErrorOutput()
      ]);
      throw new ProcessFailedException($process);
    }

    Log::info('FFmpeg command completed successfully');
  }

  /**
   * Download video from URL to temporary storage
   *
   * @param string $url Video URL
   * @return string Local path to downloaded video
   * @throws \Exception
   */
  public function downloadVideo(string $url): string
  {
    $tempDir = 'temp/videos';
    $fileName = 'video_' . time() . '_' . md5($url) . '.mp4';
    $path = $tempDir . '/' . $fileName;

    if (!Storage::disk('local')->exists($tempDir)) {
      Storage::disk('local')->makeDirectory($tempDir);
    }

    $contents = file_get_contents($url);
    if ($contents === false) {
      throw new \Exception("Failed to download video from URL: {$url}");
    }

    Storage::disk('local')->put($path, $contents);

    return $path;
  }
}
