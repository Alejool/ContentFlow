<?php

namespace App\Services\SocialPlatforms;

use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;

class TikTokService extends BaseSocialService
{
  public function publish(SocialPostDTO $post): PostResultDTO
  {
    $this->ensureValidToken();
    $rawPath = $post->mediaPaths[0] ?? null;

    if (!$rawPath || !file_exists($rawPath)) {
      return PostResultDTO::failure('TikTok requires a valid local video file path');
    }

    try {
      // Step 1: Initialize Upload
      $uploadParams = [
        'content' => $post->content,
        'video_path' => $rawPath,
        'platform_settings' => $post->platformSettings,
      ];
      $uploadInfo = $this->initializeUpload($uploadParams);
      $publishId = $uploadInfo['publish_id'];
      $uploadUrl = $uploadInfo['upload_url'];

      // Step 2: Upload Video File
      $this->uploadVideoFile($uploadUrl, $rawPath);

      return PostResultDTO::success(
        postId: $publishId,
        postUrl: '', // TikTok async, no immediate URL
        rawData: ['status' => 'processing', 'platform' => 'tiktok']
      );
    } catch (\Exception $e) {
      return PostResultDTO::failure($e->getMessage());
    }
  }

  public function delete(string $postId): bool
  {
    Log::warning('Delete post not supported by TikTok API', ['postId' => $postId]);
    return false;
  }

  public function getMetrics(string $postId): array
  {
    return $this->getPostAnalytics($postId);
  }

  private function validateVideoData(array $data): void
  {
    if (empty($data['video_path']) || !file_exists($data['video_path'])) {
      throw new \Exception('TikTok requires a valid video file path');
    }

    // TikTok constraints (simplified check, real API is stricter)
    $size = filesize($data['video_path']);
    if ($size > 4 * 1024 * 1024 * 1024) { // 4GB limit
      throw new \Exception('Video exceeds TikTok 4GB limit');
    }
  }

