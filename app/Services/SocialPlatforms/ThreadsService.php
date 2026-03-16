<?php

namespace App\Services\SocialPlatforms;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;
use App\Helpers\LogHelper;

class ThreadsService extends BaseSocialService
{
  public function publish(SocialPostDTO $post): PostResultDTO
  {
    $this->ensureValidToken();
    $accountId = $this->socialAccount->account_id;

    if (!$accountId) {
      return PostResultDTO::failure('Threads account ID is required');
    }

    try {
      LogHelper::social('info', 'Threads publish starting', [
        'account_id' => $accountId,
        'has_media' => !empty($post->mediaPaths),
        'content_length' => strlen($post->content)
      ]);

      // Threads supports text posts and media posts
      if (!empty($post->mediaPaths)) {
        return $this->publishMediaPost($post, $accountId);
      } else {
        return $this->publishTextPost($post, $accountId);
      }
    } catch (\Exception $e) {
      LogHelper::social('error', 'Threads publish failed', [
        'error' => $e->getMessage(),
        'account_id' => $accountId,
        'trace' => $e->getTraceAsString()
      ]);
      
      return PostResultDTO::failure($e->getMessage());
    }
  }

  private function publishTextPost(SocialPostDTO $post, string $accountId): PostResultDTO
  {
    LogHelper::social('info', 'Publishing Threads text post', [
      'account_id' => $accountId,
      'content_length' => strlen($post->content)
    ]);

    // Step 1: Create thread container
    $containerEndpoint = "https://graph.threads.net/v1.0/{$accountId}/threads";
    $containerData = [
      'media_type' => 'TEXT',
      'text' => $post->content,
      'access_token' => $this->accessToken,
    ];

    // Add reply control if specified
    $threadsSettings = $post->platformSettings['threads'] ?? [];
    if (isset($threadsSettings['reply_control'])) {
      $containerData['reply_control'] = $threadsSettings['reply_control']; // 'everyone', 'accounts_you_follow', 'mentioned_only'
    }

    $containerResponse = $this->client->post($containerEndpoint, [
      'form_params' => $containerData,
      'timeout' => 60,
      'connect_timeout' => 10
    ]);
    
    $containerResult = json_decode($containerResponse->getBody(), true);

    if (!isset($containerResult['id'])) {
      LogHelper::social('error', 'Threads container creation failed', [
        'account_id' => $accountId,
        'response' => $containerResult
      ]);
      return PostResultDTO::failure('Failed to create Threads container');
    }
    
    LogHelper::social('info', 'Threads container created', [
      'container_id' => $containerResult['id']
    ]);

    // Step 2: Publish the thread
    $publishEndpoint = "https://graph.threads.net/v1.0/{$accountId}/threads_publish";
    $publishResponse = $this->client->post($publishEndpoint, [
      'form_params' => [
        'creation_id' => $containerResult['id'],
        'access_token' => $this->accessToken,
      ],
      'timeout' => 60,
      'connect_timeout' => 10
    ]);

    $publishResult = json_decode($publishResponse->getBody(), true);
    $postId = $publishResult['id'];
    
    LogHelper::social('info', 'Threads post published successfully', [
      'post_id' => $postId,
      'account_id' => $accountId
    ]);

    return PostResultDTO::success(
      postId: $postId,
      postUrl: "https://www.threads.net/@{$this->getUsername()}/post/{$postId}",
      rawData: ['platform' => 'threads', 'type' => 'text']
    );
  }

