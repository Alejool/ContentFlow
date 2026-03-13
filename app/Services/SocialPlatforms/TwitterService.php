<?php

namespace App\Services\SocialPlatforms;

use App\Helpers\LogHelper;
use GuzzleHttp\Exception\ClientException;
use League\OAuth1\Client\Server\Twitter;
use League\OAuth1\Client\Credentials\TokenCredentials;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Storage;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;
use App\Models\Social\SocialAccount;

class TwitterService extends BaseSocialService
{
  public function publish(SocialPostDTO $post): PostResultDTO
  {
    $this->ensureValidToken();
    $mediaIds = [];
    $rawPath = $post->mediaPaths[0] ?? null;

    try {
      if ($rawPath) {
        $resolvedUrl = $this->resolveUrl($rawPath);
        $mediaPath = $this->downloadMedia($resolvedUrl);

        try {
          $mimeType = mime_content_type($mediaPath);
          $mediaCategory = $this->getMediaCategory($mimeType);
          $fileSize = filesize($mediaPath);

          if ($mediaCategory === 'tweet_video' || $fileSize > 5 * 1024 * 1024) {
            $mediaId = $this->uploadLargeMediaV2($mediaPath, $mimeType, $mediaCategory);
            if ($mediaCategory === 'tweet_video') {
              $this->checkMediaStatusV2($mediaId);
            }
          } else {
            $mediaId = $this->uploadMediaV2($mediaPath, $mediaCategory);
          }
          $mediaIds[] = $mediaId;
        } finally {
          if (file_exists($mediaPath)) unlink($mediaPath);
        }
      }

      $content = $post->content;
      $platformSettings = $post->platformSettings['twitter'] ?? [];
      $isPoll = ($platformSettings['type'] ?? '') === 'poll';

      if ($isPoll) {
        $pollResult = $this->handlePoll($content, $platformSettings);
        if ($pollResult) return $pollResult;
      }

      $isThread = ($platformSettings['type'] ?? '') === 'thread';
      if ($isThread) {
        $chunks = $this->splitText($content);
        if (count($chunks) > 1) {
          $threadResult = $this->publishThread($chunks, $mediaIds);
          return PostResultDTO::success($threadResult['post_id'], $threadResult['url']);
        }
      }

      $tweetData = ['text' => mb_substr($content, 0, 280)];
      if (!empty($mediaIds)) $tweetData['media'] = ['media_ids' => $mediaIds];

      $result = $this->sendTweetWithRetry($tweetData);
      return PostResultDTO::success($result['post_id'], $result['url']);
    } catch (\Exception $e) {
      return PostResultDTO::failure($e->getMessage());
    }
  }

  private function handlePoll(string $content, array $settings): ?PostResultDTO
  {
    $pollOptions = array_filter($settings['poll_options'] ?? [], fn($opt) => !empty(trim($opt)));
    if (count($pollOptions) >= 2) {
      // Handle both minutes (legacy) and hours (new format)
      $durationHours = $settings['poll_duration_hours'] ?? ($settings['poll_duration'] ?? 1440) / 60;
      $durationMinutes = (int)($durationHours * 60);
      
      // Twitter API limits: 5 minutes to 10080 minutes (7 days)
      $durationMinutes = max(5, min(10080, $durationMinutes));
      
      $tweetData = [
        'text' => $content,
        'poll' => [
          'options' => array_values($pollOptions),
          'duration_minutes' => $durationMinutes
        ]
      ];
      $result = $this->sendTweetWithRetry($tweetData);
      return PostResultDTO::success($result['post_id'], $result['url']);
    }
    return null;
  }

  public function delete(string $postId): bool
  {
    $this->ensureValidToken();
    try {
      $response = $this->client->delete("https://api.twitter.com/2/tweets/{$postId}", [
        'headers' => ['Authorization' => "Bearer {$this->accessToken}"]
      ]);
      return $response->getStatusCode() === 200;
    } catch (\Exception $e) {
      return false;
    }
  }

