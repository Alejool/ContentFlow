<?php

namespace App\Services\SocialPlatforms;

class InstagramService extends BaseSocialService
{
  public function publishPost(array $data): array
  {
    // Instagram requires creating a media container first, then publishing it
    $accountId = $data['account_id'] ?? null;

    if (!$accountId) {
      throw new \Exception('Instagram account ID is required');
    }

    // Step 1: Create media container
    $containerEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media";

    $containerData = [
      'caption' => $data['content'],
      'access_token' => $this->accessToken,
    ];

    // Handle media type
    if (!empty($data['media_url'])) {
      if ($data['media_type'] === 'video') {
        $containerData['media_type'] = 'VIDEO';
        $containerData['video_url'] = $data['media_url'];
      } else {
        $containerData['image_url'] = $data['media_url'];
      }
    }

    $containerResponse = $this->client->post($containerEndpoint, [
      'form_params' => $containerData,
    ]);

    $containerResult = json_decode($containerResponse->getBody(), true);

    if (!isset($containerResult['id'])) {
      throw new \Exception('Failed to create Instagram media container');
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

    return [
      'success' => true,
      'post_id' => $publishResult['id'],
      'platform' => 'instagram',
      'url' => "https://www.instagram.com/p/{$publishResult['id']}",
    ];
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
}
