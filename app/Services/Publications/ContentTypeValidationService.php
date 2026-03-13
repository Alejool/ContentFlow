<?php

namespace App\Services\Publications;

use App\Models\Social\SocialAccount;
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
     * Suggest optimal content type based on media files
     *
     * @param array $mediaFiles
     * @param string|null $currentType
     * @return string
     */
    public function suggestContentType(array $mediaFiles, ?string $currentType = null): string
    {
        if (empty($mediaFiles)) {
            return $currentType ?? 'post';
        }

        $fileCount = count($mediaFiles);
        
        // Multiple files = carousel
        if ($fileCount > 1) {
            return 'carousel';
        }
        
        // Single file - check type and duration
        $file = $mediaFiles[0];
        $mimeType = '';
        $duration = null;
        
        if (is_array($file)) {
            $mimeType = $file['mime_type'] ?? $file['type'] ?? '';
            $duration = $file['duration'] ?? $file['metadata']['duration'] ?? null;
        } elseif (is_object($file) && method_exists($file, 'getMimeType')) {
            $mimeType = $file->getMimeType();
        }
        
        // Image file
        if (str_starts_with($mimeType, 'image/')) {
            return $currentType ?? 'post';
        }
        
        // Video file
        if (str_starts_with($mimeType, 'video/')) {
            if ($duration !== null) {
                // Suggest based on duration limits:
                // Stories: 1-60 seconds
                // Reels: 15-90 seconds  
                // Posts: any duration
                
                if ($duration <= 60) {
                    // Short videos can be either story or reel
                    // If current type is valid, keep it; otherwise suggest reel
                    if ($currentType === 'story' || $currentType === 'reel') {
                        return $currentType;
                    }
                    return 'reel'; // Default to reel for short videos
                } elseif ($duration <= 90) {
                    // 60-90 seconds: only reel is valid
                    return 'reel';
                } else {
                    // > 90 seconds: must be post
                    return 'post';
                }
            } else {
                // No duration info yet, keep current or default to reel
                return $currentType ?? 'reel';
            }
        }
        
        return $currentType ?? 'post';
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

        // Check if files are being processed - if so, skip validation
        $hasProcessingFiles = $this->hasProcessingFiles($mediaFiles);
        if ($hasProcessingFiles) {
            // Files are being processed, skip media validation
            return new ContentTypeValidationResult(true, [], []);
        }

        // Auto-convert content type based on video duration
        if ($fileCount === 1 && $this->isVideoFile($mediaFiles[0])) {
            $suggestedType = $this->suggestContentTypeByDuration($mediaFiles[0], $contentType);
            if ($suggestedType !== $contentType) {
                // Return suggestion for auto-conversion
                return new ContentTypeValidationResult(true, [], [
                    'suggested_content_type' => $suggestedType,
                    'reason' => $this->getContentTypeChangeReason($contentType, $suggestedType, $mediaFiles[0])
                ]);
            }
        }

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
                // Handle both UploadedFile objects and array metadata (S3 direct upload)
                if (is_array($file)) {
                    $mimeType = $file['mime_type'] ?? $file['type'] ?? 'unknown';
                } elseif (is_object($file) && method_exists($file, 'getMimeType')) {
                    $mimeType = $file->getMimeType();
                } else {
                    // Skip validation for unknown file types
                    continue;
                }
                
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

    /**
     * Check if any files are currently being processed
     *
     * @param array $mediaFiles
     * @return bool
     */
    private function hasProcessingFiles(array $mediaFiles): bool
    {
        foreach ($mediaFiles as $file) {
            // Check if it's a file being uploaded (UploadedFile)
            if (is_object($file) && method_exists($file, 'isValid')) {
                return true; // File is being uploaded
            }
            
            // Check if it's metadata with processing status
            if (is_array($file) && isset($file['status'])) {
                $status = $file['status'];
                if (in_array($status, ['processing', 'uploading', 'pending', 'transcoding'])) {
                    return true;
                }
            }
            
            // Check if it's metadata without a final file path (still uploading)
            if (is_array($file) && isset($file['key']) && !isset($file['file_path'])) {
                return true;
            }
            
            // Check if it's a temporary upload (has temp_id but no final media_file_id)
            if (is_array($file) && isset($file['temp_id']) && !isset($file['media_file_id'])) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Suggest content type based on video duration
     *
     * @param mixed $mediaFile
     * @param string $currentType
     * @return string
     */
    /**
     * Suggest content type based on video duration
     */
    public function suggestContentTypeByDuration($mediaFile, string $currentType): string
    {
        // Only suggest for video files
        $mimeType = '';
        $duration = null;
        
        if (is_array($mediaFile)) {
            $mimeType = $mediaFile['mime_type'] ?? $mediaFile['type'] ?? '';
            $duration = $mediaFile['duration'] ?? $mediaFile['metadata']['duration'] ?? null;
        } elseif (is_object($mediaFile) && method_exists($mediaFile, 'getMimeType')) {
            $mimeType = $mediaFile->getMimeType();
            // For uploaded files, we can't get duration yet
        }
        
        // Only process video files
        if (!str_starts_with($mimeType, 'video/')) {
            return $currentType;
        }
        
        // If we don't have duration info yet, keep current type
        if ($duration === null) {
            return $currentType;
        }
        
        // Auto-suggest based on duration limits
        if ($duration <= 60) {
            // 1-60 seconds: can be story or reel
            // If current type is valid, keep it
            if ($currentType === 'story' || $currentType === 'reel') {
                return $currentType;
            }
            return 'reel'; // Default to reel
        } elseif ($duration <= 90) {
            // 60-90 seconds: only reel is valid
            return 'reel';
        } else {
            // > 90 seconds: must be post
            return 'post';
        }
    }

    /**
     * Check if a media file is a video
     */
    private function isVideoFile($mediaFile): bool
    {
        $mimeType = '';
        
        if (is_array($mediaFile)) {
            $mimeType = $mediaFile['mime_type'] ?? $mediaFile['type'] ?? '';
        } elseif (is_object($mediaFile) && method_exists($mediaFile, 'getMimeType')) {
            $mimeType = $mediaFile->getMimeType();
        }
        
        return str_starts_with($mimeType, 'video/');
    }

    /**
     * Get reason for content type change suggestion
     */
    private function getContentTypeChangeReason(string $currentType, string $suggestedType, $mediaFile): string
    {
        $duration = null;
        
        if (is_array($mediaFile)) {
            $duration = $mediaFile['duration'] ?? $mediaFile['metadata']['duration'] ?? null;
        }
        
        if ($duration === null) {
            return "Video duration will be analyzed to suggest optimal content type";
        }
        
        $durationText = gmdate("i:s", $duration);
        
        if ($suggestedType === 'post') {
            return "Video duration ({$durationText}) exceeds limits for {$currentType}. Suggested: Post (no duration limit)";
        } elseif ($suggestedType === 'reel') {
            return "Video duration ({$durationText}) is optimal for Reel format";
        } elseif ($suggestedType === 'story') {
            return "Video duration ({$durationText}) is suitable for Story format";
        }
        
        return "Content type adjusted based on video duration ({$durationText})";
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
