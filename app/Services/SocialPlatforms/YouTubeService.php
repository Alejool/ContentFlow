<?php

namespace App\Services\SocialPlatforms;

use Exception;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;


class YouTubeService extends BaseSocialService
{
  public function publishPost(array $data): array
  {
    $this->validateVideoData($data);
    $this->ensureValidToken();

    Log::info('Starting YouTube video upload', [
      'title' => $data['title'] ?? 'Untitled',
      'video_url' => $data['video_path'],
      'is_short' => $data['is_short'] ?? false,
      'type' => $data['type'] ?? 'regular'
    ]);

    try {
      $videoFile = $this->downloadVideo($data['video_path']);
      $isShort = $this->determineIfShort($videoFile, $data);
      $metadata = $this->buildMetadata($data, $isShort);
      $response = $this->uploadToYouTube($videoFile, $metadata);

      // Upload thumbnail if provided and not a Short
      if (isset($data['thumbnail_path']) && !$isShort) {
        $this->setThumbnail($response['id'], $data['thumbnail_path']);
      }

      return $this->formatSuccessResponse($response, $isShort);
    } catch (ClientException $e) {
      $this->handleApiError($e);
    } catch (Exception $e) {
      Log::error('YouTube upload failed', ['error' => $e->getMessage()]);
      throw $e;
    }
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

  private function ensureValidToken(): void
  {
    // Check for expiration and refresh if necessary
    if ($this->socialAccount && $this->socialAccount->token_expires_at) {
      // Refresh if expired or expiring soon (within 5 minutes)
      if (now()->addMinutes(5)->gte($this->socialAccount->token_expires_at)) {
        Log::info('Token expired or expiring soon, attempting refresh', ['account_id' => $this->socialAccount->id]);
        try {
          $this->refreshToken();
        } catch (\Exception $e) {
          Log::error('Token refresh failed', ['error' => $e->getMessage()]);
          // Continue execution? Maybe token is still barely valid or we rely on catch later.
          // But usually we should throw if we know it's expired.
          if (now()->gte($this->socialAccount->token_expires_at)) {
            throw $e;
          }
        }
      }
    }

    if (empty($this->accessToken)) {
      throw new \Exception('Access token is missing');
    }

    Log::info('Using access token', [
      'token_preview' => substr($this->accessToken, 0, 20) . '...'
    ]);
  }

  private function refreshToken(): void
  {
    if (!$this->socialAccount || !$this->socialAccount->refresh_token) {
      throw new \Exception('Cannot refresh token: Missing refresh token');
    }

    try {
      $client = new \GuzzleHttp\Client();
      $response = $client->post('https://oauth2.googleapis.com/token', [
        'form_params' => [
          'client_id' => config('services.google.client_id'),
          'client_secret' => config('services.google.client_secret'),
          'refresh_token' => $this->socialAccount->refresh_token,
          'grant_type' => 'refresh_token',
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      if (isset($data['access_token'])) {
        $this->accessToken = $data['access_token'];
        $this->socialAccount->update([
          'access_token' => $data['access_token'],
          'token_expires_at' => now()->addSeconds($data['expires_in']),
        ]);

        // Update client with new token
        $this->client = new \GuzzleHttp\Client([
          'timeout' => 30,
          'connect_timeout' => 10,
        ]);

        Log::info('Token refreshed successfully');
      } else {
        throw new \Exception('Failed to refresh token: No access_token in response');
      }
    } catch (\Exception $e) {
      Log::error('Refresh token request failed', ['error' => $e->getMessage()]);
      throw $e;
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

  private string $currentBoundary;

  private function uploadToYouTube(string $tempFile, array $metadata): array
  {
    try {
      $body = $this->buildMultipartBody($tempFile, $metadata);
      $boundary = $this->currentBoundary;

      Log::info('Uploading to YouTube API', [
        'body_size' => number_format(strlen($body) / 1024 / 1024, 2) . ' MB'
      ]);

      $response = $this->client->post('https://www.googleapis.com/upload/youtube/v3/videos', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
          'Content-Type' => "multipart/related; boundary={$boundary}",
          'Content-Length' => strlen($body),
        ],
        'query' => [
          'part' => 'snippet,status',
          'uploadType' => 'multipart',
        ],
        'body' => $body,
        'timeout' => 600, // 10 minutos para videos grandes
      ]);

      // Limpiar archivo temporal
      if (file_exists($tempFile)) {
        unlink($tempFile);
      }

      if ($response->getStatusCode() !== 200) {
        throw new \Exception("YouTube API returned status {$response->getStatusCode()}");
      }

      $result = json_decode($response->getBody()->getContents(), true);

      if (!isset($result['id'])) {
        throw new \Exception('YouTube API response missing video ID');
      }

      Log::info('Video uploaded successfully', ['video_id' => $result['id']]);

      return $result;
    } catch (\Exception $e) {
      // Asegurarse de limpiar el archivo temporal
      if (file_exists($tempFile)) {
        unlink($tempFile);
      }
      throw $e;
    }
  }

  private function buildMultipartBody(string $tempFile, array $metadata): string
  {
    $this->currentBoundary = uniqid('youtube_boundary_');
    $boundary = $this->currentBoundary;

    $delimiter = "\r\n--{$boundary}\r\n";
    $closeDelimiter = "\r\n--{$boundary}--";

    // Parte 1: Metadata JSON
    $metadataPart = $delimiter;
    $metadataPart .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    $metadataPart .= json_encode($metadata);

    // Parte 2: Video content
    $videoPart = $delimiter;
    $videoPart .= "Content-Type: video/*\r\n\r\n";

    $videoContent = file_get_contents($tempFile);

    if ($videoContent === false) {
      throw new \Exception('Failed to read video file');
    }

    return $metadataPart . $videoPart . $videoContent . $closeDelimiter;
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

  private function handleApiError(\GuzzleHttp\Exception\ClientException $e): never
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
    } catch (\GuzzleHttp\Exception\ClientException $e) {
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
      // YouTube API DELETE video
      $this->client->delete('https://www.googleapis.com/youtube/v3/videos', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'id' => $postId,
        ],
      ]);

      Log::info('Deleted YouTube video', ['video_id' => $postId]);
      return true;
    } catch (\Exception $e) {
      Log::error('Failed to delete YouTube video', ['video_id' => $postId, 'error' => $e->getMessage()]);
      return false;
    }
  }
}
