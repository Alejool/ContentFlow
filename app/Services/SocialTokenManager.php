<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

use App\Models\Social\SocialAccount;

class SocialTokenManager
{
  public function getValidToken(SocialAccount $account): string
  {
    // If it doesn't expire or expires in more than 5 minutes
    if (
      !$account->token_expires_at ||
      $account->token_expires_at->gt(now()->addMinutes(5))
    ) {
      if (!$account->access_token) {
        throw new \Exception("No access token available for {$account->platform}, reconnection required.");
      }
      return $account->access_token;
    }

    // If it has a refresh token, try to renew
    if ($account->refresh_token) {
      $newToken = $this->refreshToken($account);
      if ($newToken) {
        return $newToken;
      }
      
      // If refresh failed, mark as inactive and throw exception
      $account->update([
        'is_active' => false,
        'last_failed_at' => now(),
        'failure_count' => $account->failure_count + 1
      ]);
      
      throw new \Exception("Failed to refresh token for {$account->platform}, reconnection required.");
    }

    // No refresh token available, mark as inactive for reconnection
    $account->update([
      'is_active' => false,
      'last_failed_at' => now(),
      'failure_count' => $account->failure_count + 1
    ]);

    throw new \Exception("Token expired for {$account->platform}, reconnection required.");
  }

  public function refreshToken(SocialAccount $account): ?string
  {
    $client = new Client();

    try {
      $response = match ($account->platform) {
        'facebook' => $this->refreshFacebookToken($account, $client),
        'google', 'youtube' => $this->refreshGoogleToken($account, $client),
        'twitter', 'x' => $this->refreshTwitterToken($account, $client),
        'instagram' => $this->refreshInstagramToken($account, $client),
        'tiktok' => $this->refreshTikTokToken($account, $client),
        default => null,
      };

      if ($response && isset($response['access_token'])) {
        $account->update([
          'access_token' => $response['access_token'],
          'refresh_token' => $response['refresh_token'] ?? $account->refresh_token,
          'token_expires_at' => isset($response['expires_in']) ? now()->addSeconds($response['expires_in']) : $account->token_expires_at,
          'failure_count' => 0,
          'is_active' => true,
        ]);

        return $response['access_token'];
      }
    } catch (\Exception $e) {
      Log::error("Error refreshing token for {$account->platform}: " . $e->getMessage());
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
    try {
      $response = $client->post('https://api.twitter.com/2/oauth2/token', [
        'auth' => [
          config('services.twitter.client_id'),
          config('services.twitter.client_secret')
        ],
        'form_params' => [
          'refresh_token' => $account->refresh_token,
          'grant_type' => 'refresh_token',
          'client_id' => config('services.twitter.client_id'),
        ],
        'http_errors' => false // Capture error body for logging
      ]);

      if ($response->getStatusCode() !== 200) {
        $body = (string)$response->getBody();
        Log::error("Twitter token refresh failed with status {$response->getStatusCode()}", [
          'body' => $body,
          'account_id' => $account->id
        ]);
        return null;
      }

      return json_decode($response->getBody(), true);
    } catch (\Exception $e) {
      Log::error("Twitter token refresh exception", [
        'error' => $e->getMessage(),
        'account_id' => $account->id
      ]);
      return null;
    }
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
