<?php

namespace App\Services\SocialPlatforms;

class TikTokService extends BaseSocialService
{
  public function publishPost(array $data): array
  {
    // TikTok requires video upload in chunks
    // This is a simplified version - production would need chunked upload

    if (empty($data['video_url'])) {
      throw new \Exception('TikTok requires a video URL');
    }

    // Step 1: Initialize upload
    $initResponse = $this->client->post('https://open.tiktokapis.com/v2/post/publish/video/init/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json',
      ],
      'json' => [
        'post_info' => [
          'title' => $data['content'] ?? '',
          'privacy_level' => 'PUBLIC_TO_EVERYONE',
          'disable_duet' => false,
          'disable_comment' => false,
          'disable_stitch' => false,
          'video_cover_timestamp_ms' => 1000,
        ],
        'source_info' => [
          'source' => 'FILE_UPLOAD',
          'video_size' => $data['video_size'] ?? 0,
          'chunk_size' => 10000000, // 10MB chunks
          'total_chunk_count' => 1,
        ],
      ],
    ]);

    $initResult = json_decode($initResponse->getBody(), true);

    if (!isset($initResult['data']['publish_id'])) {
      throw new \Exception('Failed to initialize TikTok video upload');
    }

    $publishId = $initResult['data']['publish_id'];

    // Step 2: Upload video (simplified - would need actual file upload)
    // In production, you'd upload the video in chunks here

    // Step 3: Publish
    $publishResponse = $this->client->post('https://open.tiktokapis.com/v2/post/publish/status/fetch/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json',
      ],
      'json' => [
        'publish_id' => $publishId,
      ],
    ]);

    $publishResult = json_decode($publishResponse->getBody(), true);

    return [
      'success' => true,
      'post_id' => $publishId,
      'platform' => 'tiktok',
      'url' => $publishResult['data']['share_url'] ?? '',
    ];
  }

  public function getAccountInfo(): array
  {
    $response = $this->client->get('https://open.tiktokapis.com/v2/user/info/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'query' => [
        'fields' => 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count',
      ],
    ]);

    $data = json_decode($response->getBody(), true);

    return $data['data']['user'] ?? [];
  }

  public function getPostAnalytics(string $postId): array
  {
    // TikTok analytics require specific video ID
    $response = $this->client->post('https://open.tiktokapis.com/v2/research/video/query/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json',
      ],
      'json' => [
        'filters' => [
          'video_id' => $postId,
        ],
        'fields' => ['like_count', 'comment_count', 'share_count', 'view_count'],
      ],
    ]);

    $data = json_decode($response->getBody(), true);

    if (isset($data['data']['videos'][0])) {
      $video = $data['data']['videos'][0];

      return [
        'likes' => $video['like_count'] ?? 0,
        'comments' => $video['comment_count'] ?? 0,
        'shares' => $video['share_count'] ?? 0,
        'views' => $video['view_count'] ?? 0,
      ];
    }

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
      $this->client->get('https://open.tiktokapis.com/v2/user/info/', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'fields' => 'open_id',
        ],
      ]);
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }
}
