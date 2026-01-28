<?php

namespace App\Http\Controllers\Api;

use App\Models\SocialAccount;
use Laravel\Socialite\Facades\Socialite;
use App\Http\Controllers\Controller;

class SocialAuthController extends Controller
{
  public function redirect($platform)
  {
    $scopes = $this->getScopes($platform);

    return Socialite::driver($platform)
      ->scopes($scopes)
      ->redirect();
  }

  public function callback($platform)
  {
    try {
      $socialUser = Socialite::driver($platform)->user();

      $account = SocialAccount::updateOrCreate(
        [
          'user_id' => auth()->id(),
          'platform' => $platform,
          'platform_id' => $socialUser->getId(),
        ],
        [
          'name' => $socialUser->getName(),
          'email' => $socialUser->getEmail(),
          'access_token' => $socialUser->token,
          'refresh_token' => $socialUser->refreshToken,
          'token_expires_at' => $socialUser->expiresAt ?
            now()->addSeconds($socialUser->expiresIn) : null,
          'metadata' => $socialUser->user,
          'is_active' => true,
          'failure_count' => 0,
        ]
      );

      return response()->json([
        'success' => true,
        'account' => $account,
        'message' => 'Cuenta conectada exitosamente'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Error conectando cuenta: ' . $e->getMessage()
      ], 500);
    }
  }

  private function getScopes($platform)
  {
    return match ($platform) {
      'facebook' => [
        'public_profile',
        'pages_show_list',
        'pages_manage_posts',
        'pages_manage_metadata',
        'pages_read_engagement',
        'read_insights'
      ],
      'google' => [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube',
      ],
      'twitter' => ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      default => [],
    };
  }
}
