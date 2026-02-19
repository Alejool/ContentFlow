<?php

namespace App\Services\Video;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Streaming video service for efficient processing of large video files
 * Avoids loading entire files into memory
 */
class StreamingVideoService
{
    private const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks
    private const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024; // 500MB

    /**
     * Download video with streaming and progress tracking
     */
    public function downloadWithStreaming(string $s3Path, ?callable $progressCallback = null): string
    {
        if (!Storage::exists($s3Path)) {
            throw new \Exception("Video file not found in S3: {$s3Path}");
        }

        $fileSize = Storage::size($s3Path);
        $fileSizeMB = round($fileSize / 1024 / 1024, 2);
        
        Log::info('Starting streaming download', [
            's3_path' => $s3Path,
            'file_size_mb' => $fileSizeMB,
            'is_large_file' => $fileSize > self::LARGE_FILE_THRESHOLD
        ]);

        $tempPath = sys_get_temp_dir() . '/' . \Illuminate\Support\Str::uuid() . '.mp4';
        $startTime = microtime(true);
        
        try {
            $stream = Storage::readStream($s3Path);
            if ($stream === false) {
                throw new \Exception("Failed to open stream from S3");
            }

            $localStream = fopen($tempPath, 'w');
            if ($localStream === false) {
                fclose($stream);
                throw new \Exception("Failed to create local file");
            }

            $bytesWritten = 0;
            $lastProgressUpdate = 0;
            
            while (!feof($stream)) {
                $chunk = fread($stream, self::CHUNK_SIZE);
                if ($chunk === false) {
                    break;
                }
                
                $written = fwrite($localStream, $chunk);
                if ($written === false) {
                    throw new \Exception("Failed to write chunk");
                }
                
                $bytesWritten += $written;
                
                // Call progress callback every 10%
                if ($progressCallback && $fileSize > 0) {
                    $progress = ($bytesWritten / $fileSize) * 100;
                    if ($progress - $lastProgressUpdate >= 10) {
                        $progressCallback($progress, $bytesWritten, $fileSize);
                        $lastProgressUpdate = $progress;
                    }
                }
            }
            
            fclose($stream);
            fclose($localStream);
            
            $downloadTime = round(microtime(true) - $startTime, 2);
            
            Log::info('Streaming download completed', [
                'temp_path' => $tempPath,
                'size_mb' => round(filesize($tempPath) / 1024 / 1024, 2),
                'time_seconds' => $downloadTime,
                'speed_mbps' => round($fileSizeMB / max($downloadTime, 0.1), 2)
            ]);

            return $tempPath;
            
        } catch (\Exception $e) {
            $this->cleanup($tempPath);
            throw $e;
        }
    }

    /**
     * Process video in chunks without full download
     * Useful for metadata extraction or partial processing
     */
    public function processInChunks(string $s3Path, callable $chunkProcessor): array
    {
        if (!Storage::exists($s3Path)) {
            throw new \Exception("Video file not found in S3: {$s3Path}");
        }

        $stream = Storage::readStream($s3Path);
        if ($stream === false) {
            throw new \Exception("Failed to open stream from S3");
        }

        $results = [];
        $chunkIndex = 0;
        
        try {
            while (!feof($stream)) {
                $chunk = fread($stream, self::CHUNK_SIZE);
                if ($chunk === false || empty($chunk)) {
                    break;
                }
                
                $result = $chunkProcessor($chunk, $chunkIndex);
                if ($result !== null) {
                    $results[] = $result;
                }
                
                $chunkIndex++;
            }
            
            fclose($stream);
            
            return $results;
            
        } catch (\Exception $e) {
            if (is_resource($stream)) {
                fclose($stream);
            }
            throw $e;
        }
    }

    /**
     * Get video metadata without downloading entire file
     */
    public function getMetadataFast(string $s3Path): array
    {
        // Download only first 10MB for metadata extraction
        $stream = Storage::readStream($s3Path);
        if ($stream === false) {
            throw new \Exception("Failed to open stream");
        }

        $tempPath = sys_get_temp_dir() . '/' . \Illuminate\Support\Str::uuid() . '_partial.mp4';
        $localStream = fopen($tempPath, 'w');
        
        try {
            // Read only first 10MB
            $chunk = fread($stream, 10 * 1024 * 1024);
            fwrite($localStream, $chunk);
            
            fclose($stream);
            fclose($localStream);
            
            // Extract metadata using FFmpeg
            $metadata = $this->extractMetadata($tempPath);
            
            $this->cleanup($tempPath);
            
            return $metadata;
            
        } catch (\Exception $e) {
            $this->cleanup($tempPath);
            throw $e;
        }
    }

    /**
     * Extract metadata using FFmpeg
     */
    private function extractMetadata(string $videoPath): array
    {
        $ffprobe = config('services.ffmpeg.ffprobe_path', 'ffprobe');
        
        $command = sprintf(
            '%s -v quiet -print_format json -show_format -show_streams %s',
            escapeshellcmd($ffprobe),
            escapeshellarg($videoPath)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            throw new \Exception("Failed to extract metadata");
        }
        
        $data = json_decode(implode('', $output), true);
        
        return [
            'duration' => $data['format']['duration'] ?? 0,
            'size' => $data['format']['size'] ?? 0,
            'bit_rate' => $data['format']['bit_rate'] ?? 0,
            'format_name' => $data['format']['format_name'] ?? 'unknown',
            'video_codec' => $data['streams'][0]['codec_name'] ?? 'unknown',
            'width' => $data['streams'][0]['width'] ?? 0,
            'height' => $data['streams'][0]['height'] ?? 0,
            'fps' => $this->calculateFps($data['streams'][0] ?? []),
        ];
    }

    /**
     * Calculate FPS from stream data
     */
    private function calculateFps(array $stream): float
    {
        if (isset($stream['r_frame_rate'])) {
            $parts = explode('/', $stream['r_frame_rate']);
            if (count($parts) === 2 && $parts[1] > 0) {
                return round($parts[0] / $parts[1], 2);
            }
        }
        
        return 0.0;
    }

    /**
     * Cleanup temporary files
     */
    private function cleanup(string $path): void
    {
        if (file_exists($path)) {
            @unlink($path);
        }
    }

    /**
     * Check if file should use streaming strategy
     */
    public function shouldUseStreaming(string $s3Path): bool
    {
        $fileSize = Storage::size($s3Path);
        return $fileSize > self::LARGE_FILE_THRESHOLD;
    }
}
