<?php

namespace App\Services\Cache;

use App\Models\MediaFiles\MediaFile;
use App\Models\MediaFiles\MediaDerivative;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Aggressive caching service for media files and derivatives
 * Reduces database queries for frequently accessed media
 */
class MediaCacheService
{
    private const CACHE_PREFIX = 'media:';
    private const MEDIA_TTL = 7200; // 2 hours
    private const DERIVATIVE_TTL = 3600; // 1 hour
    private const URL_TTL = 1800; // 30 minutes

    /**
     * Get media file with all derivatives cached
     */
    public function getMediaWithDerivatives(int $mediaId): ?MediaFile
    {
        $cacheKey = $this->getCacheKey('full', $mediaId);
        
        return Cache::remember($cacheKey, self::MEDIA_TTL, function () use ($mediaId) {
            return MediaFile::with(['derivatives', 'thumbnail'])->find($mediaId);
        });
    }

    /**
     * Get specific derivative type for media
     */
    public function getDerivative(int $mediaId, string $type, ?string $platform = null): ?MediaDerivative
    {
        $cacheKey = $this->getCacheKey('derivative', "{$mediaId}:{$type}:{$platform}");
        
        return Cache::remember($cacheKey, self::DERIVATIVE_TTL, function () use ($mediaId, $type, $platform) {
            $query = MediaDerivative::where('media_file_id', $mediaId)
                ->where('derivative_type', $type);
            
            if ($platform) {
                $query->where('platform', $platform);
            }
            
            return $query->first();
        });
    }

    /**
     * Get thumbnail URL with caching
     */
    public function getThumbnailUrl(int $mediaId): ?string
    {
        $cacheKey = $this->getCacheKey('thumbnail_url', $mediaId);
        
        return Cache::remember($cacheKey, self::URL_TTL, function () use ($mediaId) {
            $thumbnail = MediaDerivative::where('media_file_id', $mediaId)
                ->where('derivative_type', 'thumbnail')
                ->first();
            
            return $thumbnail?->file_path;
        });
    }

    /**
     * Batch get media files with derivatives
     */
    public function batchGetMedia(array $mediaIds): array
    {
        $cacheKey = $this->getCacheKey('batch', md5(implode(',', $mediaIds)));
        
        return Cache::remember($cacheKey, self::MEDIA_TTL, function () use ($mediaIds) {
            return MediaFile::with(['derivatives', 'thumbnail'])
                ->whereIn('id', $mediaIds)
                ->get()
                ->keyBy('id')
                ->toArray();
        });
    }

    /**
     * Cache media URLs for publication
     */
    public function cachePublicationMedia(int $publicationId): array
    {
        $cacheKey = $this->getCacheKey('publication_media', $publicationId);
        
        return Cache::remember($cacheKey, self::MEDIA_TTL, function () use ($publicationId) {
            return \DB::table('publication_media')
                ->join('media_files', 'publication_media.media_file_id', '=', 'media_files.id')
                ->leftJoin('media_derivatives', function($join) {
                    $join->on('media_files.id', '=', 'media_derivatives.media_file_id')
                        ->where('media_derivatives.derivative_type', '=', 'thumbnail');
                })
                ->where('publication_media.publication_id', $publicationId)
                ->select([
                    'media_files.id',
                    'media_files.file_path',
                    'media_files.file_type',
                    'media_files.file_name',
                    'media_derivatives.file_path as thumbnail_path',
                    'publication_media.order'
                ])
                ->orderBy('publication_media.order')
                ->get()
                ->toArray();
        });
    }

    /**
     * Invalidate media cache
     */
    public function invalidate(int $mediaId): void
    {
        $patterns = [
            $this->getCacheKey('full', $mediaId),
            $this->getCacheKey('thumbnail_url', $mediaId),
        ];
        
        foreach ($patterns as $key) {
            Cache::forget($key);
        }
        
        // Invalidate all derivative variations
        Cache::forget($this->getCacheKey('derivative', "{$mediaId}:*"));
        
        Log::info('Media cache invalidated', ['media_id' => $mediaId]);
    }

    /**
     * Invalidate publication media cache
     */
    public function invalidatePublication(int $publicationId): void
    {
        Cache::forget($this->getCacheKey('publication_media', $publicationId));
        
        Log::info('Publication media cache invalidated', ['publication_id' => $publicationId]);
    }

    /**
     * Warm up cache for frequently accessed media
     */
    public function warmUp(array $mediaIds): int
    {
        $warmed = 0;
        
        foreach ($mediaIds as $mediaId) {
            $this->getMediaWithDerivatives($mediaId);
            $this->getThumbnailUrl($mediaId);
            $warmed++;
        }
        
        Log::info('Media cache warmed up', ['count' => $warmed]);
        
        return $warmed;
    }

    private function getCacheKey(string $type, int|string $id): string
    {
        return self::CACHE_PREFIX . "{$type}:{$id}";
    }
}
