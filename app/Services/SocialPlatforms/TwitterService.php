<?php

namespace App\Services\SocialPlatforms;

use Illuminate\Support\Facades\Log;
use GuzzleHttp\Exception\ClientException;
use League\OAuth1\Client\Server\Twitter;
use League\OAuth1\Client\Credentials\TokenCredentials;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Storage;

class TwitterService extends BaseSocialService
{
  /**
   * publish tweet
   */
  public function publishPost(array $data): array
  {
    $this->ensureValidToken();

    $mediaIds = [];
    $rawPath = $data['media_url'] ?? $data['video_path'] ?? $data['image_path'] ?? null;

    if (!empty($rawPath)) {
      $resolvedUrl = $this->resolveUrl($rawPath);
      $mediaPath = $this->downloadMedia($resolvedUrl);

      try {
        $mimeType = mime_content_type($mediaPath);
        $mediaCategory = $this->getMediaCategory($mimeType);
        $fileSize = filesize($mediaPath);

        // normal images < 5MB, videos/large > 5MB used chunked
        if ($mediaCategory === 'tweet_video' || $fileSize > 5 * 1024 * 1024) {
          $mediaId = $this->uploadLargeMediaV2($mediaPath, $mimeType, $mediaCategory);
          if ($mediaCategory === 'tweet_video') {
            $this->checkMediaStatusV2($mediaId);
          }
        } else {
          $mediaId = $this->uploadMediaV2($mediaPath, $mediaCategory);
        }

        $mediaIds[] = $mediaId;
      } catch (ClientException $e) {
        $response = $e->getResponse();
        $responseBody = $response ? $response->getBody()->getContents() : '';

        Log::error('Twitter v2 Upload Error', [
          'error' => $e->getMessage(),
          'response_body' => $responseBody,
          'headers' => $response ? $response->getHeaders() : [],
          'response' => $response,
          'token' => $this->accessToken
        ]);
        throw new \Exception("Twitter Upload Failed: " . $e->getMessage() . " | Details: " . $responseBody);
      } finally {
        if (file_exists($mediaPath)) {
          unlink($mediaPath);
        }
      }
    }

    $content = $data['content'] ?? $data['caption'] ?? '';

    // Handle Poll
    $isPoll = isset($data['platform_settings']['twitter']['type']) && $data['platform_settings']['twitter']['type'] === 'poll';

    if ($isPoll) {
      $pollOptions = $data['platform_settings']['twitter']['poll_options'] ?? [];
      $pollDuration = $data['platform_settings']['twitter']['poll_duration'] ?? 1440; // Default 24h

      // Filter empty options
      $pollOptions = array_filter($pollOptions, fn($opt) => !empty(trim($opt)));

      if (count($pollOptions) >= 2) {
        $tweetData = [
          'text' => $content,
          'poll' => [
            'options' => array_values($pollOptions),
            'duration_minutes' => (int)$pollDuration
          ]
        ];

        // Polls cannot have media in API v2 generally (check docs, but usually mutually exclusive or limited)
        // If media exists, we might need to ignore it or warn. For now, let's prioritizing Poll.
        // "You cannot include media in a poll Tweet." - Twitter API docs.

        try {
          return $this->sendTweet($tweetData);
        } catch (\Exception $e) {
          Log::error('Twitter Poll Failed', ['error' => $e->getMessage()]);
          throw $e;
        }
      }
    }

    // Handle Thread
    $isThread = isset($data['platform_settings']['twitter']['type']) && $data['platform_settings']['twitter']['type'] === 'thread';

    if ($isThread) {
      $chunks = $this->splitText($content);

      // Only treat as thread if we actually have multiple chunks
      if (count($chunks) > 1) {
        Log::info('Publishing Twitter Thread', ['chunks_count' => count($chunks)]);
        return $this->publishThread($chunks, $mediaIds);
      }
    }

    // Single Tweet Logic checks
    if (mb_strlen($content) > 280) {
      // If not a thread but too long, we could auto-thread or fail.
      // For now, let's warn. If strict mode, maybe throw exception.
      Log::warning('Tweet content exceeds 280 characters but thread mode not enabled. Twitter API may reject.', ['length' => mb_strlen($content)]);
    }

    $tweetData = ['text' => $content];

    if (!empty($mediaIds)) {
      $tweetData['media'] = ['media_ids' => $mediaIds];
    }

    // Publicar tweet (API v2)
    try {
      return $this->sendTweet($tweetData);
    } catch (ClientException $e) {
      // Retry on 401 (Unauthorized) - Token might be revoked or expired despite date check
      if ($e->getResponse()->getStatusCode() === 401) {
        Log::warning('Twitter API 401 (Unauthorized) - Attempting token refresh and retry');

        try {
          $this->refreshToken();
          return $this->sendTweet($tweetData);
        } catch (\Exception $refreshError) {
          Log::error('Retry failed after token refresh', ['error' => $refreshError->getMessage()]);
          throw $refreshError;
        }
      }

      $response = $e->getResponse();
      $responseBody = $response ? $response->getBody()->getContents() : '';
      Log::error('Twitter v2 Posting Error', ['error' => $e->getMessage(), 'response' => $responseBody]);
      throw new \Exception("Failed to post tweet: " . $e->getMessage() . " Details: " . $responseBody);
    }
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

        try {
          $result = $this->sendTweet($tweetData);
        } catch (ClientException $e) {
          if ($e->getResponse()->getStatusCode() === 401) {
            $this->refreshToken();
            $result = $this->sendTweet($tweetData);
          } else {
            throw $e;
          }
        }

        $replyToId = $result['post_id'];

        if ($index === 0) {
          $firstPostResult = $result;
        }

        // Add a small delay to avoid rate limits / ordering issues
        usleep(500000); // 0.5s

      } catch (\Exception $e) {
        Log::error('Failed to publish thread segment', ['index' => $index, 'error' => $e->getMessage()]);
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
   * Helper to send tweet (for retry logic)
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

    Log::info('TwitterService Debug: Checking V1 Creds', [
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
          Log::error('Twitter V1 League Upload Failed', ['body' => $body, 'status' => $response->getStatusCode()]);

          if (isset($media->errors)) {
            throw new \Exception('Twitter V1 Error: ' . json_encode($media->errors));
          }
          throw new \Exception('Twitter V1 Error Raw: ' . $body);
        } catch (\Throwable $e) {
          $lastException = $e;
          Log::warning('Twitter V1 upload attempt ' . ($attempts + 1) . ' failed: ' . $e->getMessage());
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

    Log::info('Twitter v2 Media Upload Response', ['response' => $response->getBody()]);
    Log::info('Twitter v2 Media Upload Response', ['response' => $response]);

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
    // Ideally we should pass the full account model to the service,
    // but for now we query or assume we have it.
    // Since BaseSocialService usually doesn't store the full model, we need to fetch it
    // using the access token or just hope it was passed.
    // Assuming we need to fetch the account that owns this access token.
    $account = \App\Models\SocialAccount::where('access_token', $this->accessToken)->first();
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
    // Check for OAuth 1.0a credentials in metadata
    $accountInfo = $this->getAccountInfoFromDb();
    $oauthToken = $accountInfo['account_metadata']['oauth1_token'] ?? null;
    $oauthSecret = $accountInfo['account_metadata']['secret'] ?? null;

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
        'connect_timeout' => 30,
        'timeout' => 300,
      ];
      $customClient = new Client($clientOptions);

      try {
        $fileSize = filesize($mediaPath);
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

        $chunkSize = 2 * 1024 * 1024;
        $handle = fopen($mediaPath, 'rb');
        $segmentIndex = 0;
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
          $segmentIndex++;
        }
        fclose($handle);

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
          return $finData['media_id_string'];
        }
        throw new \Exception('V1 FINALIZE Failed: ' . json_encode($finData));
      } catch (\Throwable $e) {
        Log::warning('Twitter V1 Chunked Upload Failed: ' . $e->getMessage());
        throw new \Exception("Twitter Auth V1 Video Upload Failed. Details: " . $e->getMessage());
      }
    }

    $fileSize = filesize($mediaPath);


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
    ]);

    $initData = json_decode($initResponse->getBody(), true);

    if (!isset($initData['media_id_string'])) {
      $errorMsg = $initData['error'] ?? json_encode($initData);
      throw new \Exception('INIT failed: ' . $errorMsg);
    }

    $mediaId = $initData['media_id_string'];
    $chunkSize = 2 * 1024 * 1024;
    $handle = fopen($mediaPath, 'rb');
    $segmentIndex = 0;

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
        ]);

        $segmentIndex++;
      }
    } finally {
      fclose($handle);
    }

    $finalizeResponse = $this->client->post('https://upload.twitter.com/1.1/media/upload.json', [
      'headers' => [
        'Authorization' => "Bearer {$this->accessToken}",
      ],
      'form_params' => [
        'command' => 'FINALIZE',
        'media_id' => $mediaId,
      ],
    ]);

    $finalizeData = json_decode($finalizeResponse->getBody(), true);

    if (!isset($finalizeData['media_id_string'])) {
      $errorMsg = $finalizeData['error'] ?? json_encode($finalizeData);
      throw new \Exception('FINALIZE failed: ' . $errorMsg);
    }

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
    file_put_contents($tempFile, fopen($url, 'r'));
    return $tempFile;
  }

  /**
   * get account info
   */
  public function getAccountInfo(): array
  {
    $this->ensureValidToken();

    try {
      $response = $this->client->get('https://api.twitter.com/2/users/me', [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
        'query' => [
          'user.fields' => 'id,name,username,public_metrics,profile_image_url',
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      if (!isset($data['data'])) {
        throw new \Exception('No user data returned: ' . json_encode($data));
      }

      return $data['data'];
    } catch (\Exception $e) {
      Log::error('Twitter getAccountInfo error', ['error' => $e->getMessage()]);
      throw $e;
    }
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
      Log::warning('Twitter analytics error', ['post_id' => $postId, 'error' => $e->getMessage()]);
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
      Log::error('Twitter validateCredentials failed', ['error' => $e->getMessage()]);
      return false;
    }
  }
  /**
   * Delete a tweet
   */
  public function deletePost(string $postId): bool
  {
    $this->ensureValidToken();

    try {
      $response = $this->client->delete("https://api.twitter.com/2/tweets/{$postId}", [
        'headers' => [
          'Authorization' => "Bearer {$this->accessToken}",
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      return isset($data['data']['deleted']) && $data['data']['deleted'] === true;
    } catch (\Exception $e) {
      Log::error('Twitter deletePost error', ['post_id' => $postId, 'error' => $e->getMessage()]);
      return false;
    }
  }

  /**
   * Ensure the access token is valid
   */
  private function ensureValidToken(): void
  {
    // Check for expiration and refresh if necessary
    if ($this->socialAccount && $this->socialAccount->token_expires_at) {
      // Refresh if expired or expiring soon (within 5 minutes)
      if (now()->addMinutes(5)->gte($this->socialAccount->token_expires_at)) {
        Log::info('Twitter Token expired or expiring soon, attempting refresh', ['account_id' => $this->socialAccount->id]);
        try {
          $this->refreshToken();
        } catch (\Exception $e) {
          Log::error('Twitter Token refresh failed', ['error' => $e->getMessage()]);
          // If strictly expired, throw error
          if (now()->gte($this->socialAccount->token_expires_at)) {
            throw $e;
          }
        }
      }
    }
  }

  /**
   * Refresh the access token
   */
  private function refreshToken(): void
  {
    if (!$this->socialAccount || !$this->socialAccount->refresh_token) {
      throw new \Exception('Cannot refresh Twitter token: Missing refresh token');
    }

    try {
      $clientId = config('services.twitter.client_id');
      $clientSecret = config('services.twitter.client_secret');

      $client = new \GuzzleHttp\Client();
      $response = $client->post('https://api.twitter.com/2/oauth2/token', [
        'headers' => [
          'Authorization' => 'Basic ' . base64_encode($clientId . ':' . $clientSecret),
          'Content-Type' => 'application/x-www-form-urlencoded',
        ],
        'form_params' => [
          'refresh_token' => $this->socialAccount->refresh_token,
          'grant_type' => 'refresh_token',
          'client_id' => $clientId,
        ],
      ]);

      $data = json_decode($response->getBody(), true);

      if (isset($data['access_token'])) {
        $this->accessToken = $data['access_token'];

        // Twitter ROTATES refresh tokens, so we MUST update it
        $this->socialAccount->update([
          'access_token' => $data['access_token'],
          'refresh_token' => $data['refresh_token'] ?? $this->socialAccount->refresh_token,
          'token_expires_at' => now()->addSeconds($data['expires_in']),
        ]);

        // Update client with new token
        $this->client = new \GuzzleHttp\Client([
          'base_uri' => 'https://api.twitter.com/2/',
          'timeout' => 30,
          'connect_timeout' => 10,
        ]);

        Log::info('Twitter Token refreshed successfully');
      } else {
        throw new \Exception('Failed to refresh Twitter token: No access_token in response');
      }
    } catch (\Exception $e) {
      Log::error('Twitter refresh token request failed', ['error' => $e->getMessage()]);
      throw $e;
    }
  }
}
