<?php

namespace App\Services;

use App\Models\SocialAccount;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SocialTokenManager
{
  public function getValidToken(SocialAccount $account)
  {
    // Si el token no ha expirado o expira en más de 5 minutos
    if (
      !$account->token_expires_at ||
      $account->token_expires_at->gt(now()->addMinutes(5))
    ) {
      return $account->access_token;
    }

    // Si tiene refresh token, intentar renovar
    if ($account->refresh_token) {
      return $this->refreshToken($account);
    }

    // Marcar como inactiva para reconexión
    $account->update([
      'is_active' => false,
      'last_failed_at' => now(),
      'failure_count' => $account->failure_count + 1
    ]);

    throw new \Exception("Token expirado, requiere reconexión");
  }

  private function refreshToken(SocialAccount $account)
  {
    $client = new Client();

    try {
      $response = match ($account->platform) {
        'facebook' => $this->refreshFacebookToken($account, $client),
        'google', 'youtube' => $this->refreshGoogleToken($account, $client),
        'twitter' => $this->refreshTwitterToken($account, $client),
        'instagram' => $this->refreshInstagramToken($account, $client),
        'tiktok' => $this->refreshTikTokToken($account, $client),
        default => null,
      };

      if ($response) {
        $account->update([
          'access_token' => $response['access_token'],
          'refresh_token' => $response['refresh_token'] ?? $account->refresh_token,
          'token_expires_at' => now()->addSeconds($response['expires_in']),
          'failure_count' => 0,
        ]);

        return $response['access_token'];
      }
    } catch (\Exception $e) {
      \Log::error("Error refreshing token: " . $e->getMessage());
    }

    return null;
  }


  private function refreshFacebookToken($account, $client)
  {
    $response = $client->get('https://graph.facebook.com/v18.0/oauth/access_token', [
      'query' => [
        'grant_type' => 'fb_exchange_token',
        'client_id' => config('services.facebook.client_id'),
        'client_secret' => config('services.facebook.client_secret'),
        'fb_exchange_token' => $account->access_token,
      ]
    ]);

    return json_decode($response->getBody(), true);
  }

  private function refreshGoogleToken($account, $client)
  {
    $response = $client->post('https://oauth2.googleapis.com/token', [
      'form_params' => [
        'client_id' => config('services.google.client_id'),
        'client_secret' => config('services.google.client_secret'),
        'refresh_token' => $account->refresh_token,
        'grant_type' => 'refresh_token',
      ]
    ]);

    return json_decode($response->getBody(), true);
  }

  private function refreshTwitterToken($account, $client)
  {
    $response = $client->post('https://api.twitter.com/2/oauth2/token', [
      'form_params' => [
        'client_id' => config('services.twitter.client_id'),
        'client_secret' => config('services.twitter.client_secret'),
        'refresh_token' => $account->refresh_token,
        'grant_type' => 'refresh_token',
      ]
    ]);

    return json_decode($response->getBody(), true);
  }

  private function refreshInstagramToken($account, $client)
  {
    // Instagram uses long-lived token refresh
    $response = $client->get('https://graph.instagram.com/refresh_access_token', [
      'query' => [
        'grant_type' => 'ig_refresh_token',
        'access_token' => $account->access_token,
      ]
    ]);

    return json_decode($response->getBody(), true);
  }

  private function refreshTikTokToken($account, $client)
  {
    $response = $client->post('https://open.tiktokapis.com/v2/oauth/token/', [
      'form_params' => [
        'client_key' => config('services.tiktok.client_key'),
        'client_secret' => config('services.tiktok.client_secret'),
        'refresh_token' => $account->refresh_token,
        'grant_type' => 'refresh_token',
      ]
    ]);

    return json_decode($response->getBody(), true);
  }
}
