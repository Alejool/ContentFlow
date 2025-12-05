<?php

namespace App\Services\SocialPlatforms;

class YouTubeService extends BaseSocialService
{
  public function publishPost(array $data): array
  {
    // YouTube requires video upload with metadata
    if (empty($data['video_path'])) {
      throw new \Exception('YouTube requires a video file');
    }

    // Step 1: Insert video metadata
    $metadata = [
      'snippet' => [
        'title' => $data['title'] ?? 'Untitled Video',
        'description' => $data['content'] ?? '',
        'tags' => $data['tags'] ?? [],
        'categoryId' => '22', // People & Blogs
      ],
      'status' => [
        'privacyStatus' => $data['privacy'] ?? 'public',
        'selfDeclaredMadeForKids' => false,
      ],
    ];

    // Step 2: Upload video (simplified - production would use resumable upload)
    $response = $this->client->post('https://www.googleapis.com/upload/youtube/v3/videos', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json',
      ],
      'query' => [
        'part' => 'snippet,status',
        'uploadType' => 'multipart',
      ],
      'json' => $metadata,
    ]);

    $result = json_decode($response->getBody(), true);

    return [
      'success' => true,
      'post_id' => $result['id'],
      'platform' => 'youtube',
      'url' => "https://www.youtube.com/watch?v={$result['id']}",
    ];
  }

  public function getAccountInfo(): array
  {
    $response = $this->client->get('https://www.googleapis.com/youtube/v3/channels', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'query' => [
        'part' => 'snippet,statistics,contentDetails',
        'mine' => 'true',
      ],
    ]);

    $data = json_decode($response->getBody(), true);

    if (isset($data['items'][0])) {
      $channel = $data['items'][0];

      return [
        'id' => $channel['id'],
        'title' => $channel['snippet']['title'],
        'description' => $channel['snippet']['description'],
        'subscribers' => $channel['statistics']['subscriberCount'] ?? 0,
        'video_count' => $channel['statistics']['videoCount'] ?? 0,
        'view_count' => $channel['statistics']['viewCount'] ?? 0,
      ];
    }

    return [];
  }

  public function getPostAnalytics(string $postId): array
  {
    $response = $this->client->get('https://www.googleapis.com/youtube/v3/videos', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'query' => [
        'part' => 'statistics',
        'id' => $postId,
      ],
    ]);

    $data = json_decode($response->getBody(), true);

    if (isset($data['items'][0]['statistics'])) {
      $stats = $data['items'][0]['statistics'];

      return [
        'views' => $stats['viewCount'] ?? 0,
        'likes' => $stats['likeCount'] ?? 0,
        'comments' => $stats['commentCount'] ?? 0,
        'favorites' => $stats['favoriteCount'] ?? 0,
      ];
    }

    return [
      'views' => 0,
      'likes' => 0,
      'comments' => 0,
      'favorites' => 0,
    ];
  }

  public function validateCredentials(): bool
  {
    try {
      $this->client->get('https://www.googleapis.com/youtube/v3/channels', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'part' => 'id',
          'mine' => 'true',
        ],
      ]);
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }
}
