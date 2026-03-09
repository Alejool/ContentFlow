<?php

namespace App\Services\Media;

use App\Models\MediaFiles\MediaFile;
use App\Models\MediaFiles\MediaDerivative;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

/**
 * Image optimization service with WebP/AVIF conversion and compression
 */
class ImageOptimizationService
{
    // Responsive breakpoints
    private const BREAKPOINTS = [
        'thumbnail' => 150,
        'small' => 320,
        'medium' => 640,
        'large' => 1024,
        'xlarge' => 1920,
    ];

    // Quality settings
    private const QUALITY = [
        'webp' => 85,
        'avif' => 80,
        'jpeg' => 90,
    ];

    /**
     * Generate optimized derivatives for image
     */
    public function generateOptimizedDerivatives(MediaFile $mediaFile): array
    {
        if ($mediaFile->file_type !== 'image') {
            throw new \InvalidArgumentException('Media file must be an image');
        }

        Log::info('🖼️ Generating optimized derivatives', ['media_id' => $mediaFile->id]);

        $derivatives = [];
        $originalPath = $mediaFile->getRawOriginal('file_path');

        // Download original from S3
        $tempPath = $this->downloadToTemp($originalPath);

        try {
            // Generate WebP versions at different sizes
            foreach (self::BREAKPOINTS as $name => $width) {
                $derivatives[] = $this->createDerivative($mediaFile, $tempPath, $name, $width, 'webp');
            }

            // Generate AVIF versions (modern browsers)
            if ($this->isAvifSupported()) {
                foreach (['small', 'medium', 'large'] as $name) {
                    $derivatives[] = $this->createDerivative($mediaFile, $tempPath, $name, self::BREAKPOINTS[$name], 'avif');
                }
            }

            // Generate compressed JPEG fallback
            $derivatives[] = $this->createDerivative($mediaFile, $tempPath, 'optimized', null, 'jpeg');

            Log::info('✅ Optimized derivatives generated', [
                'media_id' => $mediaFile->id,
                'count' => count($derivatives)
            ]);

            return $derivatives;
        } finally {
            @unlink($tempPath);
        }
    }

