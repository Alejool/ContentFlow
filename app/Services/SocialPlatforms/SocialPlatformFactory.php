<?php

namespace App\Services\SocialPlatforms;

use App\Models\Social\SocialAccount;

class SocialPlatformFactory
{
  public static function make(string $platform, string $accessToken, ?SocialAccount $account = null)
  {
    return match ($platform) {
      'facebook' => new FacebookService($accessToken, $account),
      'instagram' => new InstagramService($accessToken, $account),
      'youtube' => new YouTubeService($accessToken, $account),
      'twitter' => new TwitterService($accessToken, $account),
      'linkedin' => new LinkedInService($accessToken, $account),
      'tiktok' => new TikTokService($accessToken, $account),
      default => throw new \Exception("Plataforma no soportada: {$platform}"),
    };
  }
}