  private function publishMediaPost(SocialPostDTO $post, string $accountId): PostResultDTO
  {
    $rawPath = $post->mediaPaths[0] ?? null;
    
    if (!$rawPath) {
      return PostResultDTO::failure('Media path is required for media post');
    }

    $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');

    LogHelper::social('info', 'Publishing Threads media post', [
      'account_id' => $accountId,
      'is_video' => $isVideo,
      'media_url' => $rawPath
    ]);

    // Step 1: Create media container
    $containerEndpoint = "https://graph.threads.net/v1.0/{$accountId}/threads";
    $containerData = [
      'text' => $post->content,
      'access_token' => $this->accessToken,
    ];

    if ($isVideo) {
      $containerData['media_type'] = 'VIDEO';
      $containerData['video_url'] = $rawPath;
    } else {
      $containerData['media_type'] = 'IMAGE';
      $containerData['image_url'] = $rawPath;
    }

    // Add reply control if specified
    $threadsSettings = $post->platformSettings['threads'] ?? [];
    if (isset($threadsSettings['reply_control'])) {
      $containerData['reply_control'] = $threadsSettings['reply_control'];
    }

    $timeout = $isVideo ? 600 : 120;

    $containerResponse = $this->client->post($containerEndpoint, [
      'form_params' => $containerData,
      'timeout' => $timeout,
      'connect_timeout' => 60
    ]);
    
    $containerResult = json_decode($containerResponse->getBody(), true);

    if (!isset($containerResult['id'])) {
      LogHelper::social('error', 'Threads media container creation failed', [
        'account_id' => $accountId,
        'response' => $containerResult
      ]);
      return PostResultDTO::failure('Failed to create Threads media container');
    }
    
    LogHelper::social('info', 'Threads media container created', [
      'container_id' => $containerResult['id']
    ]);

    // Step 2: Publish the thread
    $publishTimeout = $isVideo ? 900 : 300;
    
    $publishEndpoint = "https://graph.threads.net/v1.0/{$accountId}/threads_publish";
    $publishResponse = $this->client->post($publishEndpoint, [
      'form_params' => [
        'creation_id' => $containerResult['id'],
        'access_token' => $this->accessToken,
      ],
      'timeout' => $publishTimeout,
      'connect_timeout' => 60
    ]);

    $publishResult = json_decode($publishResponse->getBody(), true);
    $postId = $publishResult['id'];
    
    LogHelper::social('info', 'Threads media post published successfully', [
      'post_id' => $postId,
      'account_id' => $accountId
    ]);

    return PostResultDTO::success(
      postId: $postId,
      postUrl: "https://www.threads.net/@{$this->getUsername()}/post/{$postId}",
      rawData: ['platform' => 'threads', 'type' => $isVideo ? 'video' : 'image']
    );
  }

  public function delete(string $postId): bool
  {
    // Threads API doesn't support deleting posts via API yet
    return false;
  }

  public function getMetrics(string $postId): array
  {
    return $this->getPostAnalytics($postId);
  }

  public function getAccountInfo(): array
  {
    $response = $this->client->get("https://graph.threads.net/v1.0/me", [
      'query' => [
        'access_token' => $this->accessToken,
        'fields' => 'id,username,threads_profile_picture_url,threads_biography',
      ]
    ]);

    return json_decode($response->getBody(), true);
  }

  public function getPostAnalytics(string $postId): array
  {
    try {
      $response = $this->client->get("https://graph.threads.net/v1.0/{$postId}/insights", [
        'query' => [
          'access_token' => $this->accessToken,
          'metric' => 'views,likes,replies,reposts,quotes',
        ]
      ]);

      $data = json_decode($response->getBody(), true);
      return $this->formatAnalytics($data);
    } catch (\Exception $e) {
      LogHelper::social('error', 'Failed to get Threads analytics', [
        'post_id' => $postId,
        'error' => $e->getMessage()
      ]);
      return [];
    }
  }

  public function validateCredentials(): bool
  {
    try {
      $this->client->get('https://graph.threads.net/v1.0/me', [
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
      'views' => 0,
      'likes' => 0,
      'replies' => 0,
      'reposts' => 0,
      'quotes' => 0,
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
   * Get comments/replies for a Threads post
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
      $endpoint = "https://graph.threads.net/v1.0/{$postId}/replies";
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
      LogHelper::social('error', 'Failed to get Threads comments', [
        'post_id' => $postId,
        'error' => $e->getMessage()
      ]);
      return [];
    }
  }

  /**
   * Get username from account info (cached)
   */
  private function getUsername(): string
  {
    static $username = null;
    
    if ($username === null) {
      try {
        $info = $this->getAccountInfo();
        $username = $info['username'] ?? 'user';
      } catch (\Exception $e) {
        $username = 'user';
      }
    }
    
    return $username;
  }
}