  public function getMetrics(string $postId): array
  {
    return $this->getPostAnalytics($postId);
  }

  /**
   * Publish a thread of tweets
   */
  private function publishThread(array $chunks, array $mediaIds): array
  {
    $replyToId = null;
    $firstPostResult = [];

    foreach ($chunks as $index => $chunk) {
      $tweetData = ['text' => $chunk];

      // Attach media only to the first tweet
      if ($index === 0 && !empty($mediaIds)) {
        $tweetData['media'] = ['media_ids' => $mediaIds];
      }

      // If not the first tweet, reply to the previous one
      if ($replyToId) {
        $tweetData['reply'] = ['in_reply_to_tweet_id' => $replyToId];
      }

      try {
        // We handle token refresh in sendTweet wrapper or here?
        // sendTweet doesn't handle refresh internally, acts as low-level.
        // But publishPost logic had the retry. We should duplicate retry logic or make sendTweet robust.
        // For simplicity, let's assume valid token or let one-level retry happen if we refactored.
        // Since we didn't refactor sendTweet to retry, let's wrap this call.

        $result = $this->sendTweetWithRetry($tweetData);

        $replyToId = $result['post_id'];

        if ($index === 0) {
          $firstPostResult = $result;
        }

        // Add a small delay to avoid rate limits / ordering issues
        usleep(500000); // 0.5s

      } catch (\Exception $e) {
        LogHelper::social('error', 'Failed to publish thread segment', [
          'index' => $index,
          'account_id' => $this->socialAccount->id,
          'error' => $e->getMessage()
        ]);
        // If the first one failed, the whole thing fails.
        // If a middle one fails, we have a partial thread.
        throw new \Exception("Thread publication failed at segment " . ($index + 1) . ": " . $e->getMessage());
      }
    }

    return $firstPostResult;
  }

  /**
   * Split text into 280-char chunks (safe method)
   */
  private function splitText(string $text, int $maxLength = 280): array
  {
    $text = trim($text);
    if (mb_strlen($text) <= $maxLength) {
      return [$text];
    }

    $chunks = [];
    $words = explode(' ', $text);
    $currentChunk = '';

    foreach ($words as $word) {
      // Check if adding this word (plus space) exceeds limit
      // +1 for space if chunk not empty
      $space = $currentChunk === '' ? '' : ' ';

      if (mb_strlen($currentChunk . $space . $word) <= $maxLength) {
        $currentChunk .= $space . $word;
      } else {
        // If a single word is massive (longer than limit), force split?
        // Twitter handles long URLs by shortening, but long plain words... rare.
        // Let's simple push current chunk and start new.
        if (!empty($currentChunk)) {
          $chunks[] = $currentChunk;
        }
        $currentChunk = $word;

        // Handle case where $word itself is > maxLength (unlikely but possible)
        if (mb_strlen($currentChunk) > $maxLength) {
          $chunks[] = mb_substr($currentChunk, 0, $maxLength);
          $currentChunk = mb_substr($currentChunk, $maxLength); // Overflow to next
        }
      }
    }

    if (!empty($currentChunk)) {
      $chunks[] = $currentChunk;
    }

    return $chunks;
  }

  /**
   * Helper to send tweet with a single retry on 401
   */
  private function sendTweetWithRetry(array $tweetData): array
  {
    try {
      return $this->sendTweet($tweetData);
    } catch (ClientException $e) {
      $statusCode = $e->getResponse()->getStatusCode();
      
      if ($statusCode === 401) {
        LogHelper::social('twitter.token_expired_refreshing', ['account_id' => $this->socialAccount?->id]);
        $this->refreshToken();
        return $this->sendTweet($tweetData);
      }
      
      // Extract user-friendly error message from Twitter API response
      $errorMessage = $this->extractTwitterErrorMessage($e);
      throw new \Exception($errorMessage);
    }
  }
  
