<?php

namespace App\Services\SocialPlatforms;

class TwitterService extends BaseSocialService
{
  public function publishPost(array $data): array
  {
    $tweetData = [
      'text' => $data['content'],
    ];

    // Add media if provided
    if (!empty($data['media_ids'])) {
      $tweetData['media'] = [
        'media_ids' => $data['media_ids'],
      ];
    }

    $response = $this->client->post('https://api.twitter.com/2/tweets', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json',
      ],
      'json' => $tweetData,
    ]);

    $result = json_decode($response->getBody(), true);

    return [
      'success' => true,
      'post_id' => $result['data']['id'],
      'platform' => 'twitter',
      'url' => "https://twitter.com/i/web/status/{$result['data']['id']}",
    ];
  }

  public function uploadMedia(string $mediaPath): string
  {
    // Twitter requires media upload to v1.1 endpoint
    $response = $this->client->post('https://upload.twitter.com/1.1/media/upload.json', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'multipart' => [
        [
          'name' => 'media',
          'contents' => fopen($mediaPath, 'r'),
        ],
      ],
    ]);

    $result = json_decode($response->getBody(), true);

    return $result['media_id_string'];
  }

  public function getAccountInfo(): array
  {
    $response = $this->client->get('https://api.twitter.com/2/users/me', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'query' => [
        'user.fields' => 'id,name,username,public_metrics,profile_image_url',
      ],
    ]);

    return json_decode($response->getBody(), true)['data'];
  }

  public function getPostAnalytics(string $postId): array
  {
    // Get tweet metrics
    $response = $this->client->get("https://api.twitter.com/2/tweets/{$postId}", [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'query' => [
        'tweet.fields' => 'public_metrics',
      ],
    ]);

    $data = json_decode($response->getBody(), true);

    if (isset($data['data']['public_metrics'])) {
      $metrics = $data['data']['public_metrics'];

      return [
        'likes' => $metrics['like_count'] ?? 0,
        'retweets' => $metrics['retweet_count'] ?? 0,
        'replies' => $metrics['reply_count'] ?? 0,
        'quotes' => $metrics['quote_count'] ?? 0,
        'impressions' => $metrics['impression_count'] ?? 0,
      ];
    }

    return [
      'likes' => 0,
      'retweets' => 0,
      'replies' => 0,
      'quotes' => 0,
      'impressions' => 0,
    ];
  }

  public function validateCredentials(): bool
  {
    try {
      $this->client->get('https://api.twitter.com/2/users/me', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
      ]);
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }
}
