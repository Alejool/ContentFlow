<?php

namespace App\Services\SocialPlatforms;
use Exception;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;


class YouTubeService extends BaseSocialService
{
  public function publishPost(array $data): array
  {
    #TODO: Añade la imagen de miniatura del video subido  
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

      return $this->formatSuccessResponse($response, $isShort);
    } catch (ClientException $e) {
      $this->handleApiError($e);
    } catch (Exception $e) {
      Log::error('YouTube upload failed', ['error' => $e->getMessage()]);
      throw $e;
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
    if (empty($this->accessToken)) {
      throw new \Exception('Access token is missing');
    }

    Log::info('Using access token', [
      'token_preview' => substr($this->accessToken, 0, 20) . '...'
    ]);
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
    $output = shell_exec('which ffprobe 2>/dev/null');
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

    $errorMessage = match ($statusCode) {
      401 => 'Authentication failed. Please reconnect your YouTube account.',
      403 => 'Access forbidden. Check your API quotas and permissions.',
      400 => 'Invalid request. Check video format and metadata.',
      default => "YouTube API error (HTTP {$statusCode})",
    };

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
}
