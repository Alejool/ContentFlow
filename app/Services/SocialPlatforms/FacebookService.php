<?php

namespace App\Services\SocialPlatforms;

use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;

class FacebookService extends BaseSocialService
{
  private const API_VERSION = 'v18.0';

  public function publishPost(array $data): array
  {
    $this->ensureValidToken();

    $accountId = 'me'; // In production, this should ideally be the Page ID if acting as a Page

    // 1. Handle Media (Video or Image)
    $rawPath = $data['media_url'] ?? $data['video_path'] ?? $data['image_path'] ?? null;

    if (!empty($rawPath)) {
      $resolvedUrl = $this->resolveUrl($rawPath);
      $mediaPath = $this->downloadMedia($resolvedUrl);
      $mimeType = mime_content_type($mediaPath);

      $isReel = false;
      if (isset($data['platform_settings']['facebook']['type'])) {
        $isReel = $data['platform_settings']['facebook']['type'] === 'reel';
      }

      try {
        if (str_contains($mimeType, 'video')) {
          // Video Upload
          // If explicit Reel or just video, use resumable.
          // For explicit Reels, we might want to ensure specific metadata (handled inside uploadVideoResumable if needed)
          $videoId = $this->uploadVideoResumable($accountId, $mediaPath, $data, $isReel);

          return [
            'success' => true,
            'post_id' => $videoId,
            'platform' => 'facebook',
            'url' => "https://facebook.com/{$videoId}",
            'status' => 'processing' // Videos often need processing
          ];
        } else {
          // Image Upload
          $photoId = $this->uploadPhoto($accountId, $mediaPath, $data['content'] ?? '');

          return [
            'success' => true,
            'post_id' => $photoId,
            'platform' => 'facebook',
            'url' => "https://facebook.com/{$photoId}",
            'status' => 'published'
          ];
        }
      } catch (\Exception $e) {
        Log::error('Facebook Upload Failed', ['error' => $e->getMessage()]);
        throw $e;
      } finally {
        if (file_exists($mediaPath)) unlink($mediaPath);
      }
    }

    // 2. Text Only Post
    return $this->publishTextPost($accountId, $data);
  }

  private function publishTextPost($accountId, $data)
  {
    $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$accountId}/feed";
    $formData = [
      'message' => $data['content'] ?? '',
      'access_token' => $this->accessToken,
    ];

    if (!empty($data['link'])) {
      $formData['link'] = $data['link'];
    }

