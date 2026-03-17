<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use App\Services\Validation\PublishValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicationValidationController extends Controller
{
    public function __construct(
        protected PublishValidationService $validationService
    ) {}

    /**
     * Get platform capabilities for a publication
     * Returns which platforms can publish this content and why
     */
    public function getPlatformCapabilities(Request $request, Publication $publication)
    {
        $workspaceId = Auth::user()->current_workspace_id;
        
        // Force fresh load of media files to ensure we have current data
        $publication->load('mediaFiles');
        
        // Get all connected accounts for this workspace
        $socialAccounts = SocialAccount::where('workspace_id', $workspaceId)
            ->where('is_active', true)
            ->get();
        
        $capabilities = [];
        
        foreach ($socialAccounts as $account) {
            $validation = $this->validationService->validatePlatformCompatibility(
                $publication,
                $account
            );
            
            $capabilities[] = [
                'account_id' => $account->id,
                'platform' => $account->platform,
                'account_name' => $account->account_name,
                'can_publish' => $validation['compatible'],
                'errors' => $validation['errors'],
                'warnings' => $validation['warnings'],
                'metadata' => $this->getAccountCapabilitiesMetadata($account, $publication),
            ];
        }
        
        return response()->json([
            'publication_id' => $publication->id,
            'content_type' => $publication->content_type,
            'has_media' => $publication->mediaFiles->isNotEmpty(),
            'media_count' => $publication->mediaFiles->count(),
            'capabilities' => $capabilities,
        ]);
    }
    
    /**
     * Get detailed capabilities metadata for an account
     */
    protected function getAccountCapabilitiesMetadata(SocialAccount $account, Publication $publication): array
    {
        $metadata = $account->account_metadata ?? [];
        $platform = $account->platform;
        
        $capabilities = [
            'platform' => $platform,
            'supports_text_only' => in_array($platform, ['twitter', 'facebook', 'instagram', 'linkedin']),
            'requires_media' => in_array($platform, ['youtube', 'tiktok']),
            'supports_images' => !in_array($platform, ['youtube', 'tiktok']),
            'supports_videos' => true,
            'supports_polls' => in_array($platform, ['twitter', 'facebook', 'instagram']),
            'supports_carousels' => in_array($platform, ['instagram', 'facebook', 'linkedin', 'twitter', 'threads', 'youtube', 'pinterest', 'tiktok']),
            'supports_stories' => in_array($platform, ['instagram', 'facebook', 'twitter', 'threads', 'linkedin', 'youtube', 'pinterest', 'tiktok']),
            'supports_reels' => in_array($platform, ['instagram', 'facebook', 'youtube', 'tiktok']),
        ];
        
        // Platform-specific limits
        switch ($platform) {
            case 'twitter':
                $hasTwitterBlue = $metadata['has_twitter_blue'] ?? false;
                $isVerified = $metadata['is_verified'] ?? false;
                $capabilities['video_max_duration'] = ($hasTwitterBlue || $isVerified) ? 600 : 140;
                $capabilities['video_max_duration_formatted'] = ($hasTwitterBlue || $isVerified) ? '10 min' : '2:20 min';
                $capabilities['has_twitter_blue'] = $hasTwitterBlue;
                $capabilities['is_verified'] = $isVerified;
                $capabilities['upgrade_message'] = !$hasTwitterBlue && !$isVerified 
                    ? 'Necesitas Twitter Blue o verificación para videos largos' 
                    : null;
                break;
                
            case 'youtube':
                $isVerified = $metadata['is_verified'] ?? false;
                $longUploadsEnabled = $metadata['long_uploads_enabled'] ?? false;
                $capabilities['video_max_duration'] = ($isVerified || $longUploadsEnabled) ? 43200 : 900;
                $capabilities['video_max_duration_formatted'] = ($isVerified || $longUploadsEnabled) ? '12 horas' : '15 min';
                $capabilities['is_verified'] = $isVerified;
                $capabilities['long_uploads_enabled'] = $longUploadsEnabled;
                $capabilities['upgrade_message'] = !$isVerified && !$longUploadsEnabled
                    ? 'Verifica tu cuenta de YouTube para subir videos más largos'
                    : null;
                break;
                
            case 'instagram':
                $capabilities['reel_max_duration'] = 90;
                $capabilities['story_max_duration'] = 15;
                $capabilities['carousel_max_items'] = 10;
                break;
                
            case 'tiktok':
                $capabilities['video_max_duration'] = 600;
                $capabilities['video_min_duration'] = 15;
                break;
        }
        
        // Check current publication compatibility - only if there are actual media files
        if ($publication->mediaFiles->isNotEmpty()) {
            // Get only video files
            $videoFiles = $publication->mediaFiles->filter(function ($media) {
                return $media->file_type === 'video' || 
                       (isset($media->mime_type) && str_starts_with($media->mime_type, 'video/'));
            });
            
            if ($videoFiles->isNotEmpty()) {
                $firstVideo = $videoFiles->first();
                $capabilities['current_media_duration'] = $firstVideo->duration ?? 0;
                $capabilities['current_media_type'] = 'video';
                
                if (isset($capabilities['video_max_duration'])) {
                    $capabilities['exceeds_limit'] = ($firstVideo->duration ?? 0) > $capabilities['video_max_duration'];
                }
            } else {
                // Has media but no videos
                $firstMedia = $publication->mediaFiles->first();
                $capabilities['current_media_type'] = $firstMedia->file_type ?? 'image';
                $capabilities['current_media_duration'] = 0;
                $capabilities['exceeds_limit'] = false;
            }
        } else {
            // No media files at all
            $capabilities['current_media_type'] = null;
            $capabilities['current_media_duration'] = 0;
            $capabilities['exceeds_limit'] = false;
        }
        
        return $capabilities;
    }
}
