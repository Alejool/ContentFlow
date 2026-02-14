<?php

namespace App\Services\SocialPlatforms;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;

class InstagramService extends BaseSocialService
{
  public function publish(SocialPostDTO $post): PostResultDTO
  {
    $this->ensureValidToken();
    $accountId = $this->socialAccount->account_id;

    if (!$accountId) {
      return PostResultDTO::failure('Instagram account ID is required');
    }

    try {
      // Step 1: Create media container
      $containerEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media";
      $containerData = [
        'caption' => $post->content,
        'access_token' => $this->accessToken,
      ];

      $rawPath = $post->mediaPaths[0] ?? null;
      if ($rawPath) {
        $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');
        if ($isVideo) {
          $instagramType = $post->platformSettings['instagram']['type'] ?? 'reel';
          $containerData['media_type'] = (strtolower($instagramType) === 'reel') ? 'REELS' : 'VIDEO';
          $containerData['video_url'] = $rawPath;
        } else {
          $containerData['image_url'] = $rawPath;
        }
      }

      $containerResponse = $this->client->post($containerEndpoint, ['form_params' => $containerData]);
      $containerResult = json_decode($containerResponse->getBody(), true);

      if (!isset($containerResult['id'])) {
        return PostResultDTO::failure('Failed to create Instagram media container');
      }

      // Step 2: Publish the container
      $publishEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media_publish";
      $publishResponse = $this->client->post($publishEndpoint, [
        'form_params' => [
          'creation_id' => $containerResult['id'],
          'access_token' => $this->accessToken,
        ],
      ]);

      $publishResult = json_decode($publishResponse->getBody(), true);
      $postId = $publishResult['id'];

      return PostResultDTO::success(
        postId: $postId,
        postUrl: "https://www.instagram.com/p/{$postId}",
        rawData: ['platform' => 'instagram']
      );
    } catch (\Exception $e) {
      return PostResultDTO::failure($e->getMessage());
    }
  }

  public function delete(string $postId): bool
  {
    // Instagram Graph API doesn't support deleting media via API easily for all app types
    return false;
  }

  public function getMetrics(string $postId): array
  {
    return $this->getPostAnalytics($postId);
  }

  public function getAccountInfo(): array
  {
    $response = $this->client->get('https://graph.instagram.com/me', [
      'query' => [
        'access_token' => $this->accessToken,
        'fields' => 'id,username,account_type,media_count',
      ]
    ]);

    return json_decode($response->getBody(), true);
  }

  public function getPostAnalytics(string $postId): array
  {
    $response = $this->client->get("https://graph.facebook.com/v18.0/{$postId}/insights", [
      'query' => [
        'access_token' => $this->accessToken,
        'metric' => 'impressions,reach,engagement,saved,video_views',
      ]
    ]);

    $data = json_decode($response->getBody(), true);

    return $this->formatAnalytics($data);
  }

  public function validateCredentials(): bool
  {
    try {
      $this->client->get('https://graph.instagram.com/me', [
        'query' => [
          'access_token' => $this->accessToken,
          'fields' => 'id',
        ]
      ]);
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }

  private function formatAnalytics(array $data): array
  {
    $metrics = [
      'impressions' => 0,
      'reach' => 0,
      'engagement' => 0,
      'saved' => 0,
      'video_views' => 0,
    ];

    if (isset($data['data'])) {
      foreach ($data['data'] as $metric) {
        $name = $metric['name'];
        $value = $metric['values'][0]['value'] ?? 0;
        $metrics[$name] = $value;
      }
    }

    return $metrics;
  }

  /**
   * Get comments for an Instagram post
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
      $endpoint = "https://graph.facebook.com/v18.0/{$postId}/comments";
      $response = $this->client->get($endpoint, [
        'query' => [
          'access_token' => $this->accessToken,
          'limit' => $limit,
          'fields' => 'id,username,text,timestamp'
        ]
      ]);

      $data = json_decode($response->getBody(), true);
      $comments = $data['data'] ?? [];

      return array_map(function ($comment) {
        return [
          'id' => $comment['id'] ?? '',
          'author' => $comment['username'] ?? 'Unknown',
          'text' => $comment['text'] ?? '',
          'created_at' => $comment['timestamp'] ?? now()->toIso8601String()
        ];
      }, $comments);
    } catch (\Exception $e) {
      return [];
    }
  }
}