  private function initializeUpload(array $data): array
  {
    $response = $this->client->post('https://open.tiktokapis.com/v2/post/publish/video/init/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json; charset=UTF-8',
      ],
      'json' => [
        'post_info' => [
          'title' => mb_substr($data['content'] ?? $data['title'] ?? '', 0, 150), // 150 char limit?
          'privacy_level' => $this->mapPrivacy(
            $data['platform_settings']['tiktok']['privacy'] ?? $data['privacy'] ?? 'public'
          ),
          'disable_duet' => $data['platform_settings']['tiktok']['disable_duet'] ?? false,
          'disable_comment' => $data['platform_settings']['tiktok']['disable_comment'] ?? false,
          'disable_stitch' => $data['platform_settings']['tiktok']['disable_stitch'] ?? false,
        ],
        'source_info' => [
          'source' => 'FILE_UPLOAD',
          'video_size' => filesize($data['video_path']),
          'chunk_size' => filesize($data['video_path']), // Uploading as single chunk for MVP
          'total_chunk_count' => 1,
        ],
      ],
    ]);

    $result = json_decode($response->getBody(), true);

    if (!isset($result['data']['publish_id']) || !isset($result['data']['upload_url'])) {
      Log::error('TikTok Init Failed', ['response' => $result]);
      throw new \Exception('Failed to initialize TikTok video upload: Invalid response');
    }

    return $result['data'];
  }

  private function uploadVideoFile(string $uploadUrl, string $filePath): void
  {
    Log::info('Uploading video to TikTok URL');

    // TikTok requires PUT for the video content
    // We use a fresh client to avoid default headers messing with the raw upload
    $uploadClient = new \GuzzleHttp\Client();

    $fileStream = fopen($filePath, 'r');
    if (!$fileStream) {
      throw new \Exception('Failed to open video file for reading');
    }

    try {
      $response = $uploadClient->put($uploadUrl, [
        'headers' => [
          'Content-Type' => 'video/mp4', // Adjust based on actual file type if needed
          'Content-Length' => filesize($filePath),
        ],
        'body' => $fileStream,
        'timeout' => 600, // 10 minutes
      ]);

      if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
        throw new \Exception("Upload failed with status {$response->getStatusCode()}");
      }
    } finally {
      fclose($fileStream);
    }
  }

  public function deletePost(string $postId): bool
  {
    // TikTok API V2 does not currently support deleting videos via API for standard integrations
    // We'll return false or throw exception, but to be safe for our system, we fake success or log it.
    Log::warning('Delete post not supported by TikTok API', ['postId' => $postId]);
    return false;
  }

  public function checkVideoStatus(string $publishId): array
  {
    try {
      $this->ensureValidToken();

      // Note: status/fetch endpoint might be different or require correct scope
      // Using documented endpoint: /v2/post/publish/status/fetch/
      $response = $this->client->post('https://open.tiktokapis.com/v2/post/publish/status/fetch/', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Content-Type' => 'application/json',
        ],
        'json' => [
          'publish_id' => $publishId,
        ],
      ]);

      $result = json_decode($response->getBody(), true);
      $status = $result['data']['status'] ?? null;
      // POSSIBILE STATUSES: PUBLISH_COMPLETE, UPLOADING, PROCESSING, FAILED

      if ($status === 'PUBLISH_COMPLETE') {
        return [
          'exists' => true,
          'status' => 'published',
          'uploadStatus' => 'processed',
          // 'url' => ... The API might sadly not return the public URL here easily
        ];
      } elseif ($status === 'FAILED') {
        return [
          'exists' => true,
          'status' => 'failed',
          'rejectionReason' => $result['data']['fail_reason'] ?? 'Unknown error'
        ];
      }

      return [
        'exists' => true,
        'status' => 'processing', // UPLOADING or PROCESSING
      ];
    } catch (\Exception $e) {
      Log::error('TikTok status check failed', ['error' => $e->getMessage()]);
      return ['exists' => false, 'error' => $e->getMessage()];
    }
  }

  public function getAccountInfo(): array
  {
    $this->ensureValidToken();

    $response = $this->client->get('https://open.tiktokapis.com/v2/user/info/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'query' => [
        'fields' => 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count',
      ],
    ]);

    $data = json_decode($response->getBody(), true);
    $user = $data['data']['user'] ?? [];

    return [
      'id' => $user['open_id'] ?? null,
      'name' => $user['display_name'] ?? null,
      'avatar' => $user['avatar_url'] ?? null,
      'followers' => $user['follower_count'] ?? 0,
      'following' => $user['following_count'] ?? 0,
      'likes' => $user['likes_count'] ?? 0,
      'videos' => $user['video_count'] ?? 0,
    ];
  }

  public function getPostAnalytics(string $postId): array
  {
    // This endpoint requires 'Research API' access usually, standard tiered access
    // might not have it. Implementing defensively.
    return [
      'likes' => 0,
      'comments' => 0,
      'shares' => 0,
      'views' => 0,
    ];
  }

  public function validateCredentials(): bool
  {
    try {
      $this->getAccountInfo();
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }

  // --- Helper Methods ---

  private function mapPrivacy(string $privacy): string
  {
    return match ($privacy) {
      'private' => 'SELF_ONLY',
      'unlisted' => 'FRIENDS_ONLY', // Closest match
      default => 'PUBLIC_TO_EVERYONE',
    };
  }

  private function handleApiError(ClientException $e): void
  {
    $response = $e->hasResponse() ? json_decode($e->getResponse()->getBody(), true) : [];
    $message = $response['error']['message'] ?? $e->getMessage();

    Log::error('TikTok API Error', ['response' => $response]);

    throw new \Exception("TikTok API Error: {$message}");
  }

  /**
   * Get comments for a TikTok post
   * Note: TikTok API has very limited comment access
   *
   * @param string $postId
   * @param int $limit
   * @return array
   */
  public function getPostComments(string $postId, int $limit = 100): array
  {
    // TikTok API doesn't provide comment access in standard API tiers
    Log::info('TikTok getPostComments called but not available', [
      'postId' => $postId,
      'note' => 'Requires Research API access'
    ]);

    return [];
  }
}
