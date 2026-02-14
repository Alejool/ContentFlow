<?php

namespace App\Services\SocialPlatforms;

use Exception;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;
use App\Models\Publication;
use GuzzleHttp\Client;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;

class YouTubeService extends BaseSocialService
{
  public function publish(SocialPostDTO $post): PostResultDTO
  {
    $this->ensureValidToken();
    $videoPath = $post->mediaPaths[0] ?? null;

    if (!$videoPath) {
      return PostResultDTO::failure('YouTube requires a video file path');
    }

    try {
      $videoFile = $this->downloadVideo($videoPath);

      $publishData = [
        'video_path' => $videoPath, // downloadVideo needs it actually, wait
        'title' => $post->title,
        'content' => $post->content,
        'tags' => $post->hashtags,
        'platform_settings' => $post->platformSettings,
      ];

      $isShort = $this->determineIfShort($videoFile, $publishData);
      if (isset($post->platformSettings['youtube']['type'])) {
        $isShort = $post->platformSettings['youtube']['type'] === 'short';
      }

      $metadata = $this->buildMetadata($publishData, $isShort);
      $response = $this->uploadToYouTube($videoFile, $metadata);

      $thumbnailPath = $post->metadata['thumbnail_path'] ?? null;
      if ($thumbnailPath && !$isShort) {
        $this->setThumbnail($response['id'], $thumbnailPath);
      }

      $formatted = $this->formatSuccessResponse($response, $isShort);

      return PostResultDTO::success(
        postId: $formatted['post_id'],
        postUrl: $formatted['url'],
        rawData: $formatted
      );
    } catch (\Exception $e) {
      return PostResultDTO::failure($e->getMessage());
    }
  }

  public function delete(string $postId): bool
  {
    return $this->deletePost($postId);
  }

  public function getMetrics(string $postId): array
  {
    return $this->getPostAnalytics($postId);
  }

