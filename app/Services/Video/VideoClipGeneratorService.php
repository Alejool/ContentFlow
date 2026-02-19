<?php

namespace App\Services\Video;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VideoClipGeneratorService
{
  public function __construct(
    private VideoAnalysisService $analysisService
  ) {}

  /**
   * Create optimized reel for specific platform using direct FFmpeg commands
   */
  public function createOptimizedReel(MediaFile $mediaFile, string $platform, array $options = []): array
  {
    $specs = $this->getPlatformSpecs($platform);
    
    try {
      $videoPath = $this->downloadVideo($mediaFile->file_path);
      
      if (!file_exists($videoPath)) {
        throw new \Exception("Downloaded video file not found: {$videoPath}");
      }
      
      Log::info('Starting reel generation', [
        'platform' => $platform,
        'input_file' => $videoPath,
        'file_size' => filesize($videoPath)
      ]);
      
      $outputPath = $this->generateOutputPath($platform);

      // Build FFmpeg command - simplified for compatibility
      $ffmpegPath = config('media.ffmpeg_path', 'ffmpeg');
      
      // Check if ffmpeg exists
      $checkCommand = sprintf('%s -version 2>&1', escapeshellcmd($ffmpegPath));
      exec($checkCommand, $checkOutput, $checkCode);
      
      if ($checkCode !== 0) {
        Log::error('FFmpeg not found or not executable', [
          'path' => $ffmpegPath,
          'output' => implode("\n", $checkOutput)
        ]);
        
        // Fallback: Just copy the file without processing
        Log::warning('FFmpeg not available, copying original file');
        copy($videoPath, $outputPath);
        
        if (!file_exists($outputPath)) {
          throw new \Exception('Failed to copy video file');
        }
      } else {
        // FFmpeg is available, process the video
        // Ultra-simple command for maximum compatibility
        $command = sprintf(
          '%s -i %s -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset ultrafast -crf 28 -c:a copy -movflags +faststart -y %s 2>&1',
          escapeshellcmd($ffmpegPath),
          escapeshellarg($videoPath),
          escapeshellarg($outputPath)
        );

        Log::info('Executing FFmpeg command', [
          'command' => $command,
          'input' => $videoPath,
          'output' => $outputPath
        ]);
        
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
          Log::error('FFmpeg command failed', [
            'return_code' => $returnCode,
            'output' => implode("\n", $output),
            'command' => $command
          ]);
          
          // Fallback: Just copy the file
          Log::warning('FFmpeg failed, copying original file as fallback');
          copy($videoPath, $outputPath);
        }
      }

      if (!file_exists($outputPath)) {
        throw new \Exception("Output file not created: {$outputPath}");
      }

      Log::info('Video processed successfully', [
        'output_file' => $outputPath,
        'output_size' => filesize($outputPath)
      ]);

      // Upload to S3
      $s3Path = $this->uploadToS3($outputPath, $platform);

      // Get duration (with fallback)
      try {
        $duration = $this->getVideoDuration($outputPath);
      } catch (\Exception $e) {
        Log::warning('Could not get video duration', ['error' => $e->getMessage()]);
        $duration = 30; // Default fallback
      }

      // Cleanup
      @unlink($videoPath);
      @unlink($outputPath);

      return [
        'path' => $s3Path,
        'platform' => $platform,
        'specs' => $specs,
        'duration' => $duration,
      ];
    } catch (\Exception $e) {
      Log::error('Failed to create optimized reel', [
        'error' => $e->getMessage(),
        'platform' => $platform,
        'trace' => $e->getTraceAsString()
      ]);
      throw $e;
    }
  }

  /**
   * Generate multiple short clips from a long video
   */
  public function generateClipsFromVideo(MediaFile $mediaFile, array $options = []): array
  {
    $duration = $options['clip_duration'] ?? 30;
    $maxClips = $options['max_clips'] ?? 5;

    try {
      $videoPath = $this->downloadVideo($mediaFile->file_path);
      $videoDuration = $this->getVideoDuration($videoPath);

      $highlights = $this->analysisService->detectHighlights($videoPath, $videoDuration);
      $clips = $this->extractHighlightClips($videoPath, $highlights, $duration, $maxClips);

      @unlink($videoPath);

      return $clips;
    } catch (\Exception $e) {
      Log::error('Failed to generate clips', ['error' => $e->getMessage()]);
      throw $e;
    }
  }

  private function extractHighlightClips(string $videoPath, array $highlights, int $duration, int $maxClips): array
  {
    $clips = [];
    $ffmpegPath = config('media.ffmpeg_path', 'ffmpeg');

    foreach (array_slice($highlights, 0, $maxClips) as $index => $highlight) {
      $startTime = max(0, $highlight['timestamp'] - ($duration / 2));
      $outputPath = $this->generateClipPath($index);

      $command = sprintf(
        '%s -i %s -ss %s -t %s -c:v libx264 -preset fast -crf 23 -c:a aac %s 2>&1',
        escapeshellcmd($ffmpegPath),
        escapeshellarg($videoPath),
        $startTime,
        $duration,
        escapeshellarg($outputPath)
      );

      exec($command, $output, $returnCode);

      if ($returnCode === 0 && file_exists($outputPath)) {
        $s3Path = $this->uploadToS3($outputPath, 'clips');
        
        $clips[] = [
          'path' => $s3Path,
          'start_time' => $startTime,
          'duration' => $duration,
          'highlight_score' => $highlight['score'],
          'description' => $highlight['description'] ?? null,
        ];

        @unlink($outputPath);
      }
    }

    return $clips;
  }

  private function getPlatformSpecs(string $platform): array
  {
    return match($platform) {
      'instagram' => [
        'width' => 1080,
        'height' => 1920,
        'max_duration' => 90,
        'min_duration' => 3,
        'bitrate' => 5000,
        'aspect_ratio' => '9:16',
      ],
      'tiktok' => [
        'width' => 1080,
        'height' => 1920,
        'max_duration' => 180,
        'min_duration' => 3,
        'bitrate' => 4000,
        'aspect_ratio' => '9:16',
      ],
      'youtube_shorts' => [
        'width' => 1080,
        'height' => 1920,
        'max_duration' => 60,
        'min_duration' => 1,
        'bitrate' => 6000,
        'aspect_ratio' => '9:16',
      ],
      default => [
        'width' => 1080,
        'height' => 1920,
        'max_duration' => 60,
        'min_duration' => 3,
        'bitrate' => 5000,
        'aspect_ratio' => '9:16',
      ],
    };
  }

  private function getVideoDuration(string $videoPath): float
  {
    $ffprobePath = config('media.ffprobe_path', 'ffprobe');
    
    $command = sprintf(
      '%s -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 %s',
      escapeshellcmd($ffprobePath),
      escapeshellarg($videoPath)
    );

    $output = shell_exec($command);
    
    return (float) trim($output);
  }

  private function downloadVideo(string $s3Path): string
  {
    $tempPath = sys_get_temp_dir() . '/' . Str::uuid() . '.mp4';
    $content = Storage::get($s3Path);
    file_put_contents($tempPath, $content);
    return $tempPath;
  }

  private function generateOutputPath(string $platform): string
  {
    return sys_get_temp_dir() . '/' . Str::uuid() . "_{$platform}.mp4";
  }

  private function generateClipPath(int $index): string
  {
    return sys_get_temp_dir() . '/' . Str::uuid() . "_clip_{$index}.mp4";
  }

  private function uploadToS3(string $localPath, string $folder): string
  {
    $filename = basename($localPath);
    $s3Path = "reels/{$folder}/" . Str::uuid() . '_' . $filename;
    
    Storage::put($s3Path, file_get_contents($localPath));
    
    return $s3Path;
  }
}
