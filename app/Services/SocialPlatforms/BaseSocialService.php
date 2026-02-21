<?php

namespace App\Services\SocialPlatforms;

use App\Models\Social\SocialAccount;
use App\Interfaces\SocialPlatformInterface;
use App\Services\SocialTokenManager;
use GuzzleHttp\Client;
use App\Helpers\LogHelper;
use Illuminate\Support\Facades\Log;

abstract class BaseSocialService implements SocialPlatformInterface
{
  protected string $accessToken;
  protected Client $client;
  protected ?SocialAccount $socialAccount;

  public function __construct(string $accessToken, ?SocialAccount $socialAccount = null)
  {
    if (empty($accessToken)) {
      throw new \InvalidArgumentException('Access token cannot be empty');
    }

    $this->accessToken = $accessToken;
    $this->socialAccount = $socialAccount;
    $this->client = new Client([
      'timeout' => 30,
      'connect_timeout' => 10,
    ]);
  }

  /**
   * Ensures the access token is valid, refreshing it if necessary.
   */
  protected function ensureValidToken(): void
  {
    if ($this->socialAccount) {
      $tokenManager = app(SocialTokenManager::class);
      $this->accessToken = $tokenManager->getValidToken($this->socialAccount);
    }
  }

  protected function refreshToken(): string
  {
    if ($this->socialAccount) {
      $tokenManager = app(SocialTokenManager::class);
      $this->accessToken = $tokenManager->refreshToken($this->socialAccount) ?? $this->accessToken;
    }
    return $this->accessToken;
  }

  abstract public function getAccountInfo(): array;

  abstract public function validateCredentials(): bool;

  /**
   * Get comments for a specific post
   *
   * @param string $postId Platform-specific post ID
   * @param int $limit Maximum number of comments to fetch
   * @return array Normalized array of comments
   */
  abstract public function getPostComments(string $postId, int $limit = 100): array;
}