  public function setThumbnail(string $videoId, string $thumbnailPath): void
  {
    $tempThumbnail = $this->downloadVideo($thumbnailPath); // Reuse download logic for generic file download

    try {
      $response = $this->client->post("https://www.googleapis.com/upload/youtube/v3/thumbnails/set", [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Content-Type' => 'image/jpeg', // Ensure content type is correct or detected
        ],
        'query' => [
          'videoId' => $videoId,
          'uploadType' => 'media',
        ],
        'body' => fopen($tempThumbnail, 'r'),
      ]);

      Log::info('Thumbnail uploaded successfully', ['video_id' => $videoId]);
    } catch (\Exception $e) {
      Log::warning('Failed to upload thumbnail', ['video_id' => $videoId, 'error' => $e->getMessage()]);
      // Don't throw, just log warning so video remains published
    } finally {
      if (file_exists($tempThumbnail)) {
        unlink($tempThumbnail);
      }
    }
  }

  private function validateVideoData(array $data): void
  {
    if (empty($data['video_path'])) {
      throw new \Exception('YouTube requires a video file');
    }
  }
  private function downloadVideo(string $videoUrl): string
  {
    $tempFile = tempnam(sys_get_temp_dir(), 'youtube_upload_');

    Log::info('Downloading video', ['temp_file' => $tempFile]);

    try {
      $videoStream = fopen($videoUrl, 'r');
      $tempStream = fopen($tempFile, 'w');

      if ($videoStream === false || $tempStream === false) {
        throw new \Exception('Failed to open video streams');
      }

      stream_copy_to_stream($videoStream, $tempStream);

      fclose($videoStream);
      fclose($tempStream);

      $fileSize = filesize($tempFile);
      Log::info('Video downloaded successfully', [
        'size' => number_format($fileSize / 1024 / 1024, 2) . ' MB'
      ]);

      return $tempFile;
    } catch (\Exception $e) {
      if (file_exists($tempFile)) {
        unlink($tempFile);
      }
      throw new \Exception("Failed to download video: {$e->getMessage()}");
    }
  }

  /**
   * Determina si el video debe ser un Short basado en:
   * 1. Parámetro explícito 'is_short' o 'type'
   * 2. Duración del video (≤ 60 segundos)
   * 3. Dimensiones del video (vertical, aspect ratio 9:16)
   */
  private function determineIfShort(string $videoFile, array $data): bool
  {
    // Opción 1: Parámetro explícito
    if (isset($data['is_short'])) {
      $isShort = (bool) $data['is_short'];
      Log::info('Short status set explicitly', ['is_short' => $isShort]);
      return $isShort;
    }

    if (isset($data['type'])) {
      $isShort = strtolower($data['type']) === 'short';
      Log::info('Short status from type parameter', ['type' => $data['type'], 'is_short' => $isShort]);
      return $isShort;
    }

    // Opción 2: Determinar automáticamente por duración
    try {
      $duration = $this->getVideoDuration($videoFile);
      $isShort = $duration <= 60;

      Log::info('Auto-detected short status', [
        'duration' => $duration,
        'is_short' => $isShort
      ]);

      return $isShort;
    } catch (\Exception $e) {
      Log::warning('Could not determine video duration, defaulting to regular video', [
        'error' => $e->getMessage()
      ]);
      return false;
    }
  }

  /**
   * Obtiene la duración del video en segundos usando getID3 o FFmpeg
   */
  private function getVideoDuration(string $videoFile): float
  {
    // Método 1: Usando getID3 (requiere: composer require james-heinrich/getid3)
    if (class_exists('\getID3')) {
      try {
        $getID3 = new \getID3();
        $fileInfo = $getID3->analyze($videoFile);

        if (isset($fileInfo['playtime_seconds'])) {
          return (float) $fileInfo['playtime_seconds'];
        }
      } catch (\Exception $e) {
        Log::warning('getID3 failed', ['error' => $e->getMessage()]);
      }
    }

    // Método 2: Usando FFmpeg/FFprobe (más confiable)
    if ($this->isFFprobeAvailable()) {
      try {
        $command = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($videoFile);
        $output = shell_exec($command);

        if ($output !== null) {
          return (float) trim($output);
        }
      } catch (\Exception $e) {
        Log::warning('FFprobe failed', ['error' => $e->getMessage()]);
      }
    }

    throw new \Exception('Unable to determine video duration. Install getID3 or FFmpeg.');
  }

  /**
   * Verifica si FFprobe está disponible en el sistema
   */
  private function isFFprobeAvailable(): bool
  {
    $command = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'where ffprobe' : 'which ffprobe 2>/dev/null';
    $output = shell_exec($command);
    return !empty($output);
  }

  /**
   * Construye los metadatos del video, agregando el tag #Shorts si aplica
   */
  private function buildMetadata(array $data, bool $isShort): array
  {
    $title = $data['title'] ?? 'Untitled Video';
    $description = $data['content'] ?? '';
    $tags = $data['tags'] ?? [];

    // Para Shorts, agregar #Shorts al título y descripción
    if ($isShort) {
      // Agregar #Shorts al final del título si no está presente
      if (stripos($title, '#shorts') === false && stripos($title, '#short') === false) {
        $title .= ' #Shorts';
      }

      // Agregar #Shorts a la descripción
      if (stripos($description, '#shorts') === false && stripos($description, '#short') === false) {
        $description .= "\n\n#Shorts";
      }

      // Agregar "shorts" a los tags
      if (!in_array('shorts', array_map('strtolower', $tags))) {
        $tags[] = 'shorts';
      }

      Log::info('Video configured as YouTube Short', [
        'title' => $title,
        'has_shorts_tag' => true
      ]);
    }

    return [
      'snippet' => [
        'title' => $title,
        'description' => trim($description),
        'tags' => $tags,
        'categoryId' => $isShort ? '24' : '22', // 24 = Entertainment, 22 = People & Blogs
      ],
      'status' => [
        'privacyStatus' => $data['privacy'] ?? 'public',
        'selfDeclaredMadeForKids' => false,
      ],
    ];
  }

  private function uploadToYouTube(string $tempFile, array $metadata): array
  {
    try {
      $videoSize = filesize($tempFile);

      Log::info('Initiating YouTube Resumable Upload', [
        'file_size' => number_format($videoSize / 1024 / 1024, 2) . ' MB'
      ]);

      // 1. Initiate the resumable session
      $initResponse = $this->client->post('https://www.googleapis.com/upload/youtube/v3/videos', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'X-Upload-Content-Length' => $videoSize,
          'X-Upload-Content-Type' => 'video/*',
          'Content-Type' => 'application/json; charset=UTF-8',
        ],
        'query' => [
          'part' => 'snippet,status',
          'uploadType' => 'resumable',
        ],
        'json' => $metadata,
      ]);

      if ($initResponse->getStatusCode() !== 200) {
        throw new \Exception("YouTube API failed to initiate resumable upload (Status: {$initResponse->getStatusCode()})");
      }

      $uploadUrl = $initResponse->getHeaderLine('Location');

      if (!$uploadUrl) {
        throw new \Exception("YouTube API did not return an upload URL");
      }

      // 2. Upload the video content using a stream
      Log::info('Streaming video content to YouTube', ['upload_url' => $uploadUrl]);

      $handle = fopen($tempFile, 'r');
      if (!$handle) {
        throw new \Exception('Failed to open temporary video file for streaming');
      }

      $response = $this->client->put($uploadUrl, [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Content-Length' => $videoSize,
          'Content-Type' => 'video/*',
        ],
        'body' => $handle,
        'timeout' => 1200, // 20 minutes for large files
      ]);

      // Ensure handle is closed
      if (is_resource($handle)) {
        fclose($handle);
      }

      // Limpiar archivo temporal
      if (file_exists($tempFile)) {
        unlink($tempFile);
      }

      if ($response->getStatusCode() !== 200 && $response->getStatusCode() !== 201) {
        throw new \Exception("YouTube API returned status {$response->getStatusCode()} during content upload");
      }

      $result = json_decode($response->getBody()->getContents(), true);

      if (!isset($result['id'])) {
        throw new \Exception('YouTube API response missing video ID after resumable upload');
      }

      Log::info('Resumable video upload completed', ['video_id' => $result['id']]);

      return $result;
    } catch (\Exception $e) {
      // Asegurarse de limpiar el archivo temporal
      if (file_exists($tempFile)) {
        unlink($tempFile);
      }
      throw $e;
    }
  }

  private function formatSuccessResponse(array $result, bool $isShort): array
  {
    $videoId = $result['id'];

    // Para Shorts, usar la URL específica de Shorts
    $url = $isShort
      ? "https://www.youtube.com/shorts/{$videoId}"
      : "https://www.youtube.com/watch?v={$videoId}";

    return [
      'success' => true,
      'post_id' => $videoId,
      'platform' => 'youtube',
      'type' => $isShort ? 'short' : 'video',
      'url' => $url,
      'title' => $result['snippet']['title'] ?? null,
      'privacy' => $result['status']['privacyStatus'] ?? null,
    ];
  }

  private function handleApiError(ClientException $e): never
  {
    $statusCode = $e->getResponse()->getStatusCode();
    $responseBody = $e->getResponse()->getBody()->getContents();

    Log::error('YouTube API Error', [
      'status' => $statusCode,
      'response' => $responseBody,
    ]);

    // Try to parse the actual JSON error message from YouTube
    $apiMessage = null;
    try {
      $jsonError = json_decode($responseBody, true);
      $apiMessage = $jsonError['error']['message'] ?? null;
    } catch (\Exception $parseException) {
      // Failed to parse JSON, stick to defaults
    }

    $errorMessage = match ($statusCode) {
      401 => 'Authentication failed. Please reconnect your YouTube account.',
      403 => 'Access forbidden. Check your API quotas and permissions.',
      400 => 'Invalid request. Check video format and metadata.',
      default => "YouTube API error (HTTP {$statusCode})",
    };

    // Use the actual API message if available and meaningful
    if ($apiMessage) {
      // Check for specific error message about exceeded upload limit
      if (str_contains($apiMessage, 'exceeded the number of videos') || str_contains($apiMessage, 'upload limit')) {
        $errorMessage = 'You have reached your daily YouTube upload limit. Please try again in 24 hours.';
      } else {
        // Use the YouTube message directly as it's usually descriptive enough
        $errorMessage = $apiMessage;
      }

      // Throw clean exception without technical Guzzle details
      throw new \Exception($errorMessage);
    }

    // Fallback including technical details if we couldn't parse a clean message
    throw new \Exception("{$errorMessage} Details: {$e->getMessage()}");
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

  public function testToken(): void
  {
    try {
      // Intentar obtener información del canal
      $response = $this->client->get('https://www.googleapis.com/youtube/v3/channels', [
        'headers' => [
          'Authorization' => 'Bearer ' . $this->accessToken,
        ],
        'query' => [
          'part' => 'snippet,contentDetails,statistics',
          'mine' => 'true',
        ],
      ]);

      $result = json_decode($response->getBody(), true);
      Log::info('Token test successful', ['channel' => $result]);
    } catch (\Exception $e) {
      Log::error('Token test failed', [
        'error' => $e->getMessage(),
        'no response'
      ]);
    }
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

  /**
   * Busca una playlist por título y retorna su ID
   */
  public function findPlaylistByName(string $title): ?string
  {
    try {
      $response = $this->client->get('https://www.googleapis.com/youtube/v3/playlists', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'part' => 'snippet,id',
          'mine' => 'true',
          'maxResults' => 50, // Check first 50 playlists
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      if (isset($data['items'])) {
        foreach ($data['items'] as $item) {
          if (strcasecmp($item['snippet']['title'], $title) === 0) {
            return $item['id'];
          }
        }
      }

      return null;
    } catch (\Exception $e) {
      Log::warning('Failed to search playlists', ['error' => $e->getMessage()]);
      return null;
    }
  }

  /**
   * Crea una nueva playlist
   */
  public function createPlaylist(string $title, string $description = '', string $privacy = 'public'): ?string
  {
    try {
      $response = $this->client->post('https://www.googleapis.com/youtube/v3/playlists', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Content-Type' => 'application/json',
        ],
        'query' => [
          'part' => 'snippet,status',
        ],
        'json' => [
          'snippet' => [
            'title' => $title,
            'description' => $description,
          ],
          'status' => [
            'privacyStatus' => $privacy,
          ],
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      Log::info('Created YouTube Playlist', ['title' => $title, 'id' => $data['id'] ?? null]);

      return $data['id'] ?? null;
    } catch (\Exception $e) {
      Log::error('Failed to create playlist', ['error' => $e->getMessage()]);
      return null;
    }
  }

  /**
   * Agrega un video a una playlist
   */
  public function addVideoToPlaylist(string $playlistId, string $videoId): bool
  {
    try {
      $response = $this->client->post('https://www.googleapis.com/youtube/v3/playlistItems', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Content-Type' => 'application/json',
        ],
        'query' => [
          'part' => 'snippet',
        ],
        'json' => [
          'snippet' => [
            'playlistId' => $playlistId,
            'resourceId' => [
              'kind' => 'youtube#video',
              'videoId' => $videoId,
            ],
          ],
        ],
      ]);

      $statusCode = $response->getStatusCode();

      if ($statusCode === 200 || $statusCode === 201) {
        Log::info('Added video to playlist', ['playlist_id' => $playlistId, 'video_id' => $videoId]);
        return true;
      }

      throw new \Exception("YouTube API returned unexpected status code: {$statusCode}");
    } catch (ClientException $e) {
      $message = $e->getMessage();
      if ($e->hasResponse()) {
        $body = json_decode($e->getResponse()->getBody()->getContents(), true);
        $message = $body['error']['message'] ?? $message;
      }
      Log::error('Failed to add video to playlist (ClientException)', [
        'playlist_id' => $playlistId,
        'video_id' => $videoId,
        'error' => $message
      ]);
      throw new \Exception("YouTube Playlist Error: " . $message);
    } catch (\Exception $e) {
      Log::error('Failed to add video to playlist', [
        'playlist_id' => $playlistId,
        'video_id' => $videoId,
        'error' => $e->getMessage()
      ]);
      throw $e;
    }
  }

  /**
   * Elimina un video de YouTube
   */
  public function deletePost(string $postId): bool
  {
    try {
      $this->ensureValidToken();

      Log::info('Attempting to delete YouTube video', ['video_id' => $postId]);

      $response = $this->client->delete("https://www.googleapis.com/youtube/v3/videos", [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Accept' => 'application/json',
        ],
        'query' => [
          'id' => $postId,
        ],
      ]);

      $statusCode = $response->getStatusCode();
      Log::info('YouTube video deletion response', ['video_id' => $postId, 'status' => $statusCode]);

      return $statusCode === 204 || $statusCode === 200;
    } catch (ClientException $e) {
      $responseBody = $e->getResponse()->getBody()->getContents();
      Log::error('YouTube video deletion failed (ClientError)', [
        'video_id' => $postId,
        'status' => $e->getResponse()->getStatusCode(),
        'response' => $responseBody
      ]);
      return false;
    } catch (\Exception $e) {
      Log::error('Failed to delete YouTube video (GeneralError)', [
        'video_id' => $postId,
        'error' => $e->getMessage()
      ]);
      return false;
    }
  }

  /**
   * Checks the current status of a video on YouTube.
   * Returns details about upload status, rejection reasons, and licensing.
   */
  public function checkVideoStatus(string $videoId): array
  {
    try {
      $this->ensureValidToken();

      $response = $this->client->get('https://www.googleapis.com/youtube/v3/videos', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'part' => 'status,contentDetails',
          'id' => $videoId,
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      if (empty($data['items'])) {
        return [
          'exists' => false,
          'status' => 'deleted', // Video not found means it's likely deleted or private/unavailable
        ];
      }

      $item = $data['items'][0];
      $status = $item['status'] ?? [];
      $contentDetails = $item['contentDetails'] ?? [];

      return [
        'exists' => true,
        'uploadStatus' => $status['uploadStatus'] ?? null, // 'processed', 'uploaded', 'rejected', 'failed'
        'privacyStatus' => $status['privacyStatus'] ?? null,
        'rejectionReason' => $status['rejectionReason'] ?? null, // e.g., 'copyright', 'inappropriate', 'duplicate'
        'license' => $status['license'] ?? null,
        'embeddable' => $status['embeddable'] ?? true,
        'publicStatsViewable' => $status['publicStatsViewable'] ?? true,
        // Check for copyright claims if available in contentDetails (regionRestriction often implies issues)
        'regionRestriction' => $contentDetails['regionRestriction'] ?? null,
      ];
    } catch (\Exception $e) {
      Log::error('Failed to check video status', ['video_id' => $videoId, 'error' => $e->getMessage()]);
      // Verify if error is 404
      if ($e instanceof ClientException && $e->getResponse()->getStatusCode() === 404) {
        return ['exists' => false, 'status' => 'not_found'];
      }
      return ['exists' => false, 'error' => $e->getMessage()];
    }
  }

  /**
   * Get comments for a YouTube video
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
      $endpoint = "https://www.googleapis.com/youtube/v3/commentThreads";
      $response = $this->client->get($endpoint, [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'part' => 'snippet',
          'videoId' => $postId,
          'maxResults' => min($limit, 100),
          'order' => 'relevance'
        ]
      ]);

      $data = json_decode($response->getBody(), true);
      $items = $data['items'] ?? [];

      return array_map(function ($item) {
        $snippet = $item['snippet']['topLevelComment']['snippet'] ?? [];
        return [
          'id' => $item['id'] ?? '',
          'author' => $snippet['authorDisplayName'] ?? 'Unknown',
          'text' => $snippet['textDisplay'] ?? '',
          'created_at' => $snippet['publishedAt'] ?? now()->toIso8601String()
        ];
      }, $items);
    } catch (\Exception $e) {
      Log::error('YouTube getPostComments failed', [
        'postId' => $postId,
        'error' => $e->getMessage()
      ]);
      return [];
    }
  }
}
