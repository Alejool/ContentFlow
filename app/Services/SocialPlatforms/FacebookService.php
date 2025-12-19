<?php

namespace App\Services\SocialPlatforms;

use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;

class FacebookService extends BaseSocialService
{
  private const API_VERSION = 'v24.0';

  /**
   * Publishes a post to a Facebook Page.
   * $this->accessToken should be a Page Access Token.
   * $this->socialAccount->account_id should be the Page ID.
   */
  public function publishPost(array $data): array
  {
    $pageId = $this->socialAccount->account_id;
    $content = $data['content'] ?? $data['caption'] ?? $data['message'] ?? $data['body'] ?? $data['description'] ?? '';

    // If everything above is empty, manually build from parts
    if (empty($content)) {
      $parts = [];
      if (!empty($data['title'])) $parts[] = $data['title'];
      if (!empty($data['description'])) $parts[] = $data['description'];
      if (!empty($data['hashtags'])) $parts[] = $data['hashtags'];
      $content = implode("\n\n", $parts);
    }

    // If hashtags are passed separately and not yet in caption, append them
    if (isset($data['hashtags']) && !empty($data['hashtags']) && !empty($content) && !str_contains($content, $data['hashtags'])) {
      $content .= "\n\n" . $data['hashtags'];
    }

    $mediaFiles = $data['media_files'] ?? [];
    $link = $data['link'] ?? $data['url'] ?? null;
    $rawPath = $data['video_path'] ?? $data['image_path'] ?? null;

    if (!$rawPath && !empty($mediaFiles)) {
      $rawPath = $mediaFiles[0]['file_path'] ?? null;
    }

    try {

      if (!empty($rawPath)) {
        $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');
        // Check mime type
        if (isset($mediaFiles[0]['mime_type'])) {
          $isVideo = str_contains($mediaFiles[0]['mime_type'], 'video');
        }

        if ($isVideo) {
          $postId = $this->uploadVideo($pageId, $rawPath, $content, $data['title'] ?? null);
        } else {
          $postId = $this->uploadPhoto($pageId, $rawPath, $content);
        }
      } else {
        $postId = $this->publishTextPost($pageId, $content, $link);
      }

      return [
        'success' => true,
        'post_id' => $postId,
        'platform' => 'facebook',
        'url' => "https://facebook.com/{$postId}",
        'status' => 'published'
      ];
    } catch (\Exception $e) {
      throw $e;
    }
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

    $response = $this->client->post($endpoint, ['form_params' => $params]);
    $result = json_decode($response->getBody(), true);

    if (!isset($result['id'])) {
      throw new \Exception("Failed to get Video ID from Facebook: " . json_encode($result));
    }

    return $result['id'];
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
}
