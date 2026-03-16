<?php

namespace App\Services\Validation;

use App\Constants\ContentTypes;
use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use Illuminate\Support\Collection;

class PublishValidationService
{
    /**
     * Validate if a publication can be published to selected platforms
     */
    public function validatePublishRequest(Publication $publication, array $platformIds): array
    {
        if (empty($platformIds)) {
            return ['canPublish' => false, 'errors' => ['No social accounts selected.']];
        }

        $socialAccounts = SocialAccount::whereIn('id', $platformIds)
            ->where('workspace_id', $publication->workspace_id)
            ->get();

        $validationResults = [];
        $canPublish = true;
        $globalErrors = [];
        $globalWarnings = [];

        foreach ($socialAccounts as $account) {
            $result = $this->validatePlatformCompatibility($publication, $account);
            $validationResults[$account->platform] = $result;
            
            if (!$result['compatible']) {
                $canPublish = false;
                $globalErrors = array_merge($globalErrors, $result['errors']);
            }
            
            $globalWarnings = array_merge($globalWarnings, $result['warnings']);
        }

        return [
            'can_publish' => $canPublish,
            'platform_results' => $validationResults,
            'global_errors' => array_unique($globalErrors),
            'global_warnings' => array_unique($globalWarnings),
            'recommendations' => $this->generateRecommendations($publication, $socialAccounts)
        ];
    }

    /**
     * Validate content type compatibility with platform
     */
    protected function validatePlatformCompatibility(Publication $publication, SocialAccount $account): array
    {
        $platform = $account->platform;
        $contentType = $publication->content_type;
        $supportedTypes = Publication::getSupportedContentTypes($platform);
        
        $errors = [];
        $warnings = [];
        $compatible = true;

        // Check if content type is supported by platform
        if (!in_array($contentType, $supportedTypes)) {
            $errors[] = __('validation.content_type_not_supported', [
                'type' => $contentType,
                'platform' => ucfirst($platform),
                'supported' => implode(', ', $supportedTypes)
            ]);
            $compatible = false;
        }
        // Specific validations for polls
        if ($publication->isPoll()) {
            $pollValidation = $this->validatePollContent($publication, $platform);
            $errors = array_merge($errors, $pollValidation['errors']);
            $warnings = array_merge($warnings, $pollValidation['warnings']);
            if (!$pollValidation['compatible']) {
                $compatible = false;
            }
        }

        // Specific validations for reels
        if ($publication->content_type === 'reel') {
            $reelValidation = $this->validateReelContent($publication, $platform);
            $errors = array_merge($errors, $reelValidation['errors']);
            $warnings = array_merge($warnings, $reelValidation['warnings']);
            if (!$reelValidation['compatible']) {
                $compatible = false;
            }
        }

        // Specific validations for stories
        if ($publication->content_type === 'story') {
            $storyValidation = $this->validateStoryContent($publication, $platform);
            $errors = array_merge($errors, $storyValidation['errors']);
            $warnings = array_merge($warnings, $storyValidation['warnings']);
            if (!$storyValidation['compatible']) {
                $compatible = false;
            }
        }

        // Specific validations for carousels
        if ($publication->content_type === 'carousel') {
            $carouselValidation = $this->validateCarouselContent($publication, $platform);
            $errors = array_merge($errors, $carouselValidation['errors']);
            $warnings = array_merge($warnings, $carouselValidation['warnings']);
            if (!$carouselValidation['compatible']) {
                $compatible = false;
            }
        }

        // Specific validations for video content (only for posts, not for reels/stories/carousels)
        if ($publication->mediaFiles->isNotEmpty() && $publication->content_type === 'post') {
            $mediaValidation = $this->validateMediaContent($publication, $platform, $account);
            $errors = array_merge($errors, $mediaValidation['errors']);
            $warnings = array_merge($warnings, $mediaValidation['warnings']);
            if (!$mediaValidation['compatible']) {
                $compatible = false;
            }
        }

        return [
            'platform' => $platform,
            'compatible' => $compatible,
            'errors' => $errors,
            'warnings' => $warnings,
            'account_name' => $account->name ?? $account->platform,
            'account_id' => $account->id
        ];
    }

