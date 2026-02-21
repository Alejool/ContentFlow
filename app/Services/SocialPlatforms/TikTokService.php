<?php

namespace App\Services\SocialPlatforms;

use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;

class TikTokService extends BaseSocialService
{
  public function publish(SocialPostDTO $post): PostResultDTO
  {
    $this->ensureValidToken();
    $rawPath = $post->mediaPaths[0] ?? null;

    if (!$rawPath) {
      return PostResultDTO::failure('TikTok requires a video file');
    }

    try {
      // Si es una URL, descargar temporalmente
      $isUrl = str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://');
      $localPath = $rawPath;
      $tempFile = null;
      
      if ($isUrl) {
        Log::info('TikTok: Downloading video from URL', ['url' => $rawPath]);
        $tempFile = $this->downloadVideoFromUrl($rawPath);
        $localPath = $tempFile;
      } elseif (!file_exists($rawPath)) {
        return PostResultDTO::failure('TikTok video file not found');
      }

      // Step 1: Initialize Upload
      $uploadParams = [
        'content' => $post->content,
        'video_path' => $localPath,
        'platform_settings' => $post->platformSettings,
      ];
      $uploadInfo = $this->initializeUpload($uploadParams);
      $publishId = $uploadInfo['publish_id'];
      $uploadUrl = $uploadInfo['upload_url'];

      // Step 2: Upload Video File
      $this->uploadVideoFile($uploadUrl, $localPath);
      
      // Limpiar archivo temporal si existe
      if ($tempFile && file_exists($tempFile)) {
        @unlink($tempFile);
      }

      return PostResultDTO::success(
        postId: $publishId,
        postUrl: '', // TikTok async, no immediate URL
        rawData: ['status' => 'processing', 'platform' => 'tiktok']
      );
    } catch (\Exception $e) {
      // Limpiar archivo temporal si existe
      if (isset($tempFile) && $tempFile && file_exists($tempFile)) {
        @unlink($tempFile);
      }
      
      return PostResultDTO::failure($e->getMessage());
    }
  }

  /**
   * Download video from URL for TikTok upload
   */
  private function downloadVideoFromUrl(string $url): string
  {
    $tempFile = tempnam(sys_get_temp_dir(), 'tiktok_upload_');
    
    try {
      $response = $this->client->get($url, [
        'sink' => $tempFile,
        'timeout' => 0,
        'read_timeout' => 1800,
        'connect_timeout' => 60,
        'verify' => false,
        'progress' => function ($downloadTotal, $downloadedBytes) {
          if ($downloadTotal > 0) {
            $progress = round(($downloadedBytes / $downloadTotal) * 100, 1);
            if ($progress % 20 == 0 && $progress > 0) {
              Log::info('TikTok download progress', [
                'progress' => "{$progress}%",
                'downloaded_mb' => round($downloadedBytes / 1024 / 1024, 2)
              ]);
            }
          }
        }
      ]);
      
      Log::info('TikTok video downloaded', [
        'size_mb' => round(filesize($tempFile) / 1024 / 1024, 2)
      ]);
      
      return $tempFile;
    } catch (\Exception $e) {
      if (file_exists($tempFile)) {
        @unlink($tempFile);
      }
      throw new \Exception("Failed to download video for TikTok: " . $e->getMessage());
    }
  }

  public function delete(string $postId): bool
  {
    Log::warning('Delete post not supported by TikTok API', ['postId' => $postId]);
    return false;
  }

  public function getMetrics(string $postId): array
  {
    return $this->getPostAnalytics($postId);
  }

  private function validateVideoData(array $data): void
  {
    if (empty($data['video_path']) || !file_exists($data['video_path'])) {
      throw new \Exception('TikTok requires a valid video file path');
    }

    // TikTok constraints (simplified check, real API is stricter)
    $size = filesize($data['video_path']);
    if ($size > 4 * 1024 * 1024 * 1024) { // 4GB limit
      throw new \Exception('Video exceeds TikTok 4GB limit');
    }
  }

