<?php

namespace App\Services\SocialPlatforms;

abstract class BaseSocialService
{
  protected $accessToken;
  protected $client;

  public function __construct(string $accessToken)
  {
    $this->accessToken = $accessToken;
    $this->client = new \GuzzleHttp\Client([
      'timeout' => 30,
      'connect_timeout' => 10,
    ]);
  }

  abstract public function publishPost(array $data): array;
  abstract public function getAccountInfo(): array;
  abstract public function getPostAnalytics(string $postId): array;
  abstract public function validateCredentials(): bool;
}
