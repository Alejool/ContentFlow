<?php

namespace App\Services\SocialPlatforms;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;
use Illuminate\Support\Facades\Log;

class LinkedInService extends BaseSocialService
{
  public function publish(SocialPostDTO $post): PostResultDTO
  {
    return PostResultDTO::failure('LinkedIn publishing not implemented yet');
  }

  public function delete(string $platformId): bool
  {
    return false;
  }

  public function getMetrics(string $platformId): array
  {
    return [];
  }

  public function getPostAnalytics(string $postId): array
  {
    return [];
  }

  public function getAccountInfo(): array
  {
    return [
      'name' => 'LinkedIn Account',
      'id' => null,
    ];
  }

  public function validateCredentials(): bool
  {
    return false;
  }

  /**
   * Get comments for a LinkedIn post
   *
   * @param string $postId
   * @param int $limit
   * @return array
   */
  public function getPostComments(string $postId, int $limit = 100): array
  {
    // LinkedIn service not fully implemented yet
    return [];
  }
}