  private function initializeUpload(array $data): array
  {
    $response = $this->client->post('https://open.tiktokapis.com/v2/post/publish/video/init/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json; charset=UTF-8',
      ],
      'json' => [
        'post_info' => [
          'title' => mb_substr($data['content'] ?? $data['title'] ?? '', 0, 150), // 150 char limit?
          'privacy_level' => $this->mapPrivacy(
            $data['platform_settings']['tiktok']['privacy'] ?? $data['privacy'] ?? 'public'
          ),
          'disable_duet' => $data['platform_settings']['tiktok']['disable_duet'] ?? false,
          'disable_comment' => $data['platform_settings']['tiktok']['disable_comment'] ?? false,
          'disable_stitch' => $data['platform_settings']['tiktok']['disable_stitch'] ?? false,
        ],
        'source_info' => [
          'source' => 'FILE_UPLOAD',
          'video_size' => filesize($data['video_path']),
          'chunk_size' => filesize($data['video_path']), // Uploading as single chunk for MVP
          'total_chunk_count' => 1,
        ],
      ],
    ]);

    $result = json_decode($response->getBody(), true);

    if (!isset($result['data']['publish_id']) || !isset($result['data']['upload_url'])) {
      Log::error('TikTok Init Failed', ['response' => $result]);
      throw new \Exception('Failed to initialize TikTok video upload: Invalid response');
    }

    return $result['data'];
  }

  private function uploadVideoFile(string $uploadUrl, string $filePath): void
  {
    $fileSize = filesize($filePath);
    $fileSizeMB = round($fileSize / 1024 / 1024, 2);
    
    Log::info('Uploading video to TikTok', [
      'file_size_mb' => $fileSizeMB
    ]);

    $uploadClient = new \GuzzleHttp\Client();

    // Para archivos grandes, subir en chunks
    if ($fileSizeMB > 100) {
      $this->uploadTikTokInChunks($uploadClient, $uploadUrl, $filePath, $fileSize);
    } else {
      // Para archivos pequeños, subir de una vez
      $this->uploadTikTokComplete($uploadClient, $uploadUrl, $filePath, $fileSize);
    }
    
    Log::info('TikTok video upload completed', [
      'file_size_mb' => $fileSizeMB
    ]);
  }

  /**
   * Subir archivo completo a TikTok
   */
  private function uploadTikTokComplete(\GuzzleHttp\Client $client, string $uploadUrl, string $filePath, int $fileSize): void
  {
    $fileStream = fopen($filePath, 'r');
    if (!$fileStream) {
      throw new \Exception('Failed to open video file for reading');
    }

    try {
      $response = $client->put($uploadUrl, [
        'headers' => [
          'Content-Type' => 'video/mp4',
          'Content-Length' => $fileSize,
        ],
        'body' => $fileStream,
        'timeout' => 0,
        'read_timeout' => 3600,
        'connect_timeout' => 60
      ]);

      if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
        throw new \Exception("TikTok upload failed with status {$response->getStatusCode()}");
      }
    } finally {
      if (is_resource($fileStream)) {
        fclose($fileStream);
      }
    }
  }

  /**
   * Subir archivo en chunks a TikTok
   */
  private function uploadTikTokInChunks(\GuzzleHttp\Client $client, string $uploadUrl, string $filePath, int $fileSize): void
  {
    $chunkSize = 1024 * 1024 * 10; // 10MB chunks
    $handle = fopen($filePath, 'r');
    
    if (!$handle) {
      throw new \Exception('Failed to open video file');
    }

    try {
      $offset = 0;
      $chunkNumber = 0;
      $totalChunks = ceil($fileSize / $chunkSize);

      Log::info('TikTok chunked upload starting', [
        'chunk_size_mb' => 10,
        'total_chunks' => $totalChunks
      ]);

      while (!feof($handle)) {
        $chunk = fread($handle, $chunkSize);
        $chunkLength = strlen($chunk);
        
        if ($chunkLength === 0) {
          break;
        }

        $chunkNumber++;
        $endByte = $offset + $chunkLength - 1;
        
        // Subir chunk con reintentos
        $maxRetries = 3;
        $retryCount = 0;
        $uploaded = false;

        while (!$uploaded && $retryCount < $maxRetries) {
          try {
            $response = $client->put($uploadUrl, [
              'headers' => [
                'Content-Type' => 'video/mp4',
                'Content-Length' => $chunkLength,
                'Content-Range' => "bytes {$offset}-{$endByte}/{$fileSize}",
              ],
              'body' => $chunk,
              'timeout' => 600,
              'connect_timeout' => 30
            ]);

            $statusCode = $response->getStatusCode();
            
            if ($statusCode >= 200 && $statusCode < 300) {
              $uploaded = true;
            } else {
              throw new \Exception("Unexpected status code: {$statusCode}");
            }

          } catch (\Exception $e) {
            $retryCount++;
            
            if ($retryCount >= $maxRetries) {
              throw new \Exception("Failed to upload chunk {$chunkNumber} after {$maxRetries} attempts: " . $e->getMessage());
            }
            
            Log::warning('TikTok chunk upload failed, retrying', [
              'chunk' => $chunkNumber,
              'attempt' => $retryCount,
              'error' => $e->getMessage()
            ]);
            
            usleep(500000 * $retryCount);
          }
        }

        $offset += $chunkLength;
        
        // Log progreso cada 10 chunks
        if ($chunkNumber % 10 === 0 || $chunkNumber === $totalChunks) {
          $progress = round(($chunkNumber / $totalChunks) * 100, 1);
          Log::info('TikTok upload progress', [
            'progress' => "{$progress}%",
            'chunk' => "{$chunkNumber}/{$totalChunks}",
            'uploaded_mb' => round($offset / 1024 / 1024, 2)
          ]);
        }
      }

      fclose($handle);

    } catch (\Exception $e) {
      if (is_resource($handle)) {
        fclose($handle);
      }
      
      Log::error('TikTok chunked upload failed', [
        'error' => $e->getMessage()
      ]);
      
      throw $e;
    }
  }

  public function deletePost(string $postId): bool
  {
    // TikTok API V2 does not currently support deleting videos via API for standard integrations
    // We'll return false or throw exception, but to be safe for our system, we fake success or log it.
    Log::warning('Delete post not supported by TikTok API', ['postId' => $postId]);
    return false;
  }

  public function checkVideoStatus(string $publishId): array
  {
    try {
      $this->ensureValidToken();

      // Note: status/fetch endpoint might be different or require correct scope
      // Using documented endpoint: /v2/post/publish/status/fetch/
      $response = $this->client->post('https://open.tiktokapis.com/v2/post/publish/status/fetch/', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Content-Type' => 'application/json',
        ],
        'json' => [
          'publish_id' => $publishId,
        ],
      ]);

      $result = json_decode($response->getBody(), true);
      $status = $result['data']['status'] ?? null;
      // POSSIBILE STATUSES: PUBLISH_COMPLETE, UPLOADING, PROCESSING, FAILED

      if ($status === 'PUBLISH_COMPLETE') {
        return [
          'exists' => true,
          'status' => 'published',
          'uploadStatus' => 'processed',
          // 'url' => ... The API might sadly not return the public URL here easily
        ];
      } elseif ($status === 'FAILED') {
        return [
          'exists' => true,
          'status' => 'failed',
          'rejectionReason' => $result['data']['fail_reason'] ?? 'Unknown error'
        ];
      }

      return [
        'exists' => true,
        'status' => 'processing', // UPLOADING or PROCESSING
      ];
    } catch (\Exception $e) {
      Log::error('TikTok status check failed', ['error' => $e->getMessage()]);
      return ['exists' => false, 'error' => $e->getMessage()];
    }
  }

  public function getAccountInfo(): array
  {
    $this->ensureValidToken();

    $response = $this->client->get('https://open.tiktokapis.com/v2/user/info/', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'query' => [
        'fields' => 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count',
      ],
    ]);

    $data = json_decode($response->getBody(), true);
    $user = $data['data']['user'] ?? [];

    return [
      'id' => $user['open_id'] ?? null,
      'name' => $user['display_name'] ?? null,
      'avatar' => $user['avatar_url'] ?? null,
      'followers' => $user['follower_count'] ?? 0,
      'following' => $user['following_count'] ?? 0,
      'likes' => $user['likes_count'] ?? 0,
      'videos' => $user['video_count'] ?? 0,
    ];
  }

  public function getPostAnalytics(string $postId): array
  {
    // This endpoint requires 'Research API' access usually, standard tiered access
    // might not have it. Implementing defensively.
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
      $this->getAccountInfo();
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }

  // --- Helper Methods ---

  private function mapPrivacy(string $privacy): string
  {
    return match ($privacy) {
      'private' => 'SELF_ONLY',
      'unlisted' => 'FRIENDS_ONLY', // Closest match
      default => 'PUBLIC_TO_EVERYONE',
    };
  }

  private function handleApiError(ClientException $e): void
  {
    $response = $e->hasResponse() ? json_decode($e->getResponse()->getBody(), true) : [];
    $message = $response['error']['message'] ?? $e->getMessage();

    Log::error('TikTok API Error', ['response' => $response]);

    throw new \Exception("TikTok API Error: {$message}");
  }

  /**
   * Get comments for a TikTok post
   * Note: TikTok API has very limited comment access
   *
   * @param string $postId
   * @param int $limit
   * @return array
   */
  public function getPostComments(string $postId, int $limit = 100): array
  {
    // TikTok API doesn't provide comment access in standard API tiers
    Log::info('TikTok getPostComments called but not available', [
      'postId' => $postId,
      'note' => 'Requires Research API access'
    ]);

    return [];
  }
}
