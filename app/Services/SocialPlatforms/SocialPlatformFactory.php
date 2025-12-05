<?php

namespace App\Services\SocialPlatforms;

class SocialPlatformFactory
{
  public static function make(string $platform, string $accessToken)
  {
    return match ($platform) {
      'facebook' => new FacebookService($accessToken),
      'instagram' => new InstagramService($accessToken),
      'youtube' => new YouTubeService($accessToken),
      'twitter' => new TwitterService($accessToken),
      'linkedin' => new LinkedInService($accessToken),
      'tiktok' => new TikTokService($accessToken),
      default => throw new \Exception("Plataforma no soportada: {$platform}"),
    };
  }
}
