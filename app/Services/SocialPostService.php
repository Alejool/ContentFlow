<?php

namespace App\Services;

use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use App\Services\SocialPlatforms\FacebookService;
use App\Services\SocialPlatforms\InstagramService;
use App\Services\SocialPlatforms\TwitterService;
use App\Services\SocialPlatforms\TikTokService;
use App\Services\SocialPlatforms\YouTubeService;
use Illuminate\Support\Facades\Log;

class SocialPostService
{
  protected $tokenManager;

  public function __construct(SocialTokenManager $tokenManager)
  {
    $this->tokenManager = $tokenManager;
  }

  /**
   * Publish content to a single social media platform
   */
  public function publishToSingle(int $accountId, string $content, array $media = [], array $options = []): array
  {
    $account = SocialAccount::findOrFail($accountId);

    if (!$account->is_active) {
      throw new \Exception("Account is inactive. Please reconnect.");
    }

    try {
      // Get valid token
      $token = $this->tokenManager->getValidToken($account);

      // Get platform service
      $service = $this->getPlatformService($account->platform, $token);

      // Prepare post data
      $postData = array_merge([
        'content' => $content,
        'account_id' => $account->account_id,
      ], $media, $options);

      // Publish post
      Log::info('Uploading data 6------', ['postData' => $postData]);
      $result = $service->publishPost($postData);

      // Log successful post
      $this->logPost($account, $content, $media, $result, 'published');

      // Mark account as active
      $account->markAsActive();

      return $result;
    } catch (\Exception $e) {
      Log::error("Failed to publish to {$account->platform}: " . $e->getMessage());

      // Log failed post
      $this->logPost($account, $content, $media, [], 'failed', $e->getMessage());

      // Mark account as inactive
      $account->markAsInactive($e->getMessage());

      throw $e;
    }
  }

  /**
   * Publish content to multiple platforms simultaneously
   */
  public function publishToMultiple(array $accountIds, string $content, array $media = [], array $options = []): array
  {
    $results = [];
    $errors = [];

    foreach ($accountIds as $accountId) {
      try {
        $results[$accountId] = $this->publishToSingle($accountId, $content, $media, $options);
      } catch (\Exception $e) {
        $errors[$accountId] = $e->getMessage();
      }
    }

    return [
      'success' => count($results),
      'failed' => count($errors),
      'results' => $results,
      'errors' => $errors,
    ];
  }

  /**
   * Publish content to all connected accounts for a user
   */
  public function publishToAll(int $userId, string $content, array $media = [], array $options = []): array
  {
    $accounts = SocialAccount::where('user_id', $userId)
      ->where('is_active', true)
      ->pluck('id')
      ->toArray();

    if (empty($accounts)) {
      throw new \Exception("No active social media accounts found.");
    }

    return $this->publishToMultiple($accounts, $content, $media, $options);
  }

  /**
   * Get the appropriate platform service
   */
  public function getPlatformService(string $platform, string $token)
  {
    return match ($platform) {
      'facebook' => new FacebookService($token),
      'instagram' => new InstagramService($token),
      'twitter' => new TwitterService($token),
      'tiktok' => new TikTokService($token),
      'youtube' => new YouTubeService($token),
      default => throw new \Exception("Unsupported platform: {$platform}"),
    };
  }

  /**
   * Log post to database
   */
  protected function logPost(
    SocialAccount $account,
    string $content,
    array $media,
    array $result,
    string $status,
    ?string $errorMessage = null
  ): void {
    SocialPostLog::create([
      'user_id' => $account->user_id,
      'workspace_id' => $account->workspace_id,
      'social_account_id' => $account->id,
      'platform' => $account->platform,
      'platform_post_id' => $result['post_id'] ?? null,
      'content' => $content,
      'media_urls' => $media['media_url'] ?? null ? [$media['media_url']] : [],
      'published_at' => $status === 'published' ? now() : null,
      'status' => $status,
      'error_message' => $errorMessage,
    ]);
  }

  /**
   * Upload media to a platform
   */
  public function uploadMedia(int $accountId, string $mediaPath, string $mediaType = 'image'): array
  {
    $account = SocialAccount::findOrFail($accountId);
    $token = $this->tokenManager->getValidToken($account);
    $service = $this->getPlatformService($account->platform, $token);

    // Platform-specific media upload
    if (method_exists($service, 'uploadMedia')) {
      return [
        'media_id' => $service->uploadMedia($mediaPath),
        'media_type' => $mediaType,
      ];
    }

    // For platforms that don't require separate upload, return the path
    return [
      'media_url' => $mediaPath,
      'media_type' => $mediaType,
    ];
  }
}
