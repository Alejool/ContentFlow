<?php

namespace App\Services\Video;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use FFMpeg\FFMpeg;
use FFMpeg\FFProbe;
use FFMpeg\Coordinate\TimeCode;

class VideoProcessingService
{
  private FFMpeg $ffmpeg;
  private FFProbe $ffprobe;

  public function __construct()
  {
    $this->ffmpeg = FFMpeg::create([
      'ffmpeg.binaries' => config('media.ffmpeg.binary', '/usr/bin/ffmpeg'),
      'ffprobe.binaries' => config('media.ffmpeg.ffprobe_binary', '/usr/bin/ffprobe'),
      'timeout' => 3600,
      'ffmpeg.threads' => 4,
    ]);

    $this->ffprobe = FFProbe::create([
      'ffprobe.binaries' => config('media.ffmpeg.ffprobe_binary', '/usr/bin/ffprobe'),
    ]);
  }

  /**
   * Extract video metadata
   */
  public function extractMetadata(string $videoPath): array
  {
    Log::info('📊 Extracting video metadata', ['path' => $videoPath]);

    try {
      $format = $this->ffprobe->format($videoPath);
      $videoStream = $this->ffprobe->streams($videoPath)->videos()->first();
      $audioStream = $this->ffprobe->streams($videoPath)->audios()->first();

      $metadata = [
        'duration' => (float) $format->get('duration'),
        'size' => (int) $format->get('size'),
        'bitrate' => (int) $format->get('bit_rate'),
        'format' => $format->get('format_name'),
      ];

      if ($videoStream) {
        $metadata['video'] = [
          'codec' => $videoStream->get('codec_name'),
          'width' => $videoStream->get('width'),
          'height' => $videoStream->get('height'),
          'fps' => $this->calculateFrameRate($videoStream),
          'bitrate' => (int) $videoStream->get('bit_rate', 0),
        ];
      }

      if ($audioStream) {
        $metadata['audio'] = [
          'codec' => $audioStream->get('codec_name'),
          'sample_rate' => (int) $audioStream->get('sample_rate'),
          'channels' => (int) $audioStream->get('channels'),
          'bitrate' => (int) $audioStream->get('bit_rate', 0),
        ];
      }

      Log::info('✅ Metadata extracted', ['metadata' => $metadata]);

      return $metadata;
    } catch (\Exception $e) {
      Log::error('Failed to extract metadata', [
        'error' => $e->getMessage(),
        'path' => $videoPath,
      ]);
      throw new \Exception("Failed to extract video metadata: {$e->getMessage()}");
    }
  }

  /**
   * Generate video thumbnails
   */
  public function generateThumbnails(string $videoPath, int $count = 3): array
  {
    Log::info('🖼️ Generating thumbnails', ['path' => $videoPath, 'count' => $count]);

    try {
      $video = $this->ffmpeg->open($videoPath);
      $duration = (float) $this->ffprobe->format($videoPath)->get('duration');
      
      $thumbnails = [];
      $interval = $duration / ($count + 1);

      for ($i = 1; $i <= $count; $i++) {
        $timestamp = $interval * $i;
        $thumbnailPath = sys_get_temp_dir() . '/' . uniqid('thumb_', true) . '.jpg';
        
        $frame = $video->frame(TimeCode::fromSeconds($timestamp));
        $frame->save($thumbnailPath);
        
        // Upload to S3
        $s3Key = 'thumbnails/' . uniqid('thumb_', true) . '.jpg';
        Storage::disk('s3')->put($s3Key, file_get_contents($thumbnailPath));
        
        $thumbnails[] = [
          'timestamp' => $timestamp,
          's3_key' => $s3Key,
          'url' => Storage::disk('s3')->url($s3Key),
        ];
        
        // Cleanup local file
        @unlink($thumbnailPath);
      }

      Log::info('✅ Thumbnails generated', ['count' => count($thumbnails)]);

      return $thumbnails;
    } catch (\Exception $e) {
      Log::error('Failed to generate thumbnails', [
        'error' => $e->getMessage(),
        'path' => $videoPath,
      ]);
      throw new \Exception("Failed to generate thumbnails: {$e->getMessage()}");
    }
  }

  /**
   * Optimize video for web playback
   */
  public function optimizeVideo(string $videoPath): string
  {
    Log::info('⚙️ Optimizing video', ['path' => $videoPath]);

    try {
      $video = $this->ffmpeg->open($videoPath);
      $optimizedPath = sys_get_temp_dir() . '/' . uniqid('optimized_', true) . '.mp4';

      // Apply web optimization settings
      $format = new \FFMpeg\Format\Video\X264('aac', 'libx264');
      $format->setKiloBitrate(2000); // 2 Mbps
      $format->setAudioKiloBitrate(128);
      $format->setAdditionalParameters([
        '-preset', 'medium',
        '-crf', '23',
        '-movflags', '+faststart', // Enable streaming
        '-pix_fmt', 'yuv420p',
      ]);

      $video->save($format, $optimizedPath);

      Log::info('✅ Video optimized', [
        'original_size_mb' => round(filesize($videoPath) / 1024 / 1024, 2),
        'optimized_size_mb' => round(filesize($optimizedPath) / 1024 / 1024, 2),
      ]);

      return $optimizedPath;
    } catch (\Exception $e) {
      Log::error('Failed to optimize video', [
        'error' => $e->getMessage(),
        'path' => $videoPath,
      ]);
      throw new \Exception("Failed to optimize video: {$e->getMessage()}");
    }
  }

  /**
   * Upload processed video to S3
   */
  public function uploadToS3(string $localPath): string
  {
    Log::info('☁️ Uploading to S3', ['path' => $localPath]);

    try {
      $s3Key = 'processed-videos/' . uniqid('video_', true) . '.mp4';
      
      $stream = fopen($localPath, 'r');
      if ($stream === false) {
        throw new \Exception("Failed to open file for upload: {$localPath}");
      }

      Storage::disk('s3')->put($s3Key, $stream);
      
      if (is_resource($stream)) {
        fclose($stream);
      }

      Log::info('✅ Uploaded to S3', [
        's3_key' => $s3Key,
        'url' => Storage::disk('s3')->url($s3Key),
      ]);

      return $s3Key;
    } catch (\Exception $e) {
      Log::error('Failed to upload to S3', [
        'error' => $e->getMessage(),
        'path' => $localPath,
      ]);
      throw new \Exception("Failed to upload to S3: {$e->getMessage()}");
    }
  }

  /**
   * Calculate frame rate from video stream
   */
  private function calculateFrameRate($videoStream): float
  {
    $fpsString = $videoStream->get('r_frame_rate');
    
    if (strpos($fpsString, '/') !== false) {
      [$numerator, $denominator] = explode('/', $fpsString);
      return $denominator > 0 ? round($numerator / $denominator, 2) : 0;
    }
    
    return (float) $fpsString;
  }
}
