<?php

namespace App\Http\Controllers\Api;

use App\Models\SocialAccount;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OAuthController extends Controller
{
  public function redirect($provider)
  {
    $scopes = match ($provider) {
      'facebook' => [
        'public_profile',
        'pages_show_list',
        'pages_manage_posts',
        'pages_manage_metadata',
        'pages_read_engagement',
        'read_insights'
      ],
      'google' => ['https://www.googleapis.com/auth/youtube.upload'],
      'twitter' => ['tweet.read', 'tweet.write'],
      default => [],
    };

    return Socialite::driver($provider)
      ->scopes($scopes)
      ->redirect();
  }

  public function handleCallback($provider)
  {
    try {
      $user = Socialite::driver($provider)->user();

      $account = SocialAccount::updateOrCreate([
        'user_id' => auth()->id(),
        'provider' => $provider,
        'provider_id' => $user->id,
      ], [
        'name' => $user->name,
        'email' => $user->email,
        'access_token' => $user->token,
        'refresh_token' => $user->refreshToken,
        'expires_at' => $user->expiresIn ? now()->addSeconds($user->expiresIn) : null,
        'avatar' => $user->avatar,
        'data' => $user->user,
      ]);

      return response()->json([
        'success' => true,
        'account' => $account,
      ]);
    } catch (\Exception $e) {
      \Log::error("OAuth error: " . $e->getMessage());
      return response()->json(['error' => 'Authentication failed'], 500);
    }
  }
}
