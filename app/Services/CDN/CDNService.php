<?php

namespace App\Services\CDN;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * CDN service for serving media files with caching and optimization
 * Supports CloudFront, Cloudflare, or any CDN provider
 */
class CDNService
{
    private const SIGNED_URL_TTL = 3600; // 1 hour
    private const PUBLIC_URL_TTL = 86400; // 24 hours

    private string $cdnDomain;
    private bool $useSignedUrls;
    private ?string $privateKey;

    public function __construct()
    {
        $this->cdnDomain = config('cdn.domain', config('filesystems.disks.s3.url'));
        $this->useSignedUrls = config('cdn.use_signed_urls', false);
        $this->privateKey = config('cdn.private_key_path');
    }

    /**
     * Get CDN URL for media file
     */
    public function getUrl(string $s3Path, array $options = []): string
    {
        $cacheKey = "cdn:url:" . md5($s3Path . json_encode($options));
        
        return Cache::remember($cacheKey, self::PUBLIC_URL_TTL, function () use ($s3Path, $options) {
            if ($this->useSignedUrls) {
                return $this->getSignedUrl($s3Path, $options);
            }
            
            return $this->getPublicUrl($s3Path, $options);
        });
    }

    /**
     * Get public CDN URL
     */
    private function getPublicUrl(string $s3Path, array $options = []): string
    {
        $url = rtrim($this->cdnDomain, '/') . '/' . ltrim($s3Path, '/');
        
        // Add query parameters for image transformations
        if (!empty($options)) {
            $params = $this->buildTransformParams($options);
            if ($params) {
                $url .= '?' . http_build_query($params);
            }
        }
        
        return $url;
    }

    /**
     * Get signed CDN URL (CloudFront)
     */
    private function getSignedUrl(string $s3Path, array $options = []): string
    {
        if (!$this->privateKey || !file_exists($this->privateKey)) {
            Log::warning('CDN private key not found, falling back to public URL');
            return $this->getPublicUrl($s3Path, $options);
        }
        
        $url = $this->getPublicUrl($s3Path, $options);
        $expires = time() + self::SIGNED_URL_TTL;
        
        // CloudFront signed URL generation
        $policy = json_encode([
            'Statement' => [[
                'Resource' => $url,
                'Condition' => [
                    'DateLessThan' => ['AWS:EpochTime' => $expires]
                ]
            ]]
        ]);
        
        $signature = '';
        openssl_sign($policy, $signature, file_get_contents($this->privateKey), OPENSSL_ALGO_SHA1);
        $signature = strtr(base64_encode($signature), '+=/
', '-_~');
        
        $queryParams = [
            'Expires' => $expires,
            'Signature' => $signature,
            'Key-Pair-Id' => config('cdn.key_pair_id')
        ];
        
        return $url . '?' . http_build_query($queryParams);
    }

    /**
     * Build transformation parameters for image optimization
     */
    private function buildTransformParams(array $options): array
    {
        $params = [];
        
        // Width/Height
        if (isset($options['width'])) {
            $params['w'] = $options['width'];
        }
        if (isset($options['height'])) {
            $params['h'] = $options['height'];
        }
        
        // Format (webp, avif, etc.)
        if (isset($options['format'])) {
            $params['format'] = $options['format'];
        }
        
        // Quality
        if (isset($options['quality'])) {
            $params['q'] = $options['quality'];
        }
        
        // Fit mode (cover, contain, fill)
        if (isset($options['fit'])) {
            $params['fit'] = $options['fit'];
        }
        
        return $params;
    }

    /**
     * Get optimized image URL with WebP/AVIF support
     */
    public function getOptimizedImageUrl(string $s3Path, int $width = null, int $height = null, string $format = 'webp'): string
    {
        $options = array_filter([
            'width' => $width,
            'height' => $height,
            'format' => $format,
            'quality' => 85,
        ]);
        
        return $this->getUrl($s3Path, $options);
    }

    /**
     * Get responsive image URLs (srcset)
     */
    public function getResponsiveUrls(string $s3Path, array $widths = [320, 640, 1024, 1920]): array
    {
        $urls = [];
        
        foreach ($widths as $width) {
            $urls[$width] = $this->getOptimizedImageUrl($s3Path, $width, null, 'webp');
        }
        
        return $urls;
    }

    /**
     * Invalidate CDN cache for specific path
     */
    public function invalidate(string $s3Path): bool
    {
        // Clear local cache
        Cache::forget("cdn:url:" . md5($s3Path));
        
        // CloudFront invalidation
        if (config('cdn.provider') === 'cloudfront') {
            return $this->invalidateCloudFront([$s3Path]);
        }
        
        // Cloudflare purge
        if (config('cdn.provider') === 'cloudflare') {
            return $this->purgeCloudflare([$s3Path]);
        }
        
        return true;
    }

    /**
     * Invalidate CloudFront distribution
     */
    private function invalidateCloudFront(array $paths): bool
    {
        try {
            $client = new \Aws\CloudFront\CloudFrontClient([
                'version' => 'latest',
                'region' => config('aws.region', 'us-east-1'),
                'credentials' => [
                    'key' => config('aws.access_key_id'),
                    'secret' => config('aws.secret_access_key'),
                ],
            ]);
            
            $client->createInvalidation([
                'DistributionId' => config('cdn.cloudfront_distribution_id'),
                'InvalidationBatch' => [
                    'Paths' => [
                        'Quantity' => count($paths),
                        'Items' => array_map(fn($p) => '/' . ltrim($p, '/'), $paths),
                    ],
                    'CallerReference' => time(),
                ],
            ]);
            
            Log::info('CloudFront invalidation created', ['paths' => $paths]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('CloudFront invalidation failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Purge Cloudflare cache
     */
    private function purgeCloudflare(array $paths): bool
    {
        try {
            $urls = array_map(fn($p) => $this->getPublicUrl($p), $paths);
            
            $response = \Http::withHeaders([
                'Authorization' => 'Bearer ' . config('cdn.cloudflare_api_token'),
                'Content-Type' => 'application/json',
            ])->post("https://api.cloudflare.com/client/v4/zones/" . config('cdn.cloudflare_zone_id') . "/purge_cache", [
                'files' => $urls,
            ]);
            
            if ($response->successful()) {
                Log::info('Cloudflare cache purged', ['paths' => $paths]);
                return true;
            }
            
            Log::error('Cloudflare purge failed', ['response' => $response->body()]);
            return false;
        } catch (\Exception $e) {
            Log::error('Cloudflare purge failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Batch invalidate multiple paths
     */
    public function batchInvalidate(array $paths): bool
    {
        foreach ($paths as $path) {
            Cache::forget("cdn:url:" . md5($path));
        }
        
        if (config('cdn.provider') === 'cloudfront') {
            return $this->invalidateCloudFront($paths);
        }
        
        if (config('cdn.provider') === 'cloudflare') {
            return $this->purgeCloudflare($paths);
        }
        
        return true;
    }
}
