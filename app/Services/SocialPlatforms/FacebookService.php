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
      // Check platform settings for content type
      $platformSettings = $post->platformSettings['facebook'] ?? [];
      $contentType = $platformSettings['type'] ?? 'post';
      
      // Check if this is a poll
      $isPoll = $contentType === 'poll';

      if ($isPoll) {
        $pollResult = $this->handlePoll($pageId, $content, $platformSettings);
        if ($pollResult) {
          return PostResultDTO::success(
            postId: $pollResult,
            postUrl: "https://facebook.com/{$pollResult}",
            rawData: ['platform' => 'facebook', 'type' => 'poll']
          );
        }
      }

      // Check if this is a reel
      $isReel = $contentType === 'reel';

      if (!empty($rawPath)) {
        $isVideo = str_contains($rawPath, '.mp4') || str_contains($rawPath, '.mov') || str_contains($rawPath, '.avi') || str_contains($rawPath, '.m4v');

        if ($isVideo) {
          if ($isReel) {
            $postId = $this->handleReelUpload($pageId, $rawPath, $content, $post->title);
          } else {
            $postId = $this->handleVideoUpload($pageId, $rawPath, $content, $post->title);
          }
        } else {
          $postId = $this->uploadPhoto($pageId, $rawPath, $content);
        }
      } else {
        $postId = $this->publishTextPost($pageId, $content, $link);
      }

      $postType = $isReel ? 'reel' : 'post';
      $postUrl = $isReel ? "https://facebook.com/reel/{$postId}" : "https://facebook.com/{$postId}";

      return PostResultDTO::success(
        postId: $postId,
        postUrl: $postUrl,
        rawData: ['platform' => 'facebook', 'type' => $postType]
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
    
    // Si es una URL (S3 u otra), intentar primero upload directo, luego resumible
    if ($isUrl) {
      Log::info('Facebook video from URL detected, trying direct upload first', [
        'url' => $rawPath,
        'is_s3' => str_contains($rawPath, 's3.amazonaws.com')
      ]);
      
      try {
        // Intentar primero el método directo (más simple y rápido)
        return $this->uploadVideo($pageId, $rawPath, $content, $title);
      } catch (\Exception $e) {
        Log::warning('Facebook direct upload failed, falling back to resumable', [
          'error' => $e->getMessage(),
          'url' => $rawPath
        ]);
        
        // Verificar si es un error específico de archivo problemático
        if (str_contains($e->getMessage(), 'There was a problem uploading your video file')) {
          Log::warning('Facebook reports problematic video file', [
            'url' => $rawPath,
            'error' => $e->getMessage()
          ]);
          
          // Aún así, intentar el método resumible una vez más
          // Pero con información adicional para debugging
        }
        
        // Si falla, usar upload resumible como fallback
        return $this->uploadVideoFromUrl($pageId, $rawPath, $content, $title);
      }
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
      // Para archivos pequeños, convertir a URL pública y usar método directo
      $publicUrl = $this->getPublicUrl($rawPath);
      return $this->uploadVideo($pageId, $publicUrl, $content, $title);
    }
  }

  /**
   * Handle Facebook Reel upload
   */
  private function handleReelUpload(string $pageId, string $rawPath, string $content, ?string $title): string
  {
    $isUrl = str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://');
    
    Log::info('Facebook Reel upload starting', [
      'pageId' => $pageId,
      'is_url' => $isUrl,
      'path' => $rawPath
    ]);
    
    // Facebook Reels use the same upload mechanism as regular videos
    // but with different endpoint and parameters
    if ($isUrl) {
      return $this->uploadReelFromUrl($pageId, $rawPath, $content, $title);
    }
    
    // For local files, convert to public URL and use URL method
    $localPath = storage_path('app/' . $rawPath);
    
    if (!file_exists($localPath)) {
      throw new \Exception("Reel video file not found: {$localPath}");
    }
    
    $publicUrl = $this->getPublicUrl($rawPath);
    return $this->uploadReelFromUrl($pageId, $publicUrl, $content, $title);
  }

  /**
   * Upload Facebook Reel from URL
   */
  private function uploadReelFromUrl(string $pageId, string $videoUrl, string $description, ?string $title): string
  {
    Log::info('Facebook Reel upload from URL starting', [
      'pageId' => $pageId,
      'url' => $videoUrl
    ]);

    // Facebook Reels endpoint
    $endpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$pageId}/video_reels";

    $params = [
      'upload_phase' => 'start',
      'access_token' => $this->accessToken,
    ];

    try {
      // Step 1: Initialize reel upload
      $response = $this->client->post($endpoint, [
        'form_params' => $params,
        'timeout' => 60
      ]);
      
      $initResult = json_decode($response->getBody(), true);
      $videoId = $initResult['video_id'] ?? null;
      $uploadUrl = $initResult['upload_url'] ?? null;

      if (!$videoId || !$uploadUrl) {
        Log::error('Facebook Reel initialization failed', [
          'response' => $initResult
        ]);
        throw new \Exception("Failed to initialize Facebook Reel upload");
      }

      Log::info('Facebook Reel upload initialized', [
        'video_id' => $videoId,
        'upload_url' => $uploadUrl
      ]);

      // Step 2: Upload video to the provided URL
      $videoResponse = $this->client->post($uploadUrl, [
        'form_params' => [
          'source' => $videoUrl,
          'access_token' => $this->accessToken,
        ],
        'timeout' => 600 // 10 minutes for video processing
      ]);

      $uploadResult = json_decode($videoResponse->getBody(), true);
      
      if (!$uploadResult['success'] ?? false) {
        throw new \Exception("Failed to upload video for Facebook Reel");
      }

      // Step 3: Finalize reel with metadata
      $finalizeParams = [
        'upload_phase' => 'finish',
        'video_id' => $videoId,
        'description' => $description,
        'access_token' => $this->accessToken,
      ];

      if ($title) {
        $finalizeParams['title'] = $title;
      }

      $finalizeResponse = $this->client->post($endpoint, [
        'form_params' => $finalizeParams,
        'timeout' => 300
      ]);

      $finalizeResult = json_decode($finalizeResponse->getBody(), true);
      $reelId = $finalizeResult['id'] ?? $videoId;

      if (!$reelId) {
        Log::error('Facebook Reel finalization failed', [
          'response' => $finalizeResult
        ]);
        throw new \Exception("Failed to finalize Facebook Reel");
      }
      
      Log::info('Facebook Reel published successfully', [
        'reel_id' => $reelId,
        'pageId' => $pageId
      ]);

      return $reelId;

    } catch (\Exception $e) {
      Log::error('Facebook Reel upload failed', [
        'error' => $e->getMessage(),
        'pageId' => $pageId,
        'url' => $videoUrl
      ]);
      
      // Fallback to regular video upload if reel upload fails
      Log::info('Falling back to regular video upload for Facebook');
      return $this->uploadVideo($pageId, $videoUrl, $description, $title);
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

    try {
      // Paso 1: Descargar el archivo temporalmente
      $tempFile = $this->downloadToTemp($videoUrl);
      
      if (!file_exists($tempFile)) {
        throw new \Exception("Failed to download video from URL");
      }

      $fileSize = filesize($tempFile);
      $fileSizeMB = round($fileSize / 1024 / 1024, 2);
      
      Log::info('File downloaded and size determined', [
        'size_mb' => $fileSizeMB,
        'temp_file' => $tempFile
      ]);

      // Paso 2: Inicializar sesión de upload usando el método correcto de Facebook
      $initEndpoint = "https://graph.facebook.com/" . self::API_VERSION . "/{$pageId}/videos";
      
      $response = $this->client->post($initEndpoint, [
        'form_params' => [
          'upload_phase' => 'start',
          'file_size' => $fileSize,
          'access_token' => $this->accessToken,
        ],
        'timeout' => 60
      ]);
      
      $initResult = json_decode($response->getBody(), true);
      $uploadSessionId = $initResult['upload_session_id'] ?? null;
      $videoId = $initResult['video_id'] ?? null;

      if (!$uploadSessionId) {
        @unlink($tempFile);
        throw new \Exception("Failed to initialize upload session");
      }

      Log::info('Facebook upload session initialized', [
        'session_id' => $uploadSessionId,
        'video_id' => $videoId
      ]);

      // Paso 3: Subir el archivo por chunks
      $uploadEndpoint = $initEndpoint; // Mismo endpoint para todas las fases
      
      // Chunks más grandes para reducir número de requests (10MB en lugar de 5MB)
      $chunkSize = 1024 * 1024 * 10; // 10MB
      $totalChunks = ceil($fileSize / $chunkSize);
      
      Log::info('Upload configuration', [
        'chunk_size_mb' => 10,
        'total_chunks' => $totalChunks
      ]);
      
      $handle = fopen($tempFile, 'rb');
      if (!$handle) {
        @unlink($tempFile);
        throw new \Exception('Failed to open temporary file for reading');
      }

      try {
        $fileOffset = 0;
        $chunkNumber = 0;
        $maxRetries = 3;

        while ($fileOffset < $fileSize) {
          // Leer el chunk
          fseek($handle, $fileOffset);
          $chunkData = fread($handle, $chunkSize);
          $chunkLength = strlen($chunkData);
          
          if ($chunkLength === 0) {
            break;
          }

          $chunkNumber++;
          $retryCount = 0;
          $chunkUploaded = false;

          // Reintentar subida de chunk si falla
          while (!$chunkUploaded && $retryCount < $maxRetries) {
            try {
              // Facebook requires start_offset as string and proper multipart formatting
              $multipartData = [
                [
                  'name' => 'upload_phase',
                  'contents' => 'transfer'
                ],
                [
                  'name' => 'upload_session_id',
                  'contents' => $uploadSessionId
                ],
                [
                  'name' => 'start_offset',
                  'contents' => (string)$fileOffset // Cast to string for Facebook API
                ],
                [
                  'name' => 'video_file_chunk',
                  'contents' => $chunkData,
                  'filename' => 'chunk.mp4' // Provide filename for binary data
                ],
                [
                  'name' => 'access_token',
                  'contents' => $this->accessToken
                ]
              ];

              $this->client->post($uploadEndpoint, [
                'multipart' => $multipartData,
                'timeout' => 600,
                'connect_timeout' => 30
              ]);

              $chunkUploaded = true;

            } catch (\GuzzleHttp\Exception\ClientException $e) {
              $retryCount++;
              $statusCode = $e->getResponse()->getStatusCode();
              
              // Manejar error 429 (Rate Limit)
              if ($statusCode === 429) {
                $errorBody = json_decode($e->getResponse()->getBody()->getContents(), true);
                $backoffMs = $errorBody['backoff'] ?? 60000; // Default 60 segundos
                $backoffSeconds = $backoffMs / 1000;
                $isRetriable = $errorBody['debug_info']['retriable'] ?? true;
                $message = $errorBody['debug_info']['message'] ?? $errorBody['error']['message'] ?? 'Rate limit exceeded';
                
                Log::warning('Facebook rate limit hit', [
                  'chunk' => $chunkNumber,
                  'attempt' => $retryCount,
                  'backoff_seconds' => $backoffSeconds,
                  'retriable' => $isRetriable,
                  'message' => $message
                ]);
                
                // Si no es retriable, esperar más tiempo antes de fallar
                if (!$isRetriable) {
                  // Para rate limits no retriables, esperar al menos 60 segundos
                  $waitTime = max(60, $backoffSeconds);
                  Log::warning('Non-retriable rate limit, waiting longer', [
                    'wait_seconds' => $waitTime,
                    'chunk' => $chunkNumber
                  ]);
                  sleep((int)$waitTime);
                  
                  // Si ya intentamos varias veces, fallar
                  if ($retryCount >= $maxRetries) {
                    throw new \Exception("Facebook rate limit error (non-retriable after {$maxRetries} attempts): {$message}");
                  }
                } else {
                  // Esperar el tiempo de backoff que Facebook indica
                  Log::info('Waiting for rate limit backoff', [
                    'seconds' => $backoffSeconds,
                    'chunk' => $chunkNumber
                  ]);
                  sleep((int)$backoffSeconds);
                }
                
              } else {
                // Otros errores
                Log::warning('Facebook chunk upload failed, retrying', [
                  'chunk' => $chunkNumber,
                  'attempt' => $retryCount,
                  'offset' => $fileOffset,
                  'status_code' => $statusCode,
                  'error' => $e->getMessage()
                ]);
                
                if ($retryCount >= $maxRetries) {
                  throw new \Exception("Failed to upload chunk {$chunkNumber} after {$maxRetries} attempts: " . $e->getMessage());
                }
                
                // Backoff exponencial para otros errores
                usleep(500000 * $retryCount); // 0.5s, 1s, 1.5s
              }
              
            } catch (\Exception $e) {
              $retryCount++;
              
              Log::warning('Facebook chunk upload failed, retrying', [
                'chunk' => $chunkNumber,
                'attempt' => $retryCount,
                'offset' => $fileOffset,
                'error' => $e->getMessage()
              ]);

              if ($retryCount >= $maxRetries) {
                throw new \Exception("Failed to upload chunk {$chunkNumber} after {$maxRetries} attempts: " . $e->getMessage());
              }

              usleep(500000 * $retryCount); // 0.5s, 1s, 1.5s
            }
          }

          $fileOffset += $chunkLength;
          
          // Delay más largo entre chunks para respetar rate limits de Facebook
          // Facebook permite máximo 10 requests/segundo, así que esperamos al menos 150ms
          if ($fileOffset < $fileSize) {
            usleep(150000); // 150ms entre chunks = máximo ~6.6 chunks/segundo
          }
          
          // Log progreso cada 10 chunks o en el último
          if ($chunkNumber % 10 === 0 || $chunkNumber === $totalChunks) {
            $progress = round(($fileOffset / $fileSize) * 100, 1);
            Log::info('Facebook upload progress', [
              'progress' => "{$progress}%",
              'chunk' => "{$chunkNumber}/{$totalChunks}",
              'uploaded_mb' => round($fileOffset / 1024 / 1024, 2),
              'total_mb' => $fileSizeMB
            ]);
          }
        }

        Log::info('Facebook file uploaded successfully', [
          'total_chunks' => $chunkNumber
        ]);

      } finally {
        if (is_resource($handle)) {
          fclose($handle);
        }
        if (file_exists($tempFile)) {
          @unlink($tempFile);
        }
      }

      // Paso 4: Finalizar el upload
      $finishParams = [
        'upload_phase' => 'finish',
        'upload_session_id' => $uploadSessionId,
        'access_token' => $this->accessToken,
        'description' => $description,
      ];

      if ($title) {
        $finishParams['title'] = $title;
      }

      Log::info('Finishing video upload', [
        'session_id' => $uploadSessionId
      ]);

      $response = $this->client->post($uploadEndpoint, [
        'form_params' => $finishParams,
        'timeout' => 300
      ]);

      $finishResult = json_decode($response->getBody(), true);
      $finalVideoId = $finishResult['id'] ?? $videoId;

      if (!$finalVideoId) {
        Log::error('Failed to get video ID from finish response', [
          'response' => $finishResult
        ]);
        throw new \Exception("Failed to publish video: " . json_encode($finishResult));
      }
      
      Log::info('Facebook video published successfully', [
        'video_id' => $finalVideoId,
        'response' => $finishResult
      ]);

      return $finalVideoId;

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
    
    // Validar que el archivo se descargó correctamente
    if (!file_exists($tempFile) || filesize($tempFile) === 0) {
      throw new \Exception('Downloaded file is empty or does not exist');
    }
    
    // Validar que es un archivo de video válido
    $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($fileInfo, $tempFile);
    finfo_close($fileInfo);
    
    // Obtener información adicional del archivo para diagnóstico
    $fileSize = filesize($tempFile);
    $fileSizeMB = round($fileSize / 1024 / 1024, 2);
    
    // Intentar obtener información del video usando ffprobe si está disponible
    $videoInfo = [];
    if (function_exists('shell_exec')) {
      $ffprobeOutput = @shell_exec("ffprobe -v quiet -print_format json -show_format -show_streams " . escapeshellarg($tempFile) . " 2>/dev/null");
      if ($ffprobeOutput) {
        $videoInfo = json_decode($ffprobeOutput, true) ?? [];
      }
    }
    
    Log::info('Download completed with detailed info', [
      'temp_file' => $tempFile,
      'file_size' => $fileSize,
      'file_size_mb' => $fileSizeMB,
      'mime_type' => $mimeType,
      'video_info' => $videoInfo
    ]);
    
    // Verificar que es un tipo de archivo de video válido
    $validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!in_array($mimeType, $validVideoTypes)) {
      @unlink($tempFile);
      throw new \Exception("Invalid video file type: {$mimeType}. Expected video format.");
    }
    
    // Verificar tamaño mínimo (evitar archivos corruptos)
    if ($fileSize < 1024) { // Menos de 1KB
      @unlink($tempFile);
      throw new \Exception("File too small ({$fileSize} bytes), possibly corrupted");
    }
    
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
        'verify' => false, // Para URLs de S3 con certificados
        'progress' => function ($downloadTotal, $downloadedBytes) {
          if ($downloadTotal > 0) {
            $progress = round(($downloadedBytes / $downloadTotal) * 100, 1);
            if ($progress % 20 == 0 && $progress > 0) { // Log cada 20%
              Log::info('Facebook download progress', [
                'progress' => "{$progress}%",
                'downloaded_mb' => round($downloadedBytes / 1024 / 1024, 2)
              ]);
            }
          }
        }
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

  private function handlePoll($pageId, $content, $settings)
  {
    $pollOptions = array_filter($settings['poll_options'] ?? [], fn($opt) => !empty(trim($opt)));
    
    if (count($pollOptions) < 2) {
      throw new \Exception("Facebook polls require at least 2 options");
    }

    if (count($pollOptions) > 2) {
      throw new \Exception("Facebook polls support maximum 2 options");
    }

    // Facebook Graph API doesn't support creating polls through the regular feed endpoint
    // Facebook polls are only available through Facebook's native interface
    // We'll create a regular post with poll-like content as a fallback
    
    \Log::info("Facebook polls are not supported through Graph API, creating text post with poll options", [
      'page_id' => $pageId,
      'poll_options' => $pollOptions
    ]);
    
    // Create a text post that looks like a poll
    $pollText = $content . "\n\n📊 Poll Options:\n";
    foreach ($pollOptions as $index => $option) {
      $pollText .= ($index + 1) . ". " . $option . "\n";
    }
    $pollText .= "\n💬 Comment with your choice!";
    
    return $this->publishTextPost($pageId, $pollText);
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
