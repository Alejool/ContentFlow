<?php

namespace App\Services\SocialPlatforms;

use App\Models\Social\SocialAccount;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PlatformCapabilitiesService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'http_errors' => false,
        ]);
    }

    /**
     * Fetch and update capabilities for a social account
     */
    public function updateAccountCapabilities(SocialAccount $account): array
    {
        $capabilities = match ($account->platform) {
            'youtube' => $this->fetchYouTubeCapabilities($account),
            'twitter' => $this->fetchTwitterCapabilities($account),
            'tiktok' => $this->fetchTikTokCapabilities($account),
            'instagram' => $this->fetchInstagramCapabilities($account),
            default => $this->getDefaultCapabilities($account->platform),
        };

        // Update account metadata
        $metadata = $account->account_metadata ?? [];
        $metadata['capabilities'] = $capabilities;
        $metadata['capabilities_updated_at'] = now()->toIso8601String();

        $account->update(['account_metadata' => $metadata]);

        Log::info("Updated capabilities for {$account->platform} account", [
            'account_id' => $account->id,
            'capabilities' => $capabilities,
        ]);

        return $capabilities;
    }

    /**
     * Get cached capabilities or fetch new ones
     */
    public function getAccountCapabilities(SocialAccount $account, bool $forceRefresh = false): array
    {
        $cacheKey = "account_capabilities_{$account->id}";

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($account) {
            $metadata = $account->account_metadata ?? [];
            
            // If capabilities exist and are recent (less than 24 hours old), use them
            if (isset($metadata['capabilities']) && isset($metadata['capabilities_updated_at'])) {
                $updatedAt = \Carbon\Carbon::parse($metadata['capabilities_updated_at']);
                if ($updatedAt->diffInHours(now()) < 24) {
                    return $metadata['capabilities'];
                }
            }

            // Otherwise, fetch new capabilities
            return $this->updateAccountCapabilities($account);
        });
    }

    /**
     * Fetch YouTube channel capabilities
     */
    private function fetchYouTubeCapabilities(SocialAccount $account): array
    {
        try {
            $response = $this->client->get('https://www.googleapis.com/youtube/v3/channels', [
                'headers' => [
                    'Authorization' => "Bearer {$account->access_token}",
                ],
                'query' => [
                    'part' => 'status,contentDetails',
                    'mine' => 'true',
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                Log::warning('Failed to fetch YouTube capabilities', [
                    'account_id' => $account->id,
                    'status' => $response->getStatusCode(),
                ]);
                return $this->getDefaultCapabilities('youtube');
            }

            $data = json_decode($response->getBody()->getContents(), true);
            $channel = $data['items'][0] ?? null;

            if (!$channel) {
                return $this->getDefaultCapabilities('youtube');
            }

            $longUploadsStatus = $channel['status']['longUploadsStatus'] ?? 'disallowed';
            $isVerified = $longUploadsStatus === 'allowed';

            return [
                'video_duration_limit' => $isVerified ? 43200 : 900, // 12 hours or 15 minutes in seconds
                'long_uploads_allowed' => $isVerified,
                'max_file_size_mb' => $isVerified ? 256000 : 128000, // 256GB or 128GB
                'supports_shorts' => true,
                'supports_live' => $channel['status']['isLinked'] ?? false,
                'channel_id' => $channel['id'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Error fetching YouTube capabilities', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
            return $this->getDefaultCapabilities('youtube');
        }
    }

    /**
     * Fetch Twitter/X user capabilities
     */
    private function fetchTwitterCapabilities(SocialAccount $account): array
    {
        try {
            $response = $this->client->get('https://api.twitter.com/2/users/me', [
                'headers' => [
                    'Authorization' => "Bearer {$account->access_token}",
                ],
                'query' => [
                    'user.fields' => 'verified,verified_type,public_metrics',
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                Log::warning('Failed to fetch Twitter capabilities', [
                    'account_id' => $account->id,
                    'status' => $response->getStatusCode(),
                ]);
                return $this->getDefaultCapabilities('twitter');
            }

            $data = json_decode($response->getBody()->getContents(), true);
            $user = $data['data'] ?? null;

            if (!$user) {
                return $this->getDefaultCapabilities('twitter');
            }

            // Determine if user has premium based on verified_type
            $verifiedType = $user['verified_type'] ?? null;
            $isPremium = in_array($verifiedType, ['blue', 'business', 'government']);

            // Premium users can upload longer videos
            $videoDurationLimit = $isPremium ? 600 : 140; // 10 min or 2:20 min in seconds
            $maxFileSizeMb = $isPremium ? 512 : 512; // Both 512MB

            return [
                'video_duration_limit' => $videoDurationLimit,
                'max_file_size_mb' => $maxFileSizeMb,
                'is_premium' => $isPremium,
                'is_verified' => $user['verified'] ?? false,
                'verified_type' => $verifiedType,
                'supports_long_tweets' => $isPremium,
            ];
        } catch (\Exception $e) {
            Log::error('Error fetching Twitter capabilities', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
            return $this->getDefaultCapabilities('twitter');
        }
    }

    /**
     * Fetch TikTok user capabilities
     */
    private function fetchTikTokCapabilities(SocialAccount $account): array
    {
        try {
            $response = $this->client->get('https://open.tiktokapis.com/v2/user/info/', [
                'headers' => [
                    'Authorization' => "Bearer {$account->access_token}",
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                Log::warning('Failed to fetch TikTok capabilities', [
                    'account_id' => $account->id,
                    'status' => $response->getStatusCode(),
                ]);
                return $this->getDefaultCapabilities('tiktok');
            }

            $data = json_decode($response->getBody()->getContents(), true);
            $user = $data['data']['user'] ?? null;

            if (!$user) {
                return $this->getDefaultCapabilities('tiktok');
            }

            // TikTok business accounts may have different limits
            $isBusiness = ($user['is_business_account'] ?? false);

            return [
                'video_duration_limit' => 600, // 10 minutes standard
                'max_file_size_mb' => 4096, // 4GB
                'is_business_account' => $isBusiness,
                'supports_photo_mode' => true,
            ];
        } catch (\Exception $e) {
            Log::error('Error fetching TikTok capabilities', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
            return $this->getDefaultCapabilities('tiktok');
        }
    }

    /**
     * Fetch Instagram capabilities
     */
    private function fetchInstagramCapabilities(SocialAccount $account): array
    {
        try {
            $response = $this->client->get('https://graph.facebook.com/v18.0/me', [
                'headers' => [
                    'Authorization' => "Bearer {$account->access_token}",
                ],
                'query' => [
                    'fields' => 'id,username,account_type',
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                Log::warning('Failed to fetch Instagram capabilities', [
                    'account_id' => $account->id,
                    'status' => $response->getStatusCode(),
                ]);
                return $this->getDefaultCapabilities('instagram');
            }

            $data = json_decode($response->getBody()->getContents(), true);
            $accountType = $data['account_type'] ?? 'PERSONAL';

            return [
                'video_duration_limit' => 900, // 15 minutes for reels
                'max_file_size_mb' => 1024, // 1GB
                'account_type' => $accountType,
                'supports_reels' => true,
                'supports_stories' => true,
                'supports_igtv' => true,
            ];
        } catch (\Exception $e) {
            Log::error('Error fetching Instagram capabilities', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
            return $this->getDefaultCapabilities('instagram');
        }
    }

    /**
     * Get default capabilities when API fetch fails
     */
    private function getDefaultCapabilities(string $platform): array
    {
        return match ($platform) {
            'youtube' => [
                'video_duration_limit' => 900, // 15 minutes (conservative default)
                'long_uploads_allowed' => false,
                'max_file_size_mb' => 128000,
                'supports_shorts' => true,
                'supports_live' => false,
            ],
            'twitter' => [
                'video_duration_limit' => 140, // 2:20 minutes (free tier)
                'max_file_size_mb' => 512,
                'is_premium' => false,
                'is_verified' => false,
                'supports_long_tweets' => false,
            ],
            'tiktok' => [
                'video_duration_limit' => 600, // 10 minutes
                'max_file_size_mb' => 4096,
                'is_business_account' => false,
                'supports_photo_mode' => true,
            ],
            'instagram' => [
                'video_duration_limit' => 900, // 15 minutes
                'max_file_size_mb' => 1024,
                'account_type' => 'PERSONAL',
                'supports_reels' => true,
                'supports_stories' => true,
            ],
            default => [
                'video_duration_limit' => 600,
                'max_file_size_mb' => 1024,
            ],
        };
    }

    /**
     * Validate if a video can be published to an account
     */
    public function validateVideoForAccount(SocialAccount $account, int $videoDurationSeconds, int $fileSizeMb): array
    {
        $capabilities = $this->getAccountCapabilities($account);
        $errors = [];
        $warnings = [];

        // Check video duration
        $durationLimit = $capabilities['video_duration_limit'] ?? 600;
        if ($videoDurationSeconds > $durationLimit) {
            $errors[] = [
                'type' => 'duration_exceeded',
                'message' => "Video duration ({$videoDurationSeconds}s) exceeds the limit of {$durationLimit}s for {$account->platform}",
                'limit' => $durationLimit,
                'actual' => $videoDurationSeconds,
            ];
        }

        // Check file size
        $sizeLimit = $capabilities['max_file_size_mb'] ?? 1024;
        if ($fileSizeMb > $sizeLimit) {
            $errors[] = [
                'type' => 'file_size_exceeded',
                'message' => "File size ({$fileSizeMb}MB) exceeds the limit of {$sizeLimit}MB for {$account->platform}",
                'limit' => $sizeLimit,
                'actual' => $fileSizeMb,
            ];
        }

        // Platform-specific warnings
        if ($account->platform === 'youtube' && !($capabilities['long_uploads_allowed'] ?? false)) {
            if ($videoDurationSeconds > 840) { // Close to 15 min limit
                $warnings[] = [
                    'type' => 'near_duration_limit',
                    'message' => 'Video is close to the 15-minute limit. Verify your YouTube channel to upload longer videos.',
                ];
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'capabilities' => $capabilities,
        ];
    }
}
