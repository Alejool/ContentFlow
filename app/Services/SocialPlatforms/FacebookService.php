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
          $postId = $this->handleVideoUpload($pageId, $rawPath, $content, $post->title);
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

  /**
   * Handle video upload with smart detection
   */
  private function handleVideoUpload(string $pageId, string $rawPath, string $content, ?string $title): string
  {
    $isUrl = str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://');
    
    // Si es una URL (S3 u otra), usar upload resumible directamente
    if ($isUrl) {
      Log::info('Facebook video from URL detected, using resumable upload', [
        'url' => $rawPath,
        'is_s3' => str_contains($rawPath, 's3.amazonaws.com')
      ]);
      
      // Siempre usar upload resumible para URLs (más confiable, evita timeouts 504)
      return $this->uploadVideoFromUrl($pageId, $rawPath, $content, $title);
    }
    
    // Es un path local
    $localPath = storage_path('app/' . $rawPath);
    
    if (!file_exists($localPath)) {
      throw new \Exception("Video file not found: {$localPath}");
    }
    
    $fileSizeMB = filesize($localPath) / 1024 / 1024;
    
    Log::info('Facebook video upload decision', [
      'file_size_mb' => round($fileSizeMB, 2),
      'use_resumable' => $fileSizeMB > 50,
      'source' => 'local'
    ]);
    
    // Para archivos > 50MB locales, usar upload resumible
    // Reducido de 100MB a 50MB para mayor confiabilidad
    if ($fileSizeMB > 50) {
      return $this->uploadVideoResumable($pageId, $localPath, $content, $title);
    } else {
      // Para archivos pequeños, convertir a URL pública y usar resumible también
      $publicUrl = $this->getPublicUrl($rawPath);
      return $this->uploadVideoFromUrl($pageId, $publicUrl, $content, $title);
    }
  }

  /**
   * Upload video from URL using resumable upload (streaming, no memory issues)
   */
  private function uploadVideoFromUrl(string $pageId, string $videoUrl, string $description, ?string $title): string
  {
    Log::info('Facebook resumable upload from URL starting', [
      'pageId' => $pageId,
      'url' => $videoUrl
    ]);

    $initEndpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$pageId}/videos";
    
    try {
      // Paso 1: Obtener tamaño del archivo sin descargarlo
      $headResponse = $this->client->head($videoUrl, ['timeout' => 30]);
      $fileSize = $headResponse->getHeader('Content-Length')[0] ?? 0;
      
      if (!$fileSize) {
        throw new \Exception("Could not determine file size from URL");
      }
      
      $fileSizeMB = round($fileSize / 1024 / 1024, 2);
      Log::info('File size determined', [
        'size_mb' => $fileSizeMB
      ]);

      // Paso 2: Inicializar sesión de upload
      $initParams = [
        'upload_phase' => 'start',
        'file_size' => $fileSize,
        'access_token' => $this->accessToken,
      ];

      $response = $this->client->post($initEndpoint, [
        'form_params' => $initParams,
        'timeout' => 60
      ]);
      
      $initResult = json_decode($response->getBody(), true);
      $uploadSessionId = $initResult['upload_session_id'] ?? null;
      $videoId = $initResult['video_id'] ?? null;

      if (!$uploadSessionId) {
        throw new \Exception("Failed to initialize upload session");
      }

      Log::info('Facebook upload session initialized', [
        'session_id' => $uploadSessionId,
        'video_id' => $videoId
      ]);

      // Paso 3: Descargar y subir en chunks optimizados
      // Chunks más grandes = menos requests = más rápido
      $chunkSize = 1024 * 1024 * 10; // 10MB chunks (aumentado de 5MB)
      
      Log::info('Upload configuration', [
        'chunk_size_mb' => 10,
        'estimated_chunks' => ceil($fileSize / $chunkSize)
      ]);

      // Descargar archivo completo primero (más rápido para leer chunks)
      $tempFile = $this->downloadToTemp($videoUrl);
      
      $handle = fopen($tempFile, 'rb');
      if (!$handle) {
        unlink($tempFile);
        throw new \Exception('Failed to open temporary file for reading');
      }

      try {
        $offset = 0;
        $chunkNumber = 0;
        $maxRetries = 3;
        $totalChunks = ceil($fileSize / $chunkSize);

        while (!feof($handle)) {
          $chunk = fread($handle, $chunkSize);
          $chunkLength = strlen($chunk);
          
          if ($chunkLength === 0) {
            break;
          }

          $chunkNumber++;
          $retryCount = 0;
          $chunkUploaded = false;

          // Reintentar subida de chunk si falla
          while (!$chunkUploaded && $retryCount < $maxRetries) {
            try {
              // Subir chunk a Facebook
              $transferParams = [
                'upload_phase' => 'transfer',
                'upload_session_id' => $uploadSessionId,
                'start_offset' => $offset,
                'video_file_chunk' => $chunk,
                'access_token' => $this->accessToken,
              ];

              $this->client->post($initEndpoint, [
                'multipart' => $this->buildMultipart($transferParams),
                'timeout' => 600,
                'connect_timeout' => 30
              ]);

              $chunkUploaded = true;

            } catch (\Exception $e) {
              $retryCount++;
              
              Log::warning('Facebook chunk upload failed, retrying', [
                'chunk' => $chunkNumber,
                'attempt' => $retryCount,
                'error' => $e->getMessage()
              ]);

              if ($retryCount >= $maxRetries) {
                throw new \Exception("Failed to upload chunk {$chunkNumber} after {$maxRetries} attempts: " . $e->getMessage());
              }

              usleep(500000 * $retryCount); // 0.5s, 1s, 1.5s
            }
          }

          $offset += $chunkLength;
          
          // Log progreso cada 10 chunks
          if ($chunkNumber % 10 === 0 || $chunkNumber === $totalChunks) {
            $progress = round(($chunkNumber / $totalChunks) * 100, 1);
            Log::info('Facebook upload progress', [
              'progress' => "{$progress}%",
              'chunk' => "{$chunkNumber}/{$totalChunks}",
              'uploaded_mb' => round($offset / 1024 / 1024, 2),
              'total_mb' => $fileSizeMB
            ]);
          }
        }
      } finally {
        // Asegurar que siempre se cierre el handle
        if (is_resource($handle)) {
          fclose($handle);
        }
        // Limpiar archivo temporal
        if (file_exists($tempFile)) {
          @unlink($tempFile);
        }
      }

      // Paso 4: Finalizar upload
      $finishParams = [
        'upload_phase' => 'finish',
        'upload_session_id' => $uploadSessionId,
        'access_token' => $this->accessToken,
        'description' => $description,
      ];

      if ($title) {
        $finishParams['title'] = $title;
      }

      $response = $this->client->post($initEndpoint, [
        'form_params' => $finishParams,
        'timeout' => 300
      ]);

      $finishResult = json_decode($response->getBody(), true);
      
      Log::info('Facebook resumable upload from URL completed', [
        'video_id' => $finishResult['id'] ?? $videoId,
        'success' => $finishResult['success'] ?? false
      ]);

      return $finishResult['id'] ?? $videoId;

    } catch (\Exception $e) {
      Log::error('Facebook resumable upload from URL failed', [
        'error' => $e->getMessage(),
        'pageId' => $pageId,
        'url' => $videoUrl
      ]);
      throw $e;
    }
  }

  /**
   * Descargar archivo a temporal de forma optimizada
   */
  private function downloadToTemp(string $url): string
  {
    $tempFile = sys_get_temp_dir() . '/fb_upload_' . uniqid() . '.mp4';
    
    Log::info('Downloading video to temp', ['url' => $url]);
    
    $resource = fopen($tempFile, 'w');
    if (!$resource) {
      throw new \Exception('Failed to create temporary file');
    }
    
    try {
      $this->client->get($url, [
        'sink' => $resource,
        'timeout' => 0,
        'read_timeout' => 3600, // 1 hora para descargar
        'progress' => function($downloadTotal, $downloadedBytes) {
          if ($downloadTotal > 0 && $downloadedBytes > 0 && $downloadedBytes % (50 * 1024 * 1024) === 0) { // Log cada 50MB
            $progress = round(($downloadedBytes / $downloadTotal) * 100, 1);
            Log::info('Download progress', [
              'progress' => "{$progress}%",
              'downloaded_mb' => round($downloadedBytes / 1024 / 1024, 2)
            ]);
          }
        }
      ]);
    } finally {
      if (is_resource($resource)) {
        fclose($resource);
      }
    }
    
    Log::info('Download completed', ['temp_file' => $tempFile]);
    
    return $tempFile;
  }

  /**
   * Download file temporarily from URL
   */
  private function downloadTemporarily(string $url): string
  {
    $tempPath = sys_get_temp_dir() . '/fb_upload_' . uniqid() . '.mp4';
    
    Log::info('Downloading video temporarily', [
      'url' => $url,
      'temp_path' => $tempPath
    ]);
    
    try {
      // Usar Guzzle para mejor manejo de timeouts y progreso
      $response = $this->client->get($url, [
        'sink' => $tempPath,
        'timeout' => 600, // 10 minutos para descargar
        'connect_timeout' => 30,
        'verify' => false // Para URLs de S3 con certificados
      ]);
      
      if (!file_exists($tempPath)) {
        throw new \Exception("Failed to save downloaded video");
      }
      
      $fileSizeMB = round(filesize($tempPath) / 1024 / 1024, 2);
      
      Log::info('Video downloaded successfully', [
        'size_mb' => $fileSizeMB,
        'temp_path' => $tempPath
      ]);
      
      // Si el archivo es demasiado grande (>500MB), advertir
      if ($fileSizeMB > 500) {
        Log::warning('Very large video file', [
          'size_mb' => $fileSizeMB,
          'recommendation' => 'Consider compressing video before upload'
        ]);
      }
      
      return $tempPath;
    } catch (\Exception $e) {
      // Limpiar archivo temporal si existe
      if (file_exists($tempPath)) {
        @unlink($tempPath);
      }
      
      Log::error('Failed to download video', [
        'url' => $url,
        'error' => $e->getMessage()
      ]);
      
      throw new \Exception("Failed to download video for upload: " . $e->getMessage());
    }
  }

  /**
   * Get public URL for a local file path
   */
  private function getPublicUrl(string $path): string
  {
    // Si ya es una URL, devolverla
    if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
      return $path;
    }
    
    // Generar URL pública temporal
    return url('storage/' . $path);
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

    // Implementar reintentos con backoff exponencial para archivos pesados
    $maxAttempts = 3;
    $attempt = 0;
    $lastException = null;

    while ($attempt < $maxAttempts) {
      $attempt++;
      
      try {
        Log::info('Facebook video upload attempt', [
          'attempt' => $attempt,
          'max_attempts' => $maxAttempts,
          'pageId' => $pageId
        ]);

        // Timeout aumentado progresivamente: 10min, 15min, 20min
        $timeout = 600 + ($attempt * 300);
        
        $response = $this->client->post($endpoint, [
          'form_params' => $params,
          'timeout' => $timeout,
          'connect_timeout' => 60,
          'read_timeout' => $timeout
        ]);
        
        $result = json_decode($response->getBody(), true);

        if (!isset($result['id'])) {
          throw new \Exception("Failed to get Video ID from Facebook: " . json_encode($result));
        }

        Log::info('Facebook video upload successful', [
          'video_id' => $result['id'],
          'attempt' => $attempt,
          'pageId' => $pageId
        ]);

        return $result['id'];
        
      } catch (\GuzzleHttp\Exception\ServerException $e) {
        $lastException = $e;
        $statusCode = $e->getResponse()->getStatusCode();
        
        Log::warning('Facebook video upload server error', [
          'attempt' => $attempt,
          'status_code' => $statusCode,
          'error' => $e->getMessage(),
          'pageId' => $pageId
        ]);

        // Si es 504 (Gateway Timeout) o 503 (Service Unavailable), reintentar
        if (in_array($statusCode, [503, 504]) && $attempt < $maxAttempts) {
          $waitSeconds = pow(2, $attempt) * 30; // 30s, 60s, 120s
          Log::info('Retrying Facebook upload after backoff', [
            'wait_seconds' => $waitSeconds,
            'next_attempt' => $attempt + 1
          ]);
          sleep($waitSeconds);
          continue;
        }
        
        // Si es otro error de servidor, lanzar inmediatamente
        throw $e;
        
      } catch (\Exception $e) {
        $lastException = $e;
        
        Log::error('Facebook video upload failed', [
          'attempt' => $attempt,
          'error' => $e->getMessage(),
          'pageId' => $pageId,
          'videoUrl' => $videoUrl
        ]);
        
        // Para otros errores, no reintentar
        throw $e;
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw new \Exception(
      "Facebook video upload failed after {$maxAttempts} attempts. Last error: " . 
      ($lastException ? $lastException->getMessage() : 'Unknown error')
    );
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

  /**
   * Upload video using Facebook's resumable upload (for very large files)
   * This method is more reliable for files > 100MB
   * 
   * @param string $pageId
   * @param string $localFilePath Local path to video file
   * @param string $description
   * @param string|null $title
   * @return string Video ID
   */
  private function uploadVideoResumable($pageId, $localFilePath, $description, $title = null)
  {
    if (!file_exists($localFilePath)) {
      throw new \Exception("Video file not found: {$localFilePath}");
    }

    $fileSize = filesize($localFilePath);
    
    Log::info('Facebook resumable upload starting', [
      'pageId' => $pageId,
      'file_size_mb' => round($fileSize / 1024 / 1024, 2)
    ]);

    // Step 1: Initialize upload session
    $initEndpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$pageId}/videos";
    
    $initParams = [
      'upload_phase' => 'start',
      'file_size' => $fileSize,
      'access_token' => $this->accessToken,
    ];

    try {
      $response = $this->client->post($initEndpoint, [
        'form_params' => $initParams,
        'timeout' => 60
      ]);
      
      $initResult = json_decode($response->getBody(), true);
      $uploadSessionId = $initResult['upload_session_id'] ?? null;
      $videoId = $initResult['video_id'] ?? null;

      if (!$uploadSessionId) {
        throw new \Exception("Failed to initialize upload session");
      }

      Log::info('Facebook upload session initialized', [
        'session_id' => $uploadSessionId,
        'video_id' => $videoId
      ]);

      // Step 2: Upload video in chunks
      $chunkSize = 1024 * 1024 * 5; // 5MB chunks
      $handle = fopen($localFilePath, 'rb');
      $offset = 0;

      while (!feof($handle)) {
        $chunk = fread($handle, $chunkSize);
        $chunkLength = strlen($chunk);

        $transferParams = [
          'upload_phase' => 'transfer',
          'upload_session_id' => $uploadSessionId,
          'start_offset' => $offset,
          'video_file_chunk' => $chunk,
          'access_token' => $this->accessToken,
        ];

        $this->client->post($initEndpoint, [
          'multipart' => $this->buildMultipart($transferParams),
          'timeout' => 300
        ]);

        $offset += $chunkLength;
        
        $progress = round(($offset / $fileSize) * 100, 1);
        Log::info('Facebook upload progress', [
          'progress' => "{$progress}%",
          'uploaded_mb' => round($offset / 1024 / 1024, 2)
        ]);
      }

      fclose($handle);

      // Step 3: Finalize upload
      $finishParams = [
        'upload_phase' => 'finish',
        'upload_session_id' => $uploadSessionId,
        'access_token' => $this->accessToken,
        'description' => $description,
      ];

      if ($title) {
        $finishParams['title'] = $title;
      }

      $response = $this->client->post($initEndpoint, [
        'form_params' => $finishParams,
        'timeout' => 120
      ]);

      $finishResult = json_decode($response->getBody(), true);
      
      Log::info('Facebook resumable upload completed', [
        'video_id' => $finishResult['id'] ?? $videoId,
        'success' => $finishResult['success'] ?? false
      ]);

      return $finishResult['id'] ?? $videoId;

    } catch (\Exception $e) {
      Log::error('Facebook resumable upload failed', [
        'error' => $e->getMessage(),
        'pageId' => $pageId
      ]);
      throw $e;
    }
  }

  /**
   * Build multipart form data for chunked upload
   */
  private function buildMultipart(array $params): array
  {
    $multipart = [];
    foreach ($params as $name => $value) {
      $multipart[] = [
        'name' => $name,
        'contents' => $value
      ];
    }
    return $multipart;
  }
}
