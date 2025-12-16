<?php

namespace App\Services\SocialPlatforms;

use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;

class FacebookService extends BaseSocialService
{
  private function formatAnalytics(array $data): array
  {
    // Basic implementation to satisfy the call
    return $data;
  }

  public function publishPost(array $data): array
  {
    $accountId = 'me'; // Use 'me' if token is Page Token, or ID if we have it. 'me' is safest with Page Token.

    // 1. Manejar Media
    $rawPath = $data['media_url'] ?? $data['video_path'] ?? $data['image_path'] ?? null;
    $mediaId = null;

    if (!empty($rawPath)) {
      $resolvedUrl = $this->resolveUrl($rawPath);
      $mediaPath = $this->downloadMedia($resolvedUrl);
      $mimeType = mime_content_type($mediaPath);

      try {
        if (str_contains($mimeType, 'video')) {
          // Video Upload
          $mediaId = $this->uploadVideo($accountId, $mediaPath, $data['title'] ?? '', $data['content'] ?? '');
          // Note: uploadVideo returns the Post ID usually for non-resumable, or Media ID.
          // For /videos endpoint, the response IS the post id if published immediately.

          return [
            'success' => true,
            'post_id' => $mediaId,
            'platform' => 'facebook',
            'url' => "https://facebook.com/{$mediaId}",
          ];
        } else {
          // Image Upload
          // We upload as "published: false" first if we want to attach to a feed post, OR just publish directly.
          // Simpler: Publish directly to /photos edge with a message.
          $mediaId = $this->uploadPhoto($accountId, $mediaPath, $data['content'] ?? '');

          return [
            'success' => true,
            'post_id' => $mediaId,
            'platform' => 'facebook',
            'url' => "https://facebook.com/{$mediaId}",
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
    $endpoint = "https://graph.facebook.com/v18.0/{$accountId}/feed";
    $formData = [
      'message' => $data['content'],
      'access_token' => $this->accessToken,
    ];
    if (!empty($data['link'])) $formData['link'] = $data['link'];

    try {
      $response = $this->client->post($endpoint, ['form_params' => $formData]);
      $result = json_decode($response->getBody(), true);

      return [
        'success' => true,
        'post_id' => $result['id'],
        'platform' => 'facebook',
        'url' => "https://facebook.com/{$result['id']}",
      ];
    } catch (ClientException $e) {
      $this->logError($e, 'Facebook Text Post Failed');
      throw new \Exception("Facebook Post Failed: " . $e->getMessage());
    }
  }

  private function uploadPhoto($accountId, $path, $caption)
  {
    $endpoint = "https://graph.facebook.com/v18.0/{$accountId}/photos";

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
      $this->logError($e, 'Facebook Photo Upload Failed');
      throw new \Exception("Facebook Photo Upload Failed: " . $e->getMessage());
    }
  }

  private function uploadVideo($accountId, $path, $title, $description)
  {
    $endpoint = "https://graph.facebook.com/v18.0/{$accountId}/videos";

    try {
      // Direct Standard Upload (Good for < 1GB)
      $response = $this->client->post($endpoint, [
        'query' => ['access_token' => $this->accessToken],
        'multipart' => [
          ['name' => 'source', 'contents' => fopen($path, 'r')],
          ['name' => 'description', 'contents' => $description],
          ['name' => 'title', 'contents' => $title],
        ],
        'timeout' => 300, // 5 mins
      ]);
      $result = json_decode($response->getBody(), true);
      return $result['id']; // Video ID (which acts as Post ID for videos)
    } catch (ClientException $e) {
      $this->logError($e, 'Facebook Video Upload Failed');
      throw new \Exception("Facebook Video Upload Failed: " . $e->getMessage());
    }
  }

  // Helpers
  private function resolveUrl(string $path): string
  {
    if (str_starts_with($path, 'http')) return $path;
    return \Illuminate\Support\Facades\Storage::disk('s3')->url($path);
  }

  private function downloadMedia(string $url): string
  {
    $tempFile = tempnam(sys_get_temp_dir(), 'fb_media_');
    file_put_contents($tempFile, fopen($url, 'r'));
    return $tempFile;
  }

  private function logError(ClientException $e, $context)
  {
    $response = $e->getResponse();
    $body = $response ? (string) $response->getBody() : '';
    Log::error($context, [
      'error' => $e->getMessage(),
      'response' => $body
    ]);
    // Re-throw with details? Or let caller handle.
    // The calling methods re-throw simplified message, but log has details.
  }

  // Keep existing methods
  public function getAccountInfo(): array
  {
    $response = $this->client->get('https://graph.facebook.com/v18.0/me', [
      'query' => [
        'access_token' => $this->accessToken,
        'fields' => 'id,name,picture,accounts{id,name,access_token,picture}',
      ]
    ]);
    return json_decode($response->getBody(), true);
  }

  public function getPostAnalytics(string $postId): array
  {
    try {
      $response = $this->client->get("https://graph.facebook.com/v18.0/{$postId}/insights", [
        'query' => [
          'access_token' => $this->accessToken,
          'metric' => 'post_impressions,post_engaged_users,post_reactions_by_type_total',
          'period' => 'lifetime',
        ]
      ]);
      return $this->formatAnalytics(json_decode($response->getBody(), true));
    } catch (\Exception $e) {
      return [];
    }
  }

  public function validateCredentials(): bool
  {
    try {
      $this->client->get('https://graph.facebook.com/v18.0/me', [
        'query' => ['access_token' => $this->accessToken]
      ]);
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }
}
