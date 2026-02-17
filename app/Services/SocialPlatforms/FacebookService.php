<?php

namespace App\Services\SocialPlatforms;

use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;

class FacebookService extends BaseSocialService
{
  private const API_VERSION = 'v24.0';

  public function publish(SocialPostDTO $post): PostResultDTO
  {
    $this->ensureValidToken();
    $pageId = $this->socialAccount->account_id;
    $content = $post->content;

    $mediaFiles = $post->mediaPaths;
    $link = $post->metadata['link'] ?? null;
    $rawPath = $post->mediaPaths[0] ?? null;

    try {
      if (!empty($rawPath)) {
        $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');

        if ($isVideo) {
          $postId = $this->uploadVideo($pageId, $rawPath, $content, $post->title);
        } else {
          $postId = $this->uploadPhoto($pageId, $rawPath, $content);
        }
      } else {
        $postId = $this->publishTextPost($pageId, $content, $link);
      }

      return PostResultDTO::success(
        postId: $postId,
        postUrl: "https://facebook.com/{$postId}",
        rawData: ['platform' => 'facebook']
      );
    } catch (\Exception $e) {
      return PostResultDTO::failure($e->getMessage(), ['trace' => $e->getTraceAsString()]);
    }
  }

  public function delete(string $postId): bool
  {
    $this->ensureValidToken();
    try {
      $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$postId}";
      $response = $this->client->delete($endpoint, [
        'query' => ['access_token' => $this->accessToken]
      ]);
      $result = json_decode($response->getBody(), true);
      return $result['success'] ?? false;
    } catch (\Exception $e) {
      if (str_contains($e->getMessage(), '404') || str_contains($e->getMessage(), 'not found')) {
        return true;
      }
      return false;
    }
  }

  public function getMetrics(string $postId): array
  {
    return $this->getPostAnalytics($postId);
  }

  private function publishTextPost($pageId, $content, $link = null)
  {
    $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$pageId}/feed";
    $params = [
      'message' => $content,
      'access_token' => $this->accessToken,
    ];
    if ($link) {
      $params['link'] = $link;
    }

    $response = $this->client->post($endpoint, ['form_params' => $params]);
    $result = json_decode($response->getBody(), true);

    if (!isset($result['id'])) {
      throw new \Exception("Failed to get Post ID from Facebook text post");
    }

    return $result['id'];
  }

  private function uploadPhoto($pageId, $photoUrl, $caption)
  {
    $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$pageId}/photos";

    $params = [
      'url' => $photoUrl,
      'message' => $caption,
      'access_token' => $this->accessToken,
    ];

    $response = $this->client->post($endpoint, ['form_params' => $params]);
    $result = json_decode($response->getBody(), true);

    // Photos usually return a 'post_id' if they are published as part of a post
    return $result['post_id'] ?? $result['id'] ?? null;
  }

  private function uploadVideo($pageId, $videoUrl, $description, $title = null)
  {
    $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$pageId}/videos";

    // Facebook can upload videos from URL too
    $params = [
      'file_url' => $videoUrl,
      'description' => $description,
      'access_token' => $this->accessToken,
    ];

    if ($title) {
      $params['title'] = $title;
    }

    Log::info('Facebook uploadVideo params', [
      'pageId' => $pageId,
      'description_present' => !empty($description),
      'description_length' => strlen($description),
      'title_present' => !empty($title),
      'videoUrl' => $videoUrl
    ]);

    try {
      // Use extended timeout for video uploads (5 minutes)
      $response = $this->client->post($endpoint, [
        'form_params' => $params,
        'timeout' => 300,
        'connect_timeout' => 30
      ]);
      $result = json_decode($response->getBody(), true);

      if (!isset($result['id'])) {
        throw new \Exception("Failed to get Video ID from Facebook: " . json_encode($result));
      }

      return $result['id'];
    } catch (\Exception $e) {
      // Log the full error for debugging
      Log::error('Facebook video upload failed', [
        'error' => $e->getMessage(),
        'pageId' => $pageId,
        'videoUrl' => $videoUrl
      ]);
      throw $e;
    }
  }

  /**
   * Deletes a post from Facebook.
   */
  public function deletePost(string $postId): bool
  {
    try {
      $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$postId}";
      $response = $this->client->delete($endpoint, [
        'query' => ['access_token' => $this->accessToken]
      ]);
      $result = json_decode($response->getBody(), true);

      return $result['success'] ?? false;
    } catch (\Exception $e) {
      if (str_contains($e->getMessage(), '404') || str_contains($e->getMessage(), 'not found')) {
        return true;
      }
      return false;
    }
  }

  /**
   * Gets performance analytics for a specific post.
   */
  public function getPostAnalytics(string $postId): array
  {
    if (empty($postId)) return [];

    try {
      $metrics = [
        'post_impressions_unique',
        'post_engaged_users',
        'post_reactions_by_type_total',
      ];

      $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$postId}/insights";
      $response = $this->client->get($endpoint, [
        'query' => [
          'metric' => implode(',', $metrics),
          'access_token' => $this->accessToken
        ]
      ]);

      $data = json_decode($response->getBody(), true);

      $results = [
        'reach' => 0,
        'engagement' => 0,
        'reactions' => 0
      ];

      if (isset($data['data'])) {
        foreach ($data['data'] as $metric) {
          $value = $metric['values'][0]['value'] ?? 0;
          switch ($metric['name']) {
            case 'post_impressions_unique':
              $results['reach'] = $value;
              break;
            case 'post_engaged_users':
              $results['engagement'] = $value;
              break;
            case 'post_reactions_by_type_total':
              $results['reactions'] = is_array($value) ? array_sum($value) : $value;
              break;
          }
        }
      }

      return $results;
    } catch (\Exception $e) {
      Log::error('Facebook analytics failed', ['postId' => $postId, 'error' => $e->getMessage()]);
      return [];
    }
  }

  public function getAccountInfo(): array
  {
    try {
      $response = $this->client->get("https://graph.facebook.com/" . self::API_VERSION . "/me", [
        'query' => [
          'fields' => 'id,name,picture',
          'access_token' => $this->accessToken
        ]
      ]);
      return json_decode($response->getBody(), true);
    } catch (\Exception $e) {
      Log::error('Facebook getAccountInfo failed', ['error' => $e->getMessage()]);
      return [];
    }
  }

  public function validateCredentials(): bool
  {
    try {
      $info = $this->getAccountInfo();
      return !empty($info) && isset($info['id']);
    } catch (\Exception $e) {
      return false;
    }
  }

  protected function handleApiError(ClientException $e)
  {
    $response = $e->getResponse();
    $body = json_decode($response->getBody(), true);

    $message = $body['error']['message'] ?? 'Unknown Facebook API Error';
    Log::error('Facebook API Error', ['response' => $body]);

    throw new \Exception("Facebook API Error: " . $message);
  }

  /**
   * Get comments for a Facebook post
   *
   * @param string $postId
   * @param int $limit
   * @return array
   */
  public function getPostComments(string $postId, int $limit = 100): array
  {
    if (empty($postId)) {
      return [];
    }

    try {
      $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$postId}/comments";
      $response = $this->client->get($endpoint, [
        'query' => [
          'access_token' => $this->accessToken,
          'limit' => $limit,
          'fields' => 'id,from,message,created_time'
        ]
      ]);

      $data = json_decode($response->getBody(), true);
      $comments = $data['data'] ?? [];

      return $this->normalizeComments($comments);
    } catch (\Exception $e) {
      Log::error('Facebook getPostComments failed', [
        'postId' => $postId,
        'error' => $e->getMessage()
      ]);
      return [];
    }
  }

  /**
   * Normalize Facebook comments to standard format
   *
   * @param array $comments
   * @return array
   */
  protected function normalizeComments(array $comments): array
  {
    return array_map(function ($comment) {
      return [
        'id' => $comment['id'] ?? '',
        'author' => $comment['from']['name'] ?? 'Unknown',
        'text' => $comment['message'] ?? '',
        'created_at' => $comment['created_time'] ?? now()->toIso8601String()
      ];
    }, $comments);
  }
}
