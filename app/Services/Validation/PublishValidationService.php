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

        // Specific validations for video content
        if ($publication->mediaFiles->isNotEmpty()) {
            $mediaValidation = $this->validateMediaContent($publication, $platform);
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
    protected function validateMediaContent(Publication $publication, string $platform): array
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
        }

        return [
            'compatible' => $compatible,
            'errors' => $errors,
            'warnings' => $warnings
        ];
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
}