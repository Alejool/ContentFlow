<?php

namespace App\Services\SocialPlatforms;

use App\Models\SocialAccount;

abstract class BaseSocialService
{
  protected $accessToken;
  protected $client;
  protected ?SocialAccount $socialAccount;

  public function __construct(string $accessToken, ?SocialAccount $socialAccount = null)
  {
    $this->accessToken = $accessToken;
    $this->socialAccount = $socialAccount;
    $this->client = new \GuzzleHttp\Client([
      'timeout' => 30,
      'connect_timeout' => 10,
    ]);
  }

  abstract public function publishPost(array $data): array;
  abstract public function getAccountInfo(): array;
  abstract public function getPostAnalytics(string $postId): array;
  abstract public function validateCredentials(): bool;
  public function deletePost(string $postId): bool
  {
    return false;
  }
}