    try {
      $response = $this->client->post($endpoint, ['form_params' => $formData]);
      $result = json_decode($response->getBody(), true);

      return [
        'success' => true,
        'post_id' => $result['id'],
        'platform' => 'facebook',
        'url' => "https://facebook.com/{$result['id']}",
        'status' => 'published'
      ];
    } catch (ClientException $e) {
      $this->handleApiError($e);
    }
  }

  private function uploadPhoto($accountId, $path, $caption)
  {
    $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$accountId}/photos";

    try {
      $response = $this->client->post($endpoint, [
        'query' => ['access_token' => $this->accessToken],
        'multipart' => [
          ['name' => 'source', 'contents' => fopen($path, 'r')],
          ['name' => 'message', 'contents' => $caption],
          ['name' => 'published', 'contents' => 'true'],
        ]
      ]);
      $result = json_decode($response->getBody(), true);
      return $result['post_id'] ?? $result['id'];
    } catch (ClientException $e) {
      $this->handleApiError($e);
    }
  }

  /**
   * Implements Facebook Resumable Upload Payload
   * Ref: https://developers.facebook.com/docs/graph-api/video-uploads
   */
  private function uploadVideoResumable($accountId, $path, $data, $isReel = false)
  {
    $fileSize = filesize($path);

    // Step 1: Start Upload Session
    // If it's a reel, we might need a specific endpoint or params, but often it's just a flagging on 'finish'
    // For strict Reels API, it's often /reels endpoint, but standard video upload + reel flag works for many cases.
    // Let's stick to standard video upload for now but allow future expansion.
    $response = $this->client->post("https://graph.facebook.com/" . self::API_VERSION . "/{$accountId}/videos", [
      'query' => [
        'access_token' => $this->accessToken,
        'upload_phase' => 'start',
        'file_size' => $fileSize
      ]
    ]);

    $startData = json_decode($response->getBody(), true);
    $uploadSessionId = $startData['upload_session_id'];
    $videoId = $startData['video_id'];
    $startOffset = (int) $startData['start_offset'];
    $endOffset = (int) $startData['end_offset'];

    // Step 2: Transfer Chunks
    $handle = fopen($path, 'r');

    while ($startOffset < $fileSize) {
      $chunkSize = $endOffset - $startOffset;
      fseek($handle, $startOffset);
      $chunkData = fread($handle, $chunkSize);

      $response = $this->client->post("https://graph.facebook.com/" . self::API_VERSION . "/{$accountId}/videos", [
        'query' => [
          'access_token' => $this->accessToken,
          'upload_phase' => 'transfer',
          'upload_session_id' => $uploadSessionId,
          // 'start_offset' => $startOffset // Actually FB determines this from the session, but we send the chunk
          'start_offset' => $startOffset
        ],
        'multipart' => [
          [
            'name' => 'video_file_chunk',
            'contents' => $chunkData,
            'filename' => 'chunk'
          ]
        ]
      ]);

      $transferData = json_decode($response->getBody(), true);
      $startOffset = (int) $transferData['start_offset'];
      $endOffset = (int) $transferData['end_offset'];
    }

    fclose($handle);

    // Step 3: Finish Upload
    $finishParams = [
      'access_token' => $this->accessToken,
      'upload_phase' => 'finish',
      'upload_session_id' => $uploadSessionId,
      'title' => $data['title'] ?? '',
      'description' => $data['content'] ?? '',
    ];

    $response = $this->client->post("https://graph.facebook.com/" . self::API_VERSION . "/{$accountId}/videos", [
      'form_params' => $finishParams
    ]);

    $finishData = json_decode($response->getBody(), true);

    if (!$finishData['success']) {
      throw new \Exception('Facebook video upload finish phase failed');
    }

    return $videoId;
  }

  public function checkVideoStatus(string $videoId): array
  {
    $this->ensureValidToken();

    try {
      $response = $this->client->get("https://graph.facebook.com/" . self::API_VERSION . "/{$videoId}", [
        'query' => [
          'access_token' => $this->accessToken,
          'fields' => 'status,published'
        ]
      ]);

      $data = json_decode($response->getBody(), true);
      $status = $data['status']['video_status'] ?? 'unknown'; // 'ready', 'processing', 'error'

      if ($status === 'ready' || $status === 'processed') {
        return ['exists' => true, 'status' => 'published', 'uploadStatus' => 'processed'];
      } elseif ($status === 'error') {
        return ['exists' => true, 'status' => 'failed', 'rejectionReason' => 'Facebook processing error'];
      }

      return ['exists' => true, 'status' => 'processing'];
    } catch (\Exception $e) {
      Log::error('Facebook status check failed', ['id' => $videoId, 'error' => $e->getMessage()]);
      return ['exists' => false, 'error' => $e->getMessage()];
    }
  }

  public function deletePost(string $postId): bool
  {
    $this->ensureValidToken();

    try {
      $this->client->delete("https://graph.facebook.com/" . self::API_VERSION . "/{$postId}", [
        'query' => ['access_token' => $this->accessToken]
      ]);
      return true;
    } catch (\Exception $e) {
      Log::error('Failed to delete Facebook post', ['id' => $postId, 'error' => $e->getMessage()]);
      return false;
    }
  }

  // --- Helpers ---

  private function resolveUrl(string $path): string
  {
    if (str_starts_with($path, 'http')) return $path;
    return \Illuminate\Support\Facades\Storage::disk('s3')->url($path);
  }

  private function downloadMedia(string $url): string
  {
    $tempFile = tempnam(sys_get_temp_dir(), 'fb_media_');
    // Simple download, considers ensuring headers if needed in future
    if (!copy($url, $tempFile)) {
      throw new \Exception("Failed to download media from URL: {$url}");
    }
    return $tempFile;
  }

  private function handleApiError(ClientException $e): void
  {
    $response = $e->hasResponse() ? json_decode($e->getResponse()->getBody(), true) : [];
    $message = $response['error']['message'] ?? $e->getMessage();
    Log::error('Facebook API Error', ['response' => $response]);
    throw new \Exception("Facebook API Error: {$message}");
  }

  private function ensureValidToken(): void
  {
    if ($this->socialAccount && $this->socialAccount->token_expires_at) {
      // Refresh if expiring in next 2 hours (Facebook tokens are often long-lived but need checking)
      if (now()->addHours(2)->gte($this->socialAccount->token_expires_at)) {
        $this->refreshToken();
      }
    }
  }

  private function refreshToken(): void
  {
    // Leverage existing token manager login or implement direct exchange
    // Facebook "Long-Lived" tokens (60 days) can be refreshed by exchanging them again

    try {
      // Using the exchange endpoint to refresh/extend
      $response = $this->client->get("https://graph.facebook.com/" . self::API_VERSION . "/oauth/access_token", [
        'query' => [
          'grant_type' => 'fb_exchange_token',
          'client_id' => config('services.facebook.client_id'),
          'client_secret' => config('services.facebook.client_secret'),
          'fb_exchange_token' => $this->accessToken
        ]
      ]);

      $data = json_decode($response->getBody(), true);

      if (isset($data['access_token'])) {
        $this->accessToken = $data['access_token'];
        $this->socialAccount->update([
          'access_token' => $data['access_token'],
          'token_expires_at' => isset($data['expires_in']) ? now()->addSeconds($data['expires_in']) : null,
        ]);
      }
    } catch (\Exception $e) {
      Log::warning('Facebook Token Refresh Failed', ['error' => $e->getMessage()]);
      // Don't throw immediately, maybe old token still works for a bit
    }
  }

  // Stub for interface
  public function getAccountInfo(): array
  {
    return [];
  }
  public function getPostAnalytics(string $postId): array
  {
    return [];
  }
  public function validateCredentials(): bool
  {
    return true;
  }
}
