<?php

namespace App\Services\Validation;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MediaAnalyzer
{
    /**
     * Analiza un archivo multimedia y extrae sus características
     */
    public function analyze(MediaFile $mediaFile): ?array
    {
        try {
            $filePath = $this->resolveFilePath($mediaFile);
            
            if (!file_exists($filePath)) {
                Log::warning("Media file not found for analysis", ['path' => $filePath]);
                return null;
            }

            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $size = filesize($filePath);
            $mimeType = mime_content_type($filePath);

            $info = [
                'filename' => $mediaFile->filename,
                'extension' => $extension,
                'size' => $size,
                'mime_type' => $mimeType,
                'type' => $this->determineMediaType($mimeType, $extension),
            ];

            // Análisis específico por tipo
            if ($info['type'] === 'video') {
                $videoInfo = $this->analyzeVideo($filePath);
                $info = array_merge($info, $videoInfo);
            } elseif ($info['type'] === 'image') {
                $imageInfo = $this->analyzeImage($filePath);
                $info = array_merge($info, $imageInfo);
            }

            return $info;
        } catch (\Exception $e) {
            Log::error("Error analyzing media file", [
                'media_file_id' => $mediaFile->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Analiza un archivo de video usando FFmpeg o getID3
     */
    protected function analyzeVideo(string $filePath): array
    {
        $info = [
            'duration' => 0,
            'width' => 0,
            'height' => 0,
            'aspect_ratio' => null,
            'fps' => 0,
            'bitrate' => 0,
        ];

        // Intentar con FFmpeg primero
        if ($this->isFFmpegAvailable()) {
            $info = $this->analyzeVideoWithFFmpeg($filePath);
        } elseif (class_exists('\getID3')) {
            $info = $this->analyzeVideoWithGetID3($filePath);
        }

        // Calcular aspect ratio si tenemos dimensiones
        if ($info['width'] > 0 && $info['height'] > 0) {
            $info['aspect_ratio'] = $this->calculateAspectRatio($info['width'], $info['height']);
        }

        return $info;
    }

    /**
     * Analiza video usando FFmpeg
     */
    protected function analyzeVideoWithFFmpeg(string $filePath): array
    {
        $command = sprintf(
            'ffprobe -v quiet -print_format json -show_format -show_streams %s 2>&1',
            escapeshellarg($filePath)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            Log::warning("FFmpeg analysis failed", ['return_code' => $returnCode]);
            return [];
        }

        $data = json_decode(implode('', $output), true);
        
        if (!$data) {
            return [];
        }

        $videoStream = collect($data['streams'] ?? [])
            ->firstWhere('codec_type', 'video');

        if (!$videoStream) {
            return [];
        }

        return [
            'duration' => (int) ($data['format']['duration'] ?? 0),
            'width' => $videoStream['width'] ?? 0,
            'height' => $videoStream['height'] ?? 0,
            'fps' => $this->parseFps($videoStream['r_frame_rate'] ?? '0'),
            'bitrate' => (int) ($data['format']['bit_rate'] ?? 0),
        ];
    }

    /**
     * Analiza video usando getID3
     */
    protected function analyzeVideoWithGetID3(string $filePath): array
    {
        try {
            $getID3 = new \getID3();
            $fileInfo = $getID3->analyze($filePath);

            return [
                'duration' => (int) ($fileInfo['playtime_seconds'] ?? 0),
                'width' => $fileInfo['video']['resolution_x'] ?? 0,
                'height' => $fileInfo['video']['resolution_y'] ?? 0,
                'fps' => $fileInfo['video']['frame_rate'] ?? 0,
                'bitrate' => $fileInfo['bitrate'] ?? 0,
            ];
        } catch (\Exception $e) {
            Log::error("getID3 analysis failed", ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Analiza un archivo de imagen
     */
    protected function analyzeImage(string $filePath): array
    {
        $imageInfo = @getimagesize($filePath);

        if (!$imageInfo) {
            return [];
        }

        return [
            'width' => $imageInfo[0] ?? 0,
            'height' => $imageInfo[1] ?? 0,
            'aspect_ratio' => $this->calculateAspectRatio($imageInfo[0] ?? 0, $imageInfo[1] ?? 0),
        ];
    }

    /**
     * Calcula la relación de aspecto
     */
    protected function calculateAspectRatio(int $width, int $height): ?string
    {
        if ($width === 0 || $height === 0) {
            return null;
        }

        $gcd = $this->gcd($width, $height);
        $ratioW = $width / $gcd;
        $ratioH = $height / $gcd;

        // Normalizar ratios comunes
        $ratio = "{$ratioW}:{$ratioH}";
        
        $commonRatios = [
            '16:9', '9:16', '4:3', '3:4', '1:1', '4:5', '5:4', '21:9'
        ];

        // Tolerancia para considerar ratios similares
        $tolerance = 0.05;
        $targetRatio = $width / $height;

        foreach ($commonRatios as $commonRatio) {
            [$w, $h] = explode(':', $commonRatio);
            $commonRatioValue = $w / $h;
            
            if (abs($targetRatio - $commonRatioValue) / $commonRatioValue < $tolerance) {
                return $commonRatio;
            }
        }

        return $ratio;
    }

    /**
     * Calcula el máximo común divisor
     */
    protected function gcd(int $a, int $b): int
    {
        return $b === 0 ? $a : $this->gcd($b, $a % $b);
    }

    /**
     * Parsea el frame rate de FFmpeg
     */
    protected function parseFps(string $fpsString): float
    {
        if (str_contains($fpsString, '/')) {
            [$num, $den] = explode('/', $fpsString);
            return $den > 0 ? $num / $den : 0;
        }
        return (float) $fpsString;
    }

    /**
     * Determina el tipo de media basado en MIME type
     */
    protected function determineMediaType(string $mimeType, string $extension): string
    {
        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }

        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }

        // Fallback por extensión
        $videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'];
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

        if (in_array($extension, $videoExtensions)) {
            return 'video';
        }

        if (in_array($extension, $imageExtensions)) {
            return 'image';
        }

        return 'unknown';
    }

    /**
     * Verifica si FFmpeg está disponible
     */
    protected function isFFmpegAvailable(): bool
    {
        static $available = null;

        if ($available === null) {
            exec('ffprobe -version 2>&1', $output, $returnCode);
            $available = $returnCode === 0;
        }

        return $available;
    }

    /**
     * Resuelve la ruta del archivo
     */
    protected function resolveFilePath(MediaFile $mediaFile): string
    {
        // Si es una ruta absoluta, usarla directamente
        if (file_exists($mediaFile->path)) {
            return $mediaFile->path;
        }

        // Intentar con storage
        $storagePath = Storage::disk('public')->path($mediaFile->path);
        if (file_exists($storagePath)) {
            return $storagePath;
        }

        // Intentar con storage_path
        $fullPath = storage_path('app/public/' . $mediaFile->path);
        if (file_exists($fullPath)) {
            return $fullPath;
        }

        return $mediaFile->path;
    }
}