  private function extractTwitterErrorMessage(ClientException $e): string
  {
    try {
      $responseBody = $e->getResponse()->getBody()->getContents();
      $errorData = json_decode($responseBody, true);
      
      // Twitter API v2 error format
      if (isset($errorData['detail'])) {
        $detail = $errorData['detail'];
        
        // Map common Twitter errors to user-friendly messages
        if (str_contains($detail, 'not allowed to post a video longer than')) {
          return 'Tu cuenta de Twitter no permite publicar videos de más de 2 minutos. Necesitas Twitter Blue o verificación para videos largos.';
        }
        
        if (str_contains($detail, 'media size')) {
          return 'El video es demasiado grande para Twitter. Tamaño máximo: 512 MB.';
        }
        
        if (str_contains($detail, 'suspended')) {
          return 'Tu cuenta de Twitter está suspendida. Contacta con el soporte de Twitter.';
        }
        
        if (str_contains($detail, 'rate limit')) {
          return 'Has excedido el límite de publicaciones de Twitter. Intenta más tarde.';
        }
        
        // Return the original detail if no specific mapping
        return $detail;
      }
      
      // Twitter API v1.1 error format
      if (isset($errorData['errors']) && is_array($errorData['errors'])) {
        $errors = array_map(fn($err) => $err['message'] ?? 'Error desconocido', $errorData['errors']);
        return implode('. ', $errors);
      }
      
      // Fallback to original exception message
      return $e->getMessage();
    } catch (\Exception $parseError) {
      // If we can't parse the error, return the original exception message
      return $e->getMessage();
    }
  }

