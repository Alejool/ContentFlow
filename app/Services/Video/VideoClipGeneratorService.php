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
      // Use getRawOriginal to get the actual S3 path, not the URL
      $s3Path = $mediaFile->getRawOriginal('file_path');
      $videoPath = $this->downloadVideo($s3Path);
      
      if (!file_exists($videoPath)) {
        throw new \Exception("Downloaded video file not found: {$videoPath}");
      }
      
      // Get original video duration
      $originalDuration = $this->getVideoDuration($videoPath);
      
      Log::info('Starting reel generation', [
        'platform' => $platform,
        'input_file' => $videoPath,
        'file_size' => filesize($videoPath),
        'original_duration' => $originalDuration,
        'max_duration' => $specs['max_duration']
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
        
        throw new \Exception('FFmpeg is required for reel generation. Please install FFmpeg or configure the path in config/media.php');
      }
      
      // Determine clip duration and start time
      $targetDuration = min($originalDuration, $specs['max_duration']);
      $startTime = 0;
      
      // If video is longer than max duration, try to find the best segment
      if ($originalDuration > $specs['max_duration']) {
        Log::info('Video exceeds max duration, selecting best segment', [
          'original_duration' => $originalDuration,
          'target_duration' => $targetDuration
        ]);
        
        // Try to use AI to find the best segment
        try {
          $highlights = $this->analysisService->detectHighlights($videoPath, $originalDuration);
          if (!empty($highlights)) {
            // Use the first highlight as start point
            $startTime = max(0, $highlights[0]['timestamp'] - ($targetDuration / 2));
            // Ensure we don't go past the end
            if ($startTime + $targetDuration > $originalDuration) {
              $startTime = max(0, $originalDuration - $targetDuration);
            }
            Log::info('Using AI-detected highlight as start point', ['start_time' => $startTime]);
          } else {
            // Default: start from beginning
            $startTime = 0;
            Log::info('No highlights detected, using beginning of video');
          }
        } catch (\Exception $e) {
          Log::warning('Could not detect highlights, using beginning of video', ['error' => $e->getMessage()]);
          $startTime = 0;
        }
      }
      
      {
        // FFmpeg is available, process the video with effects
        // OPTIMIZED FOR SPEED: Using config-based settings
        $preset = config('reels.encoding.preset', 'veryfast');
        $crf = config('reels.encoding.crf', 26);
        $audioBitrate = config('reels.encoding.audio_bitrate', '96k');
        
        $videoFilters = [];
        
        // 1. Scale and pad to platform dimensions
        $videoFilters[] = sprintf(
          'scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2:black',
          $specs['width'],
          $specs['height'],
          $specs['width'],
          $specs['height']
        );
        
        // 2. Enhance colors for more eye-catching video (if enabled)
        if (config('reels.effects.color_enhancement', true)) {
          $videoFilters[] = 'eq=contrast=1.15:brightness=0.03:saturation=1.2';
        }
        
        // 3. Add clickbait text if requested (if enabled)
        if (($options['add_subtitles'] ?? false) && config('reels.effects.clickbait_text', true)) {
          $language = $options['language'] ?? 'es';
          $clickbaitText = config("reels.text_overlay.{$language}", '¡MIRA ESTO! 👀');
          
          // Simplified text overlay (no animation for faster processing)
          $videoFilters[] = sprintf(
            "drawtext=fontfile=/Windows/Fonts/arial.ttf:text='%s':fontcolor=white:fontsize=50:box=1:boxcolor=black@0.6:boxborderw=8:x=(w-text_w)/2:y=40",
            $clickbaitText
          );
        }
        
        $filterComplex = implode(',', $videoFilters);
        
        // SPEED OPTIMIZED: Using configurable preset and CRF
        // IMPORTANT: Add -ss (start time) and -t (duration) to clip the video
        $command = sprintf(
          '%s -ss %s -i %s -t %s -vf "%s" -c:v libx264 -preset %s -crf %d -c:a aac -b:a %s -movflags +faststart -y %s 2>&1',
          escapeshellcmd($ffmpegPath),
          $startTime,
          escapeshellarg($videoPath),
          $targetDuration,
          $filterComplex,
          $preset,
          $crf,
          $audioBitrate,
          escapeshellarg($outputPath)
        );

        Log::info('Executing FFmpeg command (speed optimized with clipping)', [
          'command' => $command,
          'input' => $videoPath,
          'output' => $outputPath,
          'start_time' => $startTime,
          'duration' => $targetDuration,
          'filters_applied' => count($videoFilters),
          'preset' => $preset,
          'crf' => $crf
        ]);
        
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
          Log::error('FFmpeg command failed', [
            'return_code' => $returnCode,
            'output' => implode("\n", $output),
            'command' => $command
          ]);
          
          throw new \Exception('FFmpeg processing failed: ' . implode("\n", array_slice($output, -5)));
        }
      }

      if (!file_exists($outputPath)) {
        throw new \Exception("Output file not created: {$outputPath}");
      }

      // Validate output file size
      $outputSize = filesize($outputPath);
      if ($outputSize === 0 || $outputSize === false) {
        throw new \Exception("Output video file is empty: {$outputPath}");
      }

      // Get actual duration of the generated reel
      try {
        $duration = $this->getVideoDuration($outputPath);
      } catch (\Exception $e) {
        Log::warning('Could not get video duration', ['error' => $e->getMessage()]);
        $duration = $targetDuration; // Use target duration as fallback
      }

      Log::info('Reel generated successfully', [
        'output_file' => $outputPath,
        'output_size' => filesize($outputPath),
        'final_duration' => $duration,
        'target_duration' => $targetDuration
      ]);

      // Upload to S3
      $s3Path = $this->uploadToS3($outputPath, $platform);

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
      // Use getRawOriginal to get the actual S3 path, not the URL
      $s3Path = $mediaFile->getRawOriginal('file_path');
      $videoPath = $this->downloadVideo($s3Path);
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
        // Validate clip file size
        $clipSize = filesize($outputPath);
        if ($clipSize === 0 || $clipSize === false) {
          Log::warning('Generated clip is empty, skipping', [
            'index' => $index,
            'output_path' => $outputPath
          ]);
          @unlink($outputPath);
          continue;
        }

        $s3Path = $this->uploadToS3($outputPath, 'clips');
        
        $clips[] = [
          'path' => $s3Path,
          'start_time' => $startTime,
          'duration' => $duration,
          'highlight_score' => $highlight['score'],
          'description' => $highlight['description'] ?? null,
        ];

        @unlink($outputPath);
      } else {
        Log::warning('Failed to generate clip', [
          'index' => $index,
          'return_code' => $returnCode,
          'output' => implode("\n", $output)
        ]);
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
    
    // Validar input antes de trim() para evitar warning con null
    if ($output !== null && $output !== '') {
      return (float) trim($output);
    }
    
    return 0.0;
  }

  private function downloadVideo(string $s3Path): string
  {
    // Validate S3 file exists and has content
    if (!Storage::exists($s3Path)) {
      throw new \Exception("Video file not found in S3: {$s3Path}");
    }

    $fileSize = Storage::size($s3Path);
    if ($fileSize === 0 || $fileSize === false) {
      throw new \Exception("Video file is empty or inaccessible in S3: {$s3Path} (size: {$fileSize})");
    }

    Log::info('Downloading video from S3', [
      's3_path' => $s3Path,
      'file_size' => $fileSize,
      'file_size_mb' => round($fileSize / 1024 / 1024, 2)
    ]);

    $tempPath = sys_get_temp_dir() . '/' . Str::uuid() . '.mp4';
    $content = Storage::get($s3Path);
    
    if (empty($content)) {
      throw new \Exception("Downloaded video content is empty from S3: {$s3Path}");
    }

    file_put_contents($tempPath, $content);
    
    // Verify downloaded file
    if (!file_exists($tempPath) || filesize($tempPath) === 0) {
      throw new \Exception("Failed to download video or file is empty: {$tempPath}");
    }

    Log::info('Video downloaded successfully', [
      'temp_path' => $tempPath,
      'downloaded_size' => filesize($tempPath),
      'downloaded_size_mb' => round(filesize($tempPath) / 1024 / 1024, 2)
    ]);

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
    // Validate local file before upload
    if (!file_exists($localPath)) {
      throw new \Exception("Local file not found for upload: {$localPath}");
    }

    $fileSize = filesize($localPath);
    if ($fileSize === 0 || $fileSize === false) {
      throw new \Exception("Local file is empty, cannot upload: {$localPath}");
    }

    Log::info('Uploading video to S3', [
      'local_path' => $localPath,
      'file_size' => $fileSize
    ]);

    $filename = basename($localPath);
    $s3Path = "reels/{$folder}/" . Str::uuid() . '_' . $filename;
    
    $content = file_get_contents($localPath);
    if (empty($content)) {
      throw new \Exception("Failed to read file content for upload: {$localPath}");
    }

    Storage::put($s3Path, $content);
    
    // Verify upload
    if (!Storage::exists($s3Path)) {
      throw new \Exception("File upload failed, not found in S3: {$s3Path}");
    }

    $uploadedSize = Storage::size($s3Path);
    if ($uploadedSize === 0 || $uploadedSize === false) {
      throw new \Exception("Uploaded file is empty in S3: {$s3Path}");
    }

    Log::info('Video uploaded successfully to S3', [
      's3_path' => $s3Path,
      'uploaded_size' => $uploadedSize
    ]);
    
    return $s3Path;
  }
}
