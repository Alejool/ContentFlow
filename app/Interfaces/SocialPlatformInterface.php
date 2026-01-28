<?php

namespace App\Interfaces;

use App\DTOs\SocialPostDTO;
use App\DTOs\PostResultDTO;

interface SocialPlatformInterface
{
  /**
   * Publishes a post to the platform.
   */
  public function publish(SocialPostDTO $post): PostResultDTO;

  /**
   * Deletes a post from the platform.
   */
  public function delete(string $platformId): bool;

  /**
   * Gets performance analytics/metrics for a specific post.
   */
  public function getMetrics(string $platformId): array;
}