    /**
     * Validate poll content for specific platform
     */
    protected function validatePollContent(Publication $publication, string $platform): array
    {
        $errors = [];
        $warnings = [];
        $compatible = true;

        // Polls are not supported on YouTube
        if ($platform === 'youtube') {
            $errors[] = __('validation.polls_not_supported_youtube');
            $compatible = false;
        }

        // Validate poll options
        $pollOptions = $publication->poll_options ?? [];
        if (empty($pollOptions) || count($pollOptions) < 2) {
            $errors[] = __('validation.poll_minimum_options');
            $compatible = false;
        }

        if (count($pollOptions) > 4) {
            $errors[] = __('validation.poll_maximum_options');
            $compatible = false;
        }

        // Validate poll duration
        $duration = $publication->poll_duration_hours ?? 24;
        if ($platform === 'twitter' && ($duration < 5/60 || $duration > 168)) { // 5 minutes to 7 days
            $warnings[] = __('validation.poll_duration_twitter', ['duration' => $duration]);
        }

        return [
            'compatible' => $compatible,
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }

    /**
     * Validate media content for specific platform
     */
    protected function validateMediaContent(Publication $publication, string $platform, SocialAccount $account): array
    {
        $errors = [];
        $warnings = [];
        $compatible = true;

        foreach ($publication->mediaFiles as $mediaFile) {
            // YouTube requires video files
            if ($platform === 'youtube' && !$this->isVideoFile($mediaFile)) {
                $errors[] = __('validation.youtube_requires_video');
                $compatible = false;
            }

            // TikTok only accepts videos
            if ($platform === 'tiktok' && !$this->isVideoFile($mediaFile)) {
                $errors[] = __('validation.tiktok_requires_video');
                $compatible = false;
            }
            
            // Twitter video duration validation
            if ($platform === 'twitter' && $this->isVideoFile($mediaFile)) {
                $videoDuration = $mediaFile->duration ?? 0;
                $accountMetadata = $account->account_metadata ?? [];
                
                // Check if account has Twitter Blue or is verified
                $hasTwitterBlue = $accountMetadata['has_twitter_blue'] ?? false;
                $isVerified = $accountMetadata['is_verified'] ?? false;
                
                // Free accounts: max 2 minutes 20 seconds (140 seconds)
                // Blue/Verified accounts: max 10 minutes (600 seconds)
                $maxDuration = ($hasTwitterBlue || $isVerified) ? 600 : 140;
                
                if ($videoDuration > $maxDuration) {
                    if (!$hasTwitterBlue && !$isVerified) {
                        $errors[] = sprintf(
                            'Tu cuenta de Twitter (@%s) no permite videos de más de 2 minutos. Este video dura %s. Necesitas Twitter Blue o verificación para videos largos.',
                            $account->account_name,
                            $this->formatDuration($videoDuration)
                        );
                    } else {
                        $errors[] = sprintf(
                            'El video dura %s pero Twitter permite máximo 10 minutos.',
                            $this->formatDuration($videoDuration)
                        );
                    }
                    $compatible = false;
                }
                
                // Warning for videos close to the limit
                if ($videoDuration > ($maxDuration * 0.9) && $videoDuration <= $maxDuration) {
                    $warnings[] = sprintf(
                        'El video está cerca del límite de duración para Twitter (%s de %s permitidos).',
                        $this->formatDuration($videoDuration),
                        $this->formatDuration($maxDuration)
                    );
                }
            }
        }

        return [
            'compatible' => $compatible,
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }
    
    /**
     * Format duration in seconds to human readable format
     */
    protected function formatDuration(int $seconds): string
    {
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;
        
        if ($minutes > 0) {
            return sprintf('%d:%02d min', $minutes, $remainingSeconds);
        }
        
        return sprintf('%d seg', $seconds);
    }

    /**
     * Check if media file is a video
     */
    protected function isVideoFile($mediaFile): bool
    {
        $videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
        $extension = strtolower(pathinfo($mediaFile->filename, PATHINFO_EXTENSION));
        return in_array($extension, $videoExtensions);
    }

    /**
     * Generate recommendations based on content and platforms
     */
    protected function generateRecommendations(Publication $publication, Collection $socialAccounts): array
    {
        $recommendations = [];

        if ($publication->isPoll()) {
            $pollPlatforms = $socialAccounts->whereIn('platform', ['twitter', 'facebook'])->pluck('platform')->unique();
            if ($pollPlatforms->isNotEmpty()) {
                $recommendations[] = __('validation.poll_recommendation', [
                    'platforms' => $pollPlatforms->map('ucfirst')->implode(', ')
                ]);
            }
        }

        if ($publication->content_type === 'reel') {
            $reelPlatforms = $socialAccounts->whereIn('platform', ContentTypes::REEL_COMPATIBLE_PLATFORMS)->pluck('platform')->unique();
            if ($reelPlatforms->isNotEmpty()) {
                $recommendations[] = __('validation.reel_recommendation', [
                    'platforms' => $reelPlatforms->map('ucfirst')->implode(', ')
                ]);
            }
        }

        return $recommendations;
    }

    /**
     * Validate reel content for platform compatibility
     */
    protected function validateReelContent(Publication $publication, string $platform): array
    {
        $errors = [];
        $warnings = [];
        $compatible = true;

        $mediaFile = $publication->mediaFiles->first();
        
        if (!$mediaFile) {
            $errors[] = __('validation.reel_requires_video');
            return ['errors' => $errors, 'warnings' => $warnings, 'compatible' => false];
        }

        if ($mediaFile->file_type !== 'video') {
            $errors[] = __('validation.reel_must_be_video');
            $compatible = false;
        }

        // Platform-specific validations
        switch ($platform) {
            case 'instagram':
                // Instagram Reels: 15 seconds to 90 seconds
                if (isset($mediaFile->duration)) {
                    if ($mediaFile->duration < 15) {
                        $warnings[] = __('validation.instagram_reel_min_duration', ['duration' => $mediaFile->duration]);
                    }
                    if ($mediaFile->duration > 90) {
                        $errors[] = __('validation.instagram_reel_max_duration', ['duration' => $mediaFile->duration]);
                        $compatible = false;
                    }
                }
                
                // Aspect ratio should be vertical (9:16)
                if (isset($mediaFile->width) && isset($mediaFile->height)) {
                    $aspectRatio = $mediaFile->width / $mediaFile->height;
                    if ($aspectRatio > 0.6) { // Not vertical enough
                        $warnings[] = __('validation.instagram_reel_aspect_ratio');
                    }
                }
                break;

            case 'tiktok':
                // TikTok: 15 seconds to 10 minutes
                if (isset($mediaFile->duration)) {
                    if ($mediaFile->duration < 15) {
                        $warnings[] = __('validation.tiktok_min_duration', ['duration' => $mediaFile->duration]);
                    }
                    if ($mediaFile->duration > 600) {
                        $errors[] = __('validation.tiktok_max_duration', ['duration' => $mediaFile->duration]);
                        $compatible = false;
                    }
                }
                break;

            case 'youtube':
                // YouTube Shorts: up to 60 seconds
                if (isset($mediaFile->duration) && $mediaFile->duration > 60) {
                    $errors[] = __('validation.youtube_shorts_max_duration', ['duration' => $mediaFile->duration]);
                    $compatible = false;
                }
                break;

            case 'facebook':
                // Facebook Reels: 15 seconds to 90 seconds (similar to Instagram)
                if (isset($mediaFile->duration)) {
                    if ($mediaFile->duration < 15) {
                        $warnings[] = __('validation.facebook_reel_min_duration', ['duration' => $mediaFile->duration]);
                    }
                    if ($mediaFile->duration > 90) {
                        $errors[] = __('validation.facebook_reel_max_duration', ['duration' => $mediaFile->duration]);
                        $compatible = false;
                    }
                }
                break;
        }

        return ['errors' => $errors, 'warnings' => $warnings, 'compatible' => $compatible];
    }

    /**
     * Validate story content for platform compatibility
     */
    protected function validateStoryContent(Publication $publication, string $platform): array
    {
        $errors = [];
        $warnings = [];
        $compatible = true;

        $mediaFile = $publication->mediaFiles->first();
        
        if (!$mediaFile) {
            $errors[] = __('validation.story_requires_media');
            return ['errors' => $errors, 'warnings' => $warnings, 'compatible' => false];
        }

        // Platform-specific validations
        switch ($platform) {
            case 'instagram':
                // Instagram Stories: 15 seconds max for videos
                if ($mediaFile->file_type === 'video' && isset($mediaFile->duration)) {
                    if ($mediaFile->duration > 15) {
                        $errors[] = __('validation.instagram_story_max_duration', ['duration' => $mediaFile->duration]);
                        $compatible = false;
                    }
                }
                
                // Aspect ratio should be vertical (9:16)
                if (isset($mediaFile->width) && isset($mediaFile->height)) {
                    $aspectRatio = $mediaFile->width / $mediaFile->height;
                    if ($aspectRatio > 0.6) {
                        $warnings[] = __('validation.instagram_story_aspect_ratio');
                    }
                }
                break;

            case 'facebook':
                // Facebook Stories: 60 seconds max for videos (updated limit)
                if ($mediaFile->file_type === 'video' && isset($mediaFile->duration)) {
                    if ($mediaFile->duration > 60) {
                        $errors[] = __('validation.facebook_story_max_duration', ['duration' => $mediaFile->duration]);
                        $compatible = false;
                    }
                }
                break;
        }

        return ['errors' => $errors, 'warnings' => $warnings, 'compatible' => $compatible];
    }

    /**
     * Validate carousel content for platform compatibility
     */
    protected function validateCarouselContent(Publication $publication, string $platform): array
    {
        $errors = [];
        $warnings = [];
        $compatible = true;

        $mediaFiles = $publication->mediaFiles;
        
        \Log::info('🎠 Carousel validation', [
            'publication_id' => $publication->id,
            'media_files_count' => $mediaFiles->count(),
            'media_files' => $mediaFiles->map(function($file) {
                return [
                    'id' => $file->id,
                    'file_name' => $file->file_name,
                    'file_type' => $file->file_type,
                    'status' => $file->status,
                ];
            })->toArray(),
        ]);
        
        if ($mediaFiles->count() < 2) {
            $errors[] = __('validation.carousel_min_media');
            return ['errors' => $errors, 'warnings' => $warnings, 'compatible' => false];
        }

        // Platform-specific validations
        switch ($platform) {
            case 'instagram':
                if ($mediaFiles->count() > 10) {
                    $errors[] = __('validation.instagram_carousel_max_media', ['count' => $mediaFiles->count()]);
                    $compatible = false;
                }
                
                // Check for mixed media types
                $hasImages = $mediaFiles->where('file_type', 'image')->count() > 0;
                $hasVideos = $mediaFiles->where('file_type', 'video')->count() > 0;
                
                if ($hasImages && $hasVideos) {
                    $warnings[] = __('validation.instagram_carousel_mixed_media');
                }
                break;

            case 'facebook':
                if ($mediaFiles->count() > 10) {
                    $errors[] = __('validation.facebook_carousel_max_media', ['count' => $mediaFiles->count()]);
                    $compatible = false;
                }
                break;

            case 'linkedin':
                if ($mediaFiles->count() > 9) {
                    $errors[] = __('validation.linkedin_carousel_max_media', ['count' => $mediaFiles->count()]);
                    $compatible = false;
                }
                break;
        }

        return ['errors' => $errors, 'warnings' => $warnings, 'compatible' => $compatible];
    }
}