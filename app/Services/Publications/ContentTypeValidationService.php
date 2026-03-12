<?php

namespace App\Services\Publications;

use App\Models\SocialAccount;
use Illuminate\Support\Facades\Config;

class ContentTypeValidationService
{
    /**
     * Validate content type against social accounts and media files
     *
     * @param string|null $contentType
     * @param array $socialAccountIds
     * @param array $mediaFiles
     * @return ContentTypeValidationResult
     */
    public function validateContentType(?string $contentType, array $socialAccountIds, array $mediaFiles): ContentTypeValidationResult
    {
        $errors = [];
        $failedPlatforms = [];

        // Handle null content type
        if ($contentType === null) {
            return new ContentTypeValidationResult(
                false,
                ["Content type is required."],
                []
            );
        }

        // Get content type rules
        $rules = $this->getContentTypeRules($contentType);
        
        if (empty($rules)) {
            return new ContentTypeValidationResult(
                false,
                ["Content type '{$contentType}' is not recognized."],
                []
            );
        }

        // Validate cross-platform compatibility
        if (!empty($socialAccountIds)) {
            $platforms = SocialAccount::whereIn('id', $socialAccountIds)
                ->pluck('platform')
                ->unique()
                ->toArray();

            $crossPlatformResult = $this->validateCrossPlatform($contentType, $platforms);
            
            if (!$crossPlatformResult->isValid) {
                $errors = array_merge($errors, $crossPlatformResult->errors);
                $failedPlatforms = array_merge($failedPlatforms, $crossPlatformResult->failedPlatforms);
            }
        }

        // Validate media files
        $mediaResult = $this->validateMediaFiles($contentType, $mediaFiles);
        
        if (!$mediaResult->isValid) {
            $errors = array_merge($errors, $mediaResult->errors);
        }

        return new ContentTypeValidationResult(
            empty($errors),
            $errors,
            $failedPlatforms
        );
    }

    /**
     * Get supported content types for a platform
     *
     * @param string $platform
     * @return array
     */
    public function getSupportedContentTypes(string $platform): array
    {
        $contentTypes = Config::get('content_types', []);
        $supported = [];

        foreach ($contentTypes as $type => $config) {
            if (in_array($platform, $config['platforms'] ?? [])) {
                $supported[] = $type;
            }
        }

        return $supported;
    }

    /**
     * Get content type rules
     *
     * @param string $contentType
     * @return array
     */
    public function getContentTypeRules(string $contentType): array
    {
        return Config::get("content_types.{$contentType}", []);
    }

    /**
     * Validate media files against content type requirements
     *
     * @param string $contentType
     * @param array $mediaFiles
     * @return ContentTypeValidationResult
     */
    public function validateMediaFiles(string $contentType, array $mediaFiles): ContentTypeValidationResult
    {
        $rules = $this->getContentTypeRules($contentType);
        
        if (empty($rules)) {
            return new ContentTypeValidationResult(true, [], []);
        }

        $mediaConfig = $rules['media'] ?? [];
        $errors = [];

        $fileCount = count($mediaFiles);

        // Check if media is required
        if (($mediaConfig['required'] ?? false) && $fileCount === 0) {
            $minCount = $mediaConfig['min_count'] ?? 1;
            $maxCount = $mediaConfig['max_count'] ?? 1;
            
            if ($minCount === $maxCount) {
                $errors[] = "Content type '{$contentType}' requires exactly {$minCount} media file(s).";
            } else {
                $errors[] = "Content type '{$contentType}' requires at least {$minCount} media file(s).";
            }
            
            return new ContentTypeValidationResult(false, $errors, []);
        }

        // Check minimum count
        $minCount = $mediaConfig['min_count'] ?? 0;
        if ($fileCount > 0 && $fileCount < $minCount) {
            $maxCount = $mediaConfig['max_count'] ?? $minCount;
            
            if ($minCount === $maxCount) {
                $errors[] = "Content type '{$contentType}' requires exactly {$minCount} media file(s).";
            } else {
                $errors[] = "Content type '{$contentType}' requires at least {$minCount} media file(s) (maximum {$maxCount}).";
            }
        }

        // Check maximum count
        $maxCount = $mediaConfig['max_count'] ?? PHP_INT_MAX;
        if ($fileCount > $maxCount) {
            $minCount = $mediaConfig['min_count'] ?? 0;
            
            if ($minCount === $maxCount) {
                $errors[] = "Content type '{$contentType}' requires exactly {$maxCount} media file(s).";
            } else {
                $errors[] = "Content type '{$contentType}' allows maximum {$maxCount} media file(s).";
            }
        }

        // Check media types
        if ($fileCount > 0) {
            $allowedTypes = $mediaConfig['types'] ?? ['image', 'video'];
            $invalidFiles = [];

            foreach ($mediaFiles as $file) {
                $mimeType = $file->getMimeType();
                $fileType = $this->getFileTypeFromMime($mimeType);

                if (!in_array($fileType, $allowedTypes)) {
                    $invalidFiles[] = $fileType;
                }
            }

            if (!empty($invalidFiles)) {
                $allowedTypesStr = implode(' or ', $allowedTypes);
                $errors[] = "Content type '{$contentType}' requires {$allowedTypesStr} file(s) only.";
            }
        }

        return new ContentTypeValidationResult(
            empty($errors),
            $errors,
            []
        );
    }

    /**
     * Validate content type across multiple platforms
     *
     * @param string $contentType
     * @param array $platforms
     * @return ContentTypeValidationResult
     */
    public function validateCrossPlatform(string $contentType, array $platforms): ContentTypeValidationResult
    {
        $rules = $this->getContentTypeRules($contentType);
        
        if (empty($rules)) {
            return new ContentTypeValidationResult(
                false,
                ["Content type '{$contentType}' is not recognized."],
                []
            );
        }

        $supportedPlatforms = $rules['platforms'] ?? [];
        $unsupportedPlatforms = [];
        $errors = [];

        foreach ($platforms as $platform) {
            if (!in_array($platform, $supportedPlatforms)) {
                $unsupportedPlatforms[] = $platform;
            }
        }

        if (!empty($unsupportedPlatforms)) {
            if (count($platforms) === 1) {
                $platform = ucfirst($unsupportedPlatforms[0]);
                $supportedTypes = $this->getSupportedContentTypes($unsupportedPlatforms[0]);
                $supportedTypesStr = implode(', ', $supportedTypes);
                
                $errors[] = "Content type '{$contentType}' is not supported by {$platform}. Supported types: {$supportedTypesStr}";
            } else {
                $platformsList = implode(', ', array_map('ucfirst', $unsupportedPlatforms));
                $errors[] = "Content type '{$contentType}' is not supported by all selected platforms. {$platformsList} do not support {$contentType}.";
            }
        }

        return new ContentTypeValidationResult(
            empty($errors),
            $errors,
            $unsupportedPlatforms
        );
    }

    /**
     * Get file type from MIME type
     *
     * @param string $mimeType
     * @return string
     */
    private function getFileTypeFromMime(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }
        
        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }

        return 'unknown';
    }
}

/**
 * Content Type Validation Result Value Object
 */
class ContentTypeValidationResult
{
    public function __construct(
        public bool $isValid,
        public array $errors,
        public array $failedPlatforms
    ) {}
}