  /**
   * Helper to send tweet (low-level)
   */
  private function sendTweet(array $tweetData): array
  {
    $response = $this->client->post('https://api.twitter.com/2/tweets', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
        'Content-Type' => 'application/json',
      ],
      'json' => $tweetData,
    ]);

    $result = json_decode($response->getBody(), true);

    if (!isset($result['data']['id'])) {
      throw new \Exception('No tweet ID returned: ' . json_encode($result));
    }

    return [
      'success' => true,
      'post_id' => $result['data']['id'],
      'platform' => 'twitter',
      'url' => "https://twitter.com/i/web/status/{$result['data']['id']}",
    ];
  }

  /**
   * upload media (API v2 / v1.1 Hybrid)
   */
  private function uploadMediaV2(string $mediaPath, string $mediaCategory = 'tweet_image'): string
  {
    // Check for OAuth 1.0a credentials in metadata
    $accountInfo = $this->getAccountInfoFromDb();
    $oauthToken = $accountInfo['account_metadata']['oauth1_token'] ?? null;
    $oauthSecret = $accountInfo['account_metadata']['secret'] ?? null;

    LogHelper::social('twitter.v1_creds_check', [
      'has_token' => !empty($oauthToken),
      'has_secret' => !empty($oauthSecret),
      'token_preview' => substr($oauthToken ?? '', 0, 5) . '...',
      'account_id' => $accountInfo['id'] ?? 'unknown'
    ]);

    if ($oauthToken && $oauthSecret) {
      // Use League\OAuth1 + Guzzle for robust upload (Bypass abraham/twitteroauth & SSL issues) v1

      $server = new Twitter([
        'identifier' => config('services.twitter.consumer_key'),
        'secret' => config('services.twitter.consumer_secret'),
        'callback_uri' => '',
      ]);

      $tokenCredentials = new TokenCredentials();
      $tokenCredentials->setIdentifier($oauthToken);
      $tokenCredentials->setSecret($oauthSecret);

      $uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

      $attempts = 0;
      $maxAttempts = 3;
      $lastException = null;

      while ($attempts < $maxAttempts) {
        try {
          // Generate Headers
          $headers = $server->getHeaders($tokenCredentials, 'POST', $uploadUrl);

          // Custom Guzzle Client (SSL Bypass for Dev)
          $clientOptions = [
            'verify' => config('app.debug') ? false : true,
            'connect_timeout' => 30,
            'timeout' => 90,
          ];
          $uploadClient = new Client($clientOptions);

          $response = $uploadClient->post($uploadUrl, [
            'headers' => array_merge($headers, ['Authorization' => $headers['Authorization']]),
            'multipart' => [
              [
                'name' => 'media',
                'contents' => fopen($mediaPath, 'r')
              ]
            ]
          ]);

          $body = (string)$response->getBody();
          $media = json_decode($body);

          if (isset($media->media_id_string)) {
            return $media->media_id_string;
          }

          // Log failure
          LogHelper::social('error', 'Twitter V1 League Upload Failed', [
            'account_id' => $this->socialAccount->id,
            'body' => $body,
            'status' => $response->getStatusCode()
          ]);

          if (isset($media->errors)) {
            throw new \Exception('Twitter V1 Error: ' . json_encode($media->errors));
          }
          throw new \Exception('Twitter V1 Error Raw: ' . $body);
        } catch (\Throwable $e) {
          $lastException = $e;
          LogHelper::social('twitter.v1_upload_retry', ['attempt' => ($attempts + 1), 'error' => $e->getMessage()]);
          $attempts++;
          sleep(2);
        }
      }

      $finalError = $lastException ? $lastException->getMessage() : 'Unknown V1 Error';
      throw new \Exception("Twitter Auth V1 Failed. Please reconnect your account. Details: " . $finalError);
    }

    // Fallback: Use OAuth 2.0 Bearer Token (Existing Logic)
    // Note: This often fails for media on some endpoints but we keep as fallback
    $response = $this->client->post('https://upload.twitter.com/1.1/media/upload.json', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'multipart' => [
        [
          'name' => 'media',
          'contents' => fopen($mediaPath, 'r'),
        ],
        [
          'name' => 'media_category',
          'contents' => $mediaCategory,
        ],
      ],
    ]);

    LogHelper::api('twitter.v2_media_upload_response', ['body' => (string)$response->getBody()]);

    $result = json_decode($response->getBody(), true);

    if (!isset($result['media_id_string'])) {
      $errorMsg = $result['error'] ?? json_encode($result);
      throw new \Exception('Media upload failed: ' . $errorMsg);
    }

    return $result['media_id_string'];
  }

  /**
   * Helper to get fresh account info from DB (since construct might have stale data)
   */
  private function getAccountInfoFromDb(): array
  {
    // Use the socialAccount property from BaseSocialService if available
    if ($this->socialAccount) {
      return $this->socialAccount->toArray();
    }
    
    // Fallback: query by access token
    $account = SocialAccount::where('access_token', $this->accessToken)->first();
    return $account ? $account->toArray() : [];
  }

  /**
   * Subida por fragmentos para videos/archivos grandes (API v2 compatible)
   */
  /**
   * Subida por fragmentos para videos/archivos grandes (API v2 / v1.1 Hybrid)
   */
  private function uploadLargeMediaV2(string $mediaPath, string $mimeType, string $category): string
  {
    $fileSize = filesize($mediaPath);
    
    LogHelper::social('twitter.large_media_upload_starting', [
      'file_size_mb' => round($fileSize / 1024 / 1024, 2),
      'category' => $category,
      'has_social_account' => $this->socialAccount !== null,
      'social_account_id' => $this->socialAccount?->id
    ]);
    
    // Check for OAuth 1.0a credentials in metadata
    $accountInfo = $this->getAccountInfoFromDb();
    $oauthToken = $accountInfo['account_metadata']['oauth1_token'] ?? null;
    $oauthSecret = $accountInfo['account_metadata']['secret'] ?? null;

    LogHelper::social('twitter.oauth_credentials_check', [
      'has_account_info' => !empty($accountInfo),
      'has_metadata' => isset($accountInfo['account_metadata']),
      'has_oauth1_token' => !empty($oauthToken),
      'has_secret' => !empty($oauthSecret),
      'account_id' => $accountInfo['id'] ?? null
    ]);

    if ($oauthToken && $oauthSecret) {
      // Use League\OAuth1 + Guzzle for manual Chunked Upload

      $server = new Twitter([
        'identifier' => config('services.twitter.consumer_key'),
        'secret' => config('services.twitter.consumer_secret'),
        'callback_uri' => '',
      ]);
      $tokenCredentials = new TokenCredentials();
      $tokenCredentials->setIdentifier($oauthToken);
      $tokenCredentials->setSecret($oauthSecret);

      $uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

      // Custom Client (SSL Bypass)
      $clientOptions = [
        'verify' => config('app.debug') ? false : true,
        'connect_timeout' => 60,
        'timeout' => 0, // Sin timeout para streaming
        'read_timeout' => 1800
      ];
      $customClient = new Client($clientOptions);

      try {
        $initHeaders = $server->getHeaders($tokenCredentials, 'POST', $uploadUrl, [
          'command' => 'INIT',
          'total_bytes' => $fileSize,
          'media_type' => $mimeType,
          'media_category' => $category
        ]);

        $initResponse = $customClient->post($uploadUrl, [
          'headers' => array_merge($initHeaders, ['Authorization' => $initHeaders['Authorization']]),
          'form_params' => [
            'command' => 'INIT',
            'total_bytes' => $fileSize,
            'media_type' => $mimeType,
            'media_category' => $category
          ]
        ]);
        $initData = json_decode($initResponse->getBody(), true);
        if (!isset($initData['media_id_string'])) throw new \Exception('V1 INIT Failed: ' . ($initData['error'] ?? json_encode($initData)));
        $mediaId = $initData['media_id_string'];
        
        LogHelper::social('twitter.upload_initialized', ['media_id' => $mediaId]);

        $chunkSize = 2 * 1024 * 1024;
        $handle = fopen($mediaPath, 'rb');
        $segmentIndex = 0;
        $uploadedBytes = 0;
        
        while (!feof($handle)) {
          $chunk = fread($handle, $chunkSize);
          if (!$chunk) break;

          $appendHeaders = $server->getHeaders($tokenCredentials, 'POST', $uploadUrl);

          $customClient->post($uploadUrl, [
            'headers' => array_merge($appendHeaders, ['Authorization' => $appendHeaders['Authorization']]),
            'multipart' => [
              ['name' => 'command', 'contents' => 'APPEND'],
              ['name' => 'media_id', 'contents' => $mediaId],
              ['name' => 'segment_index', 'contents' => $segmentIndex],
              ['name' => 'media', 'contents' => $chunk]
            ]
          ]);
          
          $uploadedBytes += strlen($chunk);
          $progress = round(($uploadedBytes / $fileSize) * 100, 1);
          
          if ($segmentIndex % 5 == 0) { // Log cada 5 chunks
            LogHelper::social('twitter.upload_progress', [
              'progress' => "{$progress}%",
              'uploaded_mb' => round($uploadedBytes / 1024 / 1024, 2)
            ]);
          }
          
          $segmentIndex++;
        }
        fclose($handle);
        
        LogHelper::social('twitter.upload_chunks_completed', ['segments' => $segmentIndex]);

        $finHeaders = $server->getHeaders($tokenCredentials, 'POST', $uploadUrl, [
          'command' => 'FINALIZE',
          'media_id' => $mediaId
        ]);
        $finResponse = $customClient->post($uploadUrl, [
          'headers' => array_merge($finHeaders, ['Authorization' => $finHeaders['Authorization']]),
          'form_params' => ['command' => 'FINALIZE', 'media_id' => $mediaId]
        ]);
        $finData = json_decode($finResponse->getBody(), true);

        if (isset($finData['media_id_string'])) {
          LogHelper::social('twitter.upload_completed', ['media_id' => $finData['media_id_string']]);
          return $finData['media_id_string'];
        }
        throw new \Exception('V1 FINALIZE Failed: ' . json_encode($finData));
      } catch (\Throwable $e) {
        LogHelper::socialError('twitter.v1_chunked_upload_failed', $e->getMessage(), ['error' => $e->getMessage()]);
        throw new \Exception("Twitter Auth V1 Video Upload Failed. Details: " . $e->getMessage());
      }
    }

    // OAuth 2.0 flow - Note: Twitter API v1.1 media upload requires OAuth 1.0a for videos
    if ($category === 'tweet_video') {
      throw new \Exception('Video uploads require OAuth 1.0a authentication. Please reconnect your Twitter account with proper credentials.');
    }
    
    try {
      $initResponse = $this->client->post('https://upload.twitter.com/1.1/media/upload.json', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'form_params' => [
          'command' => 'INIT',
          'total_bytes' => $fileSize,
          'media_type' => $mimeType,
          'media_category' => $category,
        ],
        'timeout' => 60
      ]);
    } catch (ClientException $e) {
      if ($e->getResponse()->getStatusCode() === 403) {
        throw new \Exception('Twitter API returned 403 Forbidden. Video/large media uploads require OAuth 1.0a authentication. Please reconnect your Twitter account.');
      }
      throw $e;
    }

    $initData = json_decode($initResponse->getBody(), true);

    if (!isset($initData['media_id_string'])) {
      $errorMsg = $initData['error'] ?? json_encode($initData);
      throw new \Exception('INIT failed: ' . $errorMsg);
    }

    $mediaId = $initData['media_id_string'];
    LogHelper::social('twitter.upload_initialized_oauth2', ['media_id' => $mediaId]);
    
    $chunkSize = 2 * 1024 * 1024;
    $handle = fopen($mediaPath, 'rb');
    $segmentIndex = 0;
    $uploadedBytes = 0;

    try {
      while (!feof($handle)) {
        $chunk = fread($handle, $chunkSize);
        if (!$chunk) break;

        $this->client->post('https://upload.twitter.com/1.1/media/upload.json', [
          'headers' => [
            'Authorization' => "Bearer {$this->accessToken}",
          ],
          'multipart' => [
            ['name' => 'command', 'contents' => 'APPEND'],
            ['name' => 'media_id', 'contents' => $mediaId],
            ['name' => 'segment_index', 'contents' => $segmentIndex],
            ['name' => 'media', 'contents' => $chunk],
          ],
          'timeout' => 300
        ]);

        $uploadedBytes += strlen($chunk);
        $progress = round(($uploadedBytes / $fileSize) * 100, 1);
        
        if ($segmentIndex % 5 == 0) {
          LogHelper::social('twitter.upload_progress', [
            'progress' => "{$progress}%",
            'uploaded_mb' => round($uploadedBytes / 1024 / 1024, 2)
          ]);
        }
        
        $segmentIndex++;
      }
    } finally {
      if (is_resource($handle)) {
        fclose($handle);
      }
    }
    
    LogHelper::social('twitter.upload_chunks_completed', ['segments' => $segmentIndex]);

    $finalizeResponse = $this->client->post('https://upload.twitter.com/1.1/media/upload.json', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'form_params' => [
        'command' => 'FINALIZE',
        'media_id' => $mediaId,
      ],
      'timeout' => 120
    ]);

    $finalizeData = json_decode($finalizeResponse->getBody(), true);

    if (!isset($finalizeData['media_id_string'])) {
      $errorMsg = $finalizeData['error'] ?? json_encode($finalizeData);
      throw new \Exception('FINALIZE failed: ' . $errorMsg);
    }

    LogHelper::social('twitter.upload_completed', ['media_id' => $finalizeData['media_id_string']]);
    return $finalizeData['media_id_string'];
  }

  /**
   * verify media status v2 (videos)
   */
  private function checkMediaStatusV2(string $mediaId): void
  {
    $attempts = 0;
    $maxAttempts = 30; // since 30 * 2 = 60 seconds

    // Check for V1 credentials
    $accountInfo = $this->getAccountInfoFromDb();
    $oauthToken = $accountInfo['account_metadata']['oauth1_token'] ?? null;
    $oauthSecret = $accountInfo['account_metadata']['secret'] ?? null;

    // Helper for V1 Request
    $server = null;
    $tokenCredentials = null;

    if ($oauthToken && $oauthSecret) {
      $server = new Twitter([
        'identifier' => config('services.twitter.consumer_key'),
        'secret' => config('services.twitter.consumer_secret'),
        'callback_uri' => '',
      ]);
      $tokenCredentials = new TokenCredentials();
      $tokenCredentials->setIdentifier($oauthToken);
      $tokenCredentials->setSecret($oauthSecret);
    }

    $url = 'https://upload.twitter.com/1.1/media/upload.json';
    $clientOptions = [
      'verify' => config('app.debug') ? false : true,
      'connect_timeout' => 30,
      'timeout' => 30,
    ];
    $customClient = new Client($clientOptions);

    do {
      if ($server && $tokenCredentials) {
        // V1 Request
        $queryParams = ['command' => 'STATUS', 'media_id' => $mediaId];
        $headers = $server->getHeaders($tokenCredentials, 'GET', $url, $queryParams);

        $response = $customClient->get($url, [
          'headers' => array_merge($headers, ['Authorization' => $headers['Authorization']]),
          'query' => $queryParams
        ]);
      } else {
        // V2 Fallback
        $response = $this->client->get($url, [
          'headers' => [
            'Authorization' => "Bearer {$this->accessToken}",
          ],
          'query' => [
            'command' => 'STATUS',
            'media_id' => $mediaId,
          ],
        ]);
      }

      $status = json_decode($response->getBody(), true);
      $processingInfo = $status['processing_info'] ?? null;

      if (!$processingInfo || $processingInfo['state'] === 'succeeded') {
        return;
      }

      if ($processingInfo['state'] === 'failed') {
        $errorMsg = $processingInfo['error']['message'] ?? 'Error desconocido';
        throw new \Exception('Video processing failed: ' . $errorMsg);
      }

      // sleep 2 seconds
      $checkAfter = $processingInfo['check_after_secs'] ?? 2;
      sleep($checkAfter);

      $attempts++;
    } while ($attempts < $maxAttempts);

    throw new \Exception('Video processing timed out after ' . ($maxAttempts * 2) . ' seconds');
  }

  /**
   * determine media category based on MIME type
   */
  private function getMediaCategory(string $mimeType): string
  {
    if (str_contains($mimeType, 'video')) {
      return 'tweet_video';
    }
    if (str_contains($mimeType, 'gif')) {
      return 'tweet_gif';
    }
    return 'tweet_image';
  }

  /**
   * resolve URL if it is a relative path from S3
   */
  private function resolveUrl(string $path): string
  {
    if (str_starts_with($path, 'http')) {
      return $path;
    }
    /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
    $disk = Storage::disk('s3');
    return $disk->url($path);
  }

  /**
   * download media
   */
  private function downloadMedia(string $url): string
  {
    $tempFile = tempnam(sys_get_temp_dir(), 'twitter_media_');
    
    Log::info('Twitter: Downloading media', ['url' => $url]);
    
    try {
      $this->client->get($url, [
        'sink' => $tempFile,
        'timeout' => 0,
        'read_timeout' => 600, // 10 minutos
        'connect_timeout' => 60,
        'verify' => false
      ]);
      
      $fileSizeMB = round(filesize($tempFile) / 1024 / 1024, 2);
      LogHelper::social('twitter.media_downloaded', ['size_mb' => $fileSizeMB]);
      
      return $tempFile;
    } catch (\Exception $e) {
      if (file_exists($tempFile)) {
        @unlink($tempFile);
      }
      
      LogHelper::socialError('twitter.media_download_failed', $e->getMessage(), [
        'url' => $url,
        'error' => $e->getMessage()
      ]);
      
      throw new \Exception("Failed to download media for Twitter: " . $e->getMessage());
    }
  }

  /**
   * get account info
   */
  public function getAccountInfo(): array
  {
    $this->ensureValidToken();

    $request = function () {
      return $this->client->get('https://api.twitter.com/2/users/me', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'user.fields' => 'id,name,username,public_metrics,profile_image_url',
        ],
      ]);
    };

    try {
      $response = $request();
    } catch (ClientException $e) {
      if ($e->getResponse()->getStatusCode() === 401) {
        $this->refreshToken();
        $response = $request();
      } else {
        throw $e;
      }
    }

    $data = json_decode($response->getBody(), true);

    if (!isset($data['data'])) {
      throw new \Exception('No user data returned: ' . json_encode($data));
    }

    return $data['data'];
  }

  /**
   * get post analytics
   */
  public function getPostAnalytics(string $postId): array
  {
    $this->ensureValidToken();

    try {
      $response = $this->client->get("https://api.twitter.com/2/tweets/{$postId}", [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'tweet.fields' => 'public_metrics',
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      if (isset($data['data']['public_metrics'])) {
        $metrics = $data['data']['public_metrics'];

        return [
          'likes' => $metrics['like_count'] ?? 0,
          'retweets' => $metrics['retweet_count'] ?? 0,
          'replies' => $metrics['reply_count'] ?? 0,
          'quotes' => $metrics['quote_count'] ?? 0,
          'impressions' => $metrics['impression_count'] ?? 0,
        ];
      }
    } catch (\Exception $e) {
      LogHelper::social('twitter.analytics_error', ['post_id' => $postId, 'error' => $e->getMessage()]);
    }

    return [
      'likes' => 0,
      'retweets' => 0,
      'replies' => 0,
      'quotes' => 0,
      'impressions' => 0,
    ];
  }

  /**
   * valid the credentials
   */
  public function validateCredentials(): bool
  {
    $this->ensureValidToken();

    try {
      $this->client->get('https://api.twitter.com/2/users/me', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
      ]);
      return true;
    } catch (\Exception $e) {
      LogHelper::socialError('twitter.validate_credentials_failed', $e->getMessage(), ['error' => $e->getMessage()]);
      return false;
    }
  }
  /**
   * Delete a tweet
   */
  public function deletePost(string $postId): bool
  {
    $this->ensureValidToken();

    $request = function () use ($postId) {
      return $this->client->delete("https://api.twitter.com/2/tweets/{$postId}", [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
      ]);
    };

    try {
      $response = $request();
    } catch (ClientException $e) {
      if ($e->getResponse()->getStatusCode() === 401) {
        $this->refreshToken();
        try {
          $response = $request();
        } catch (\Exception $retryError) {
          LogHelper::socialError('twitter.delete_post_retry_failed', $retryError->getMessage(), ['post_id' => $postId, 'error' => $retryError->getMessage()]);
          return false;
        }
      } else {
        LogHelper::socialError('twitter.delete_post_error', $e->getMessage(), ['post_id' => $postId, 'error' => $e->getMessage()]);
        return false;
      }
    }

    $data = json_decode($response->getBody(), true);

    return isset($data['data']['deleted']) && $data['data']['deleted'] === true;
  }

  /**
   * Get comments/replies for a Twitter post
   * Note: Twitter API v2 has limited access to replies
   *
   * @param string $postId
   * @param int $limit
   * @return array
   */
  public function getPostComments(string $postId, int $limit = 100): array
  {
    // Twitter API v2 doesn't provide easy access to replies without elevated access
    // Would need to search for tweets mentioning the original tweet
    // For now, return empty array - can be implemented with elevated API access
    LogHelper::social('twitter.get_post_comments_not_implemented', [
      'postId' => $postId,
      'note' => 'Requires elevated API access for reply search'
    ]);

    return [];
  }
}
