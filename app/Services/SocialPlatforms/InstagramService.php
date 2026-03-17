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
      $rawPath = $post->mediaPaths[0] ?? null;
      
      if ($rawPath) {
        $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');
        
        LogHelper::social('info', 'Instagram publish starting', [
          'account_id' => $accountId,
          'has_media' => true,
          'is_video' => $isVideo,
          'media_url' => $rawPath,
          'content_type' => $post->platformSettings['instagram']['content_type'] ?? 'post'
        ]);
      }

      // Determine content type from platform settings
      $contentType = $post->platformSettings['instagram']['content_type'] ?? 'post';
      
      // Handle different content types
      switch ($contentType) {
        case 'reel':
          return $this->publishReel($post, $accountId, $rawPath);
        case 'story':
          return $this->publishStory($post, $accountId, $rawPath);
        default:
          return $this->publishPost($post, $accountId, $rawPath);
      }
    } catch (\Exception $e) {
      LogHelper::social('error', 'Instagram publish failed', [
        'error' => $e->getMessage(),
        'account_id' => $accountId,
        'trace' => $e->getTraceAsString()
      ]);
      
      $friendlyMessage = $this->extractInstagramErrorMessage($e);
      return PostResultDTO::failure($friendlyMessage);
    }
  }

  private function publishReel(SocialPostDTO $post, string $accountId, ?string $rawPath): PostResultDTO
  {
    if (!$rawPath) {
      return PostResultDTO::failure('Reel requires a video file');
    }

    $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');
    if (!$isVideo) {
      return PostResultDTO::failure('Reel requires a video file, not an image');
    }

    LogHelper::social('info', 'Publishing Instagram Reel', [
      'account_id' => $accountId,
      'video_url' => $rawPath
    ]);

    // Step 1: Create reel container
    $containerEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media";
    $containerData = [
      'caption' => $post->content,
      'media_type' => 'REELS',
      'video_url' => $rawPath,
      'access_token' => $this->accessToken,
    ];

    // Add reel-specific settings
    $reelSettings = $post->platformSettings['instagram'] ?? [];
    if (isset($reelSettings['cover_url'])) {
      $containerData['thumb_offset'] = $reelSettings['thumb_offset'] ?? 0;
    }

    $containerResponse = $this->client->post($containerEndpoint, [
      'form_params' => $containerData,
      'timeout' => 600, // 10 minutes for video processing
      'connect_timeout' => 60
    ]);
    
    $containerResult = json_decode($containerResponse->getBody(), true);

    if (!isset($containerResult['id'])) {
      LogHelper::social('error', 'Instagram reel container creation failed', [
        'account_id' => $accountId,
        'response' => $containerResult
      ]);
      return PostResultDTO::failure('Failed to create Instagram reel container');
    }
    
    LogHelper::social('info', 'Instagram reel container created', [
      'container_id' => $containerResult['id']
    ]);

    // Step 2: Publish the reel
    $publishEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media_publish";
    $publishResponse = $this->client->post($publishEndpoint, [
      'form_params' => [
        'creation_id' => $containerResult['id'],
        'access_token' => $this->accessToken,
      ],
      'timeout' => 900, // 15 minutes for reel processing
      'connect_timeout' => 60
    ]);

    $publishResult = json_decode($publishResponse->getBody(), true);
    $postId = $publishResult['id'];
    
    LogHelper::social('info', 'Instagram reel published successfully', [
      'post_id' => $postId,
      'account_id' => $accountId
    ]);

    return PostResultDTO::success(
      postId: $postId,
      postUrl: "https://www.instagram.com/reel/{$postId}",
      rawData: ['platform' => 'instagram', 'type' => 'reel']
    );
  }

  private function publishStory(SocialPostDTO $post, string $accountId, ?string $rawPath): PostResultDTO
  {
    if (!$rawPath) {
      return PostResultDTO::failure('Story requires a media file');
    }

    LogHelper::social('info', 'Publishing Instagram Story', [
      'account_id' => $accountId,
      'media_url' => $rawPath
    ]);

    $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');

    // Step 1: Create story container
    $containerEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media";
    $containerData = [
      'media_type' => 'STORIES',
      'access_token' => $this->accessToken,
    ];

    if ($isVideo) {
      $containerData['video_url'] = $rawPath;
    } else {
      $containerData['image_url'] = $rawPath;
    }

    // Add story text if provided
    if (!empty($post->content)) {
      // Note: Instagram Stories don't support captions like posts
      // Text would need to be overlaid on the media itself
      LogHelper::social('info', 'Story text content will be ignored', [
        'content' => $post->content
      ]);
    }

    $timeout = $isVideo ? 600 : 120;

    $containerResponse = $this->client->post($containerEndpoint, [
      'form_params' => $containerData,
      'timeout' => $timeout,
      'connect_timeout' => 60
    ]);
    
    $containerResult = json_decode($containerResponse->getBody(), true);

    if (!isset($containerResult['id'])) {
      LogHelper::social('error', 'Instagram story container creation failed', [
        'account_id' => $accountId,
        'response' => $containerResult
      ]);
      return PostResultDTO::failure('Failed to create Instagram story container');
    }
    
    LogHelper::social('info', 'Instagram story container created', [
      'container_id' => $containerResult['id']
    ]);

    // Step 2: Publish the story
    $publishTimeout = $isVideo ? 900 : 300;
    
    $publishEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media_publish";
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
    
    LogHelper::social('info', 'Instagram story published successfully', [
      'post_id' => $postId,
      'account_id' => $accountId
    ]);

    return PostResultDTO::success(
      postId: $postId,
      postUrl: "https://www.instagram.com/stories/{$accountId}/{$postId}",
      rawData: ['platform' => 'instagram', 'type' => 'story']
    );
  }

  private function publishPost(SocialPostDTO $post, string $accountId, ?string $rawPath): PostResultDTO
  {
    // Original post logic
    $containerEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media";
    $containerData = [
      'caption' => $post->content,
      'access_token' => $this->accessToken,
    ];

    if ($rawPath) {
      $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');
      if ($isVideo) {
        $containerData['media_type'] = 'VIDEO';
        $containerData['video_url'] = $rawPath;
      } else {
        $containerData['image_url'] = $rawPath;
      }
    }

    $timeout = isset($isVideo) && $isVideo ? 600 : 120;

    $containerResponse = $this->client->post($containerEndpoint, [
      'form_params' => $containerData,
      'timeout' => $timeout,
      'connect_timeout' => 60
    ]);
    
    $containerResult = json_decode($containerResponse->getBody(), true);

    if (!isset($containerResult['id'])) {
      LogHelper::social('error', 'Instagram container creation failed', [
        'account_id' => $accountId,
        'response' => $containerResult
      ]);
      return PostResultDTO::failure('Failed to create Instagram media container');
    }
    
    LogHelper::social('info', 'Instagram media container created', [
      'container_id' => $containerResult['id']
    ]);

    $publishTimeout = isset($isVideo) && $isVideo ? 900 : 300;
    
    $publishEndpoint = "https://graph.facebook.com/v18.0/{$accountId}/media_publish";
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
    
    LogHelper::social('info', 'Instagram post published successfully', [
      'post_id' => $postId,
      'account_id' => $accountId
    ]);

    return PostResultDTO::success(
      postId: $postId,
      postUrl: "https://www.instagram.com/p/{$postId}",
      rawData: ['platform' => 'instagram', 'type' => 'post']
    );
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

  /**
   * Extract user-friendly error message from Instagram API response
   */
  private function extractInstagramErrorMessage(\Exception $e): string
  {
    if (!($e instanceof \GuzzleHttp\Exception\ClientException)) {
      return $e->getMessage();
    }

    try {
      $responseBody = $e->getResponse()->getBody()->getContents();
      $errorData = json_decode($responseBody, true);
      
      $errorCode = $errorData['error']['code'] ?? null;
      $errorMessage = $errorData['error']['message'] ?? null;
      $errorType = $errorData['error']['type'] ?? null;
      
      // Map common Instagram errors to user-friendly messages
      if ($errorCode) {
        $friendlyMessage = match($errorCode) {
          190 => 'Tu sesión de Instagram ha expirado. Reconecta tu cuenta desde la configuración.',
          100 => 'Parámetros inválidos. Verifica el formato del contenido.',
          200 => 'No tienes permisos para publicar en esta cuenta de Instagram.',
          368 => 'Temporalmente bloqueado por Instagram. Intenta nuevamente en unos minutos.',
          default => null
        };
        
        if ($friendlyMessage) {
          return $friendlyMessage;
        }
      }
      
      // Check for specific error patterns in message
      if ($errorMessage) {
        if (str_contains($errorMessage, 'video file is too large')) {
          return 'El video es demasiado grande para Instagram. Tamaño máximo: 100MB para feed, 4GB para reels.';
        }
        if (str_contains($errorMessage, 'video is too long')) {
          return 'El video es demasiado largo. Instagram permite hasta 60 segundos en feed, 90 segundos en reels.';
        }
        if (str_contains($errorMessage, 'video is too short')) {
          return 'El video es demasiado corto. Instagram requiere al menos 3 segundos.';
        }
        if (str_contains($errorMessage, 'Invalid image format')) {
          return 'Formato de imagen no válido. Instagram acepta JPG y PNG.';
        }
        if (str_contains($errorMessage, 'Invalid video format')) {
          return 'Formato de video no válido. Instagram acepta MP4 y MOV.';
        }
        if (str_contains($errorMessage, 'rate limit')) {
          return 'Has excedido el límite de publicaciones de Instagram. Intenta más tarde.';
        }
        if (str_contains($errorMessage, 'media_url') || str_contains($errorMessage, 'download')) {
          return 'Instagram no pudo descargar tu archivo. Verifica que la URL sea accesible públicamente.';
        }
        if (str_contains($errorMessage, 'processing')) {
          return 'Instagram está procesando tu contenido. Esto puede tardar unos minutos.';
        }
        if (str_contains($errorMessage, 'Business account')) {
          return 'Esta función requiere una cuenta de Instagram Business o Creator.';
        }
        
        return $errorMessage;
      }
      
      return $e->getMessage();
    } catch (\Exception $parseError) {
      return $e->getMessage();
    }
  }
}