    /**
     * Create single derivative
     */
    private function createDerivative(
        MediaFile $mediaFile,
        string $sourcePath,
        string $sizeName,
        ?int $width,
        string $format
    ): MediaDerivative {
        $image = Image::make($sourcePath);

        // Resize if width specified
        if ($width) {
            $image->resize($width, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        // Apply format-specific optimizations
        $quality = self::QUALITY[$format] ?? 85;
        $tempOutput = sys_get_temp_dir() . '/' . uniqid('derivative_', true) . '.' . $format;

        switch ($format) {
            case 'webp':
                $image->encode('webp', $quality)->save($tempOutput);
                break;
            case 'avif':
                // AVIF requires external tool or library
                $this->convertToAvif($sourcePath, $tempOutput, $quality);
                break;
            case 'jpeg':
                $image->encode('jpg', $quality)->save($tempOutput);
                break;
        }

        // Upload to S3
        $s3Key = $this->generateS3Key($mediaFile, $sizeName, $format);
        Storage::disk('s3')->put($s3Key, file_get_contents($tempOutput));

        $fileSize = filesize($tempOutput);
        @unlink($tempOutput);

        // Create derivative record
        return MediaDerivative::create([
            'media_file_id' => $mediaFile->id,
            'derivative_type' => 'optimized',
            'file_path' => $s3Key,
            'file_name' => basename($s3Key),
            'mime_type' => "image/{$format}",
            'size' => $fileSize,
            'width' => $image->width(),
            'height' => $image->height(),
            'platform' => 'web',
            'metadata' => [
                'size_name' => $sizeName,
                'format' => $format,
                'quality' => $quality,
                'original_size' => $mediaFile->size,
                'compression_ratio' => round((1 - ($fileSize / $mediaFile->size)) * 100, 2),
            ],
        ]);
    }

    /**
     * Convert image to AVIF using external tool
     */
    private function convertToAvif(string $input, string $output, int $quality): void
    {
        // Using avifenc (requires libavif installed)
        $command = sprintf(
            'avifenc --min 0 --max 63 --speed 6 -q %d %s %s 2>&1',
            $quality,
            escapeshellarg($input),
            escapeshellarg($output)
        );

        exec($command, $outputLines, $returnCode);

        if ($returnCode !== 0) {
            Log::warning('AVIF conversion failed, skipping', [
                'command' => $command,
                'output' => implode("\n", $outputLines)
            ]);
            throw new \Exception('AVIF conversion not available');
        }
    }

    /**
     * Check if AVIF encoding is supported
     */
    private function isAvifSupported(): bool
    {
        static $supported = null;

        if ($supported === null) {
            exec('which avifenc', $output, $returnCode);
            $supported = $returnCode === 0;
        }

        return $supported;
    }

    /**
     * Download file from S3 to temp
     */
    private function downloadToTemp(string $s3Path): string
    {
        $tempPath = sys_get_temp_dir() . '/' . uniqid('original_', true) . '.jpg';
        $contents = Storage::disk('s3')->get($s3Path);
        file_put_contents($tempPath, $contents);
        return $tempPath;
    }

    /**
     * Generate S3 key for derivative
     */
    private function generateS3Key(MediaFile $mediaFile, string $sizeName, string $format): string
    {
        $uuid = pathinfo($mediaFile->getRawOriginal('file_path'), PATHINFO_FILENAME);
        return "derivatives/optimized/{$uuid}_{$sizeName}.{$format}";
    }

    /**
     * Get best derivative for client
     */
    public function getBestDerivative(MediaFile $mediaFile, int $width, array $supportedFormats = ['webp', 'jpeg']): ?MediaDerivative
    {
        // Find closest size
        $targetSize = $this->findClosestSize($width);

        // Try formats in order of preference
        foreach ($supportedFormats as $format) {
            $derivative = $mediaFile->derivatives()
                ->where('derivative_type', 'optimized')
                ->where('metadata->format', $format)
                ->where('metadata->size_name', $targetSize)
                ->first();

            if ($derivative) {
                return $derivative;
            }
        }

        return null;
    }

    /**
     * Find closest breakpoint size
     */
    private function findClosestSize(int $width): string
    {
        $closest = 'xlarge';
        $minDiff = PHP_INT_MAX;

        foreach (self::BREAKPOINTS as $name => $breakpoint) {
            $diff = abs($breakpoint - $width);
            if ($diff < $minDiff) {
                $minDiff = $diff;
                $closest = $name;
            }
        }

        return $closest;
    }

    /**
     * Compress existing image without resizing
     */
    public function compressImage(MediaFile $mediaFile, int $quality = 85): MediaDerivative
    {
        $originalPath = $mediaFile->getRawOriginal('file_path');
        $tempPath = $this->downloadToTemp($originalPath);

        try {
            $image = Image::make($tempPath);
            $compressed = sys_get_temp_dir() . '/' . uniqid('compressed_', true) . '.jpg';

            $image->encode('jpg', $quality)->save($compressed);

            $s3Key = $this->generateS3Key($mediaFile, 'compressed', 'jpeg');
            Storage::disk('s3')->put($s3Key, file_get_contents($compressed));

            $fileSize = filesize($compressed);
            @unlink($compressed);

            return MediaDerivative::create([
                'media_file_id' => $mediaFile->id,
                'derivative_type' => 'compressed',
                'file_path' => $s3Key,
                'file_name' => basename($s3Key),
                'mime_type' => 'image/jpeg',
                'size' => $fileSize,
                'width' => $image->width(),
                'height' => $image->height(),
                'metadata' => [
                    'quality' => $quality,
                    'original_size' => $mediaFile->size,
                    'savings_bytes' => $mediaFile->size - $fileSize,
                    'compression_ratio' => round((1 - ($fileSize / $mediaFile->size)) * 100, 2),
                ],
            ]);
        } finally {
            @unlink($tempPath);
        }
    }
}
