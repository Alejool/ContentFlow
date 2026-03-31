<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaFiles\MediaFile;
use App\Services\Cache\MediaCacheService;
use App\Services\CDN\CDNService;
use Illuminate\Http\Request;

class MediaDerivativeController extends Controller
{
    public function __construct(
        private MediaCacheService $cacheService,
        private CDNService $cdnService
    ) {}

    /**
     * Get optimized derivatives for media file
     * GET /api/media/{id}/derivatives
     */
    public function index(int $id, Request $request)
    {
        $mediaFile = $this->cacheService->getMediaWithDerivatives($id);

        if (!$mediaFile) {
            return response()->json(['error' => 'Media file not found'], 404);
        }

        // Check authorization
        if ($mediaFile->workspace_id !== auth()->user()->current_workspace_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get client capabilities
        $acceptsWebP = str_contains($request->header('Accept', ''), 'image/webp');
        $acceptsAVIF = str_contains($request->header('Accept', ''), 'image/avif');

        $supportedFormats = ['jpeg'];
        if ($acceptsWebP) $supportedFormats[] = 'webp';
        if ($acceptsAVIF) $supportedFormats[] = 'avif';

        // Group derivatives by format and size
        $derivatives = $mediaFile->derivatives()
            ->where('derivative_type', 'optimized')
            ->get()
            ->groupBy(fn($d) => $d->metadata['format'] ?? 'jpeg')
            ->map(function ($group) {
                return $group->map(function ($derivative) {
                    return [
                        'url' => $this->cdnService->getUrl($derivative->getRawOriginal('file_path')),
                        'width' => $derivative->width,
                        'height' => $derivative->height,
                        'size' => $derivative->size,
                        'format' => $derivative->metadata['format'] ?? 'jpeg',
                        'size_name' => $derivative->metadata['size_name'] ?? 'unknown',
                    ];
                })->values();
            });

        return response()->json([
            'media_id' => $mediaFile->id,
            'original_url' => $this->cdnService->getUrl($mediaFile->getRawOriginal('file_path')),
            'fallback_url' => $this->cdnService->getOptimizedImageUrl(
                $mediaFile->getRawOriginal('file_path'),
                1024,
                null,
                'jpeg'
            ),
            'derivatives' => $derivatives,
            'supported_formats' => $supportedFormats,
            'recommended_format' => $acceptsAVIF ? 'avif' : ($acceptsWebP ? 'webp' : 'jpeg'),
        ]);
    }

    /**
     * Get best derivative for specific viewport
     * GET /api/media/{id}/best?width=640&format=webp
     */
    public function best(int $id, Request $request)
    {
        $request->validate([
            'width' => 'required|integer|min:1|max:4000',
            'format' => 'nullable|in:webp,avif,jpeg',
        ]);

        $mediaFile = $this->cacheService->getMediaWithDerivatives($id);

        if (!$mediaFile) {
            return response()->json(['error' => 'Media file not found'], 404);
        }

        $width = $request->integer('width');
        $format = $request->input('format', 'webp');

        // Find closest derivative
        $derivative = $mediaFile->derivatives()
            ->where('derivative_type', 'optimized')
            ->where('metadata->format', $format)
            ->get()
            ->sortBy(fn($d) => abs($d->width - $width))
            ->first();

        if (!$derivative) {
            // Fallback to original
            return response()->json([
                'url' => $this->cdnService->getUrl($mediaFile->getRawOriginal('file_path')),
                'width' => null,
                'height' => null,
                'format' => 'original',
            ]);
        }

        return response()->json([
            'url' => $this->cdnService->getUrl($derivative->getRawOriginal('file_path')),
            'width' => $derivative->width,
            'height' => $derivative->height,
            'format' => $format,
            'size' => $derivative->size,
            'size_name' => $derivative->metadata['size_name'] ?? 'unknown',
        ]);
    }

    /**
     * Get responsive srcset for image
     * GET /api/media/{id}/srcset?format=webp
     */
    public function srcset(int $id, Request $request)
    {
        $request->validate([
            'format' => 'nullable|in:webp,avif,jpeg',
        ]);

        $mediaFile = $this->cacheService->getMediaWithDerivatives($id);

        if (!$mediaFile) {
            return response()->json(['error' => 'Media file not found'], 404);
        }

        $format = $request->input('format', 'webp');

        $derivatives = $mediaFile->derivatives()
            ->where('derivative_type', 'optimized')
            ->where('metadata->format', $format)
            ->orderBy('width')
            ->get();

        $srcset = $derivatives->map(function ($derivative) {
            $url = $this->cdnService->getUrl($derivative->getRawOriginal('file_path'));
            return "{$url} {$derivative->width}w";
        })->implode(', ');

        return response()->json([
            'srcset' => $srcset,
            'format' => $format,
            'sizes' => '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
        ]);
    }
}
