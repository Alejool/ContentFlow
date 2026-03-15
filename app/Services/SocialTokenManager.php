<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use App\Models\Social\SocialAccount;
use App\Helpers\LogHelper;

class SocialTokenManager
{
  public function getValidToken(SocialAccount $account): string
  {
    LogHelper::social('token.validity_check', [
      'account_id' => $account->id,
      'platform' => $account->platform,
      'has_access_token' => !empty($account->access_token),
      'has_refresh_token' => !empty($account->refresh_token),
      'token_expires_at' => $account->token_expires_at?->toIso8601String(),
      'is_active' => $account->is_active
    ]);

    // Check if token is corrupted or missing
    if (!$account->access_token) {
      $this->markAccountForReconnection($account, 'missing_or_corrupted_token');
      throw new \Exception("No access token available for {$account->platform}, reconnection required.");
    }

    // If it doesn't expire or expires in more than 5 minutes
    if (
      !$account->token_expires_at ||
      $account->token_expires_at->gt(now()->addMinutes(5))
    ) {
      LogHelper::social('token.still_valid', [
        'account_id' => $account->id,
        'platform' => $account->platform,
        'expires_at' => $account->token_expires_at?->toIso8601String()
      ]);
      return $account->access_token;
    }

    LogHelper::social('token.needs_refresh', [
      'account_id' => $account->id,
      'platform' => $account->platform,
      'expires_at' => $account->token_expires_at?->toIso8601String(),
      'has_refresh_token' => !empty($account->refresh_token)
    ]);

    // If it has a refresh token, try to renew
    if ($account->refresh_token) {
      $newToken = $this->refreshToken($account);
      if ($newToken) {
        LogHelper::social('token.refresh_successful', [
          'account_id' => $account->id,
          'platform' => $account->platform
        ]);
        return $newToken;
      }
      
      // If refresh failed, mark as inactive and throw exception
      $this->markAccountForReconnection($account, 'refresh_failed');
      throw new \Exception("Failed to refresh token for {$account->platform}, reconnection required.");
    }

    // No refresh token available, mark as inactive for reconnection
    $this->markAccountForReconnection($account, 'no_refresh_token');
    throw new \Exception("Token expired for {$account->platform}, reconnection required.");
  }

  /**
   * Mark account as needing reconnection
   */
  private function markAccountForReconnection(SocialAccount $account, string $reason): void
  {
    $account->update([
      'is_active' => false,
      'last_failed_at' => now(),
      'failure_count' => $account->failure_count + 1,
      'account_metadata' => array_merge($account->account_metadata ?? [], [
        'reconnection_reason' => $reason,
        'last_error_at' => now()->toIso8601String()
      ])
    ]);

    LogHelper::social('account.marked_for_reconnection', [
      'account_id' => $account->id,
      'platform' => $account->platform,
      'reason' => $reason,
      'failure_count' => $account->failure_count + 1
    ]);
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
      LogHelper::socialError('token.refresh_error', $e->getMessage(), [
        'account_id' => $account->id,
        'platform' => $account->platform,
      ]);
    }

    return null;
  }


  private function refreshFacebookToken($account, $client)
  {
    // Facebook long-lived tokens don't use a standard refresh_token flow.
    // We can try to extend the current token using fb_exchange_token.
    // If the current token is invalid/expired, this will fail and return null.
    if (empty($account->access_token)) {
      LogHelper::socialError('facebook.token_refresh_no_token', 'No access token to exchange', [
        'account_id' => $account->id
      ]);
      return null;
    }

    try {
      $response = $client->get('https://graph.facebook.com/v18.0/oauth/access_token', [
        'query' => [
          'grant_type' => 'fb_exchange_token',
          'client_id' => config('services.facebook.client_id'),
          'client_secret' => config('services.facebook.client_secret'),
          'fb_exchange_token' => $account->access_token,
        ],
        'http_errors' => false,
        'timeout' => 30,
      ]);

      $statusCode = $response->getStatusCode();
      $data = json_decode($response->getBody(), true);

      if ($statusCode !== 200 || !isset($data['access_token'])) {
        LogHelper::socialError('facebook.token_exchange_failed', 'Token exchange failed', [
          'account_id' => $account->id,
          'status_code' => $statusCode,
          'error' => $data['error']['message'] ?? json_encode($data),
        ]);
        return null;
      }

      // Facebook long-lived tokens last ~60 days
      $data['expires_in'] = $data['expires_in'] ?? (60 * 24 * 3600);

      return $data;
    } catch (\Exception $e) {
      LogHelper::socialError('facebook.token_refresh_exception', $e->getMessage(), [
        'account_id' => $account->id,
      ]);
      return null;
    }
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
      LogHelper::social('twitter.token_refresh_attempt', [
        'account_id' => $account->id,
        'has_refresh_token' => !empty($account->refresh_token),
        'token_expires_at' => $account->token_expires_at?->toIso8601String()
      ]);

      // Validate refresh token exists
      if (empty($account->refresh_token)) {
        LogHelper::socialError('twitter.no_refresh_token', 'No refresh token available', [
          'account_id' => $account->id
        ]);
        return null;
      }

      $response = $client->post('https://api.twitter.com/2/oauth2/token', [
        'headers' => [
          'Content-Type' => 'application/x-www-form-urlencoded',
          'Authorization' => 'Basic ' . base64_encode(config('services.twitter.client_id') . ':' . config('services.twitter.client_secret'))
        ],
        'form_params' => [
          'refresh_token' => $account->refresh_token,
          'grant_type' => 'refresh_token',
          'client_id' => config('services.twitter.client_id'),
        ],
        'timeout' => 30,
        'http_errors' => false
      ]);

      $statusCode = $response->getStatusCode();
      $body = (string)$response->getBody();
      $data = json_decode($body, true);

      LogHelper::social('twitter.token_refresh_response', [
        'account_id' => $account->id,
        'status_code' => $statusCode,
        'has_access_token' => isset($data['access_token']),
        'has_refresh_token' => isset($data['refresh_token']),
        'expires_in' => $data['expires_in'] ?? null
      ]);

      if ($statusCode !== 200) {
        LogHelper::socialError('twitter.token_refresh_failed', $data['error'] ?? 'Unknown error', [
          'status_code' => $statusCode,
          'error_description' => $data['error_description'] ?? $body,
          'account_id' => $account->id
        ]);
        return null;
      }

      if (!isset($data['access_token'])) {
        LogHelper::socialError('twitter.token_refresh_missing_token', 'Missing access_token in response', [
          'response_data' => $data,
          'account_id' => $account->id
        ]);
        return null;
      }

      LogHelper::social('twitter.token_refresh_successful', [
        'account_id' => $account->id,
        'new_expires_in' => $data['expires_in'] ?? null
      ]);

      return $data;
    } catch (\Exception $e) {
      LogHelper::socialError('twitter.token_refresh_exception', $e->getMessage(), [
        'account_id' => $account->id,
        'trace' => $e->getTraceAsString()
      ]);
      return null;
    }
  }

  private function refreshInstagramToken($account, $client)
  {
    // Instagram long-lived tokens can be refreshed if they haven't expired yet
    if (empty($account->access_token)) {
      return null;
    }

    try {
      $response = $client->get('https://graph.instagram.com/refresh_access_token', [
        'query' => [
          'grant_type' => 'ig_refresh_token',
          'access_token' => $account->access_token,
        ],
        'http_errors' => false,
        'timeout' => 30,
      ]);

      $statusCode = $response->getStatusCode();
      $data = json_decode($response->getBody(), true);

      if ($statusCode !== 200 || !isset($data['access_token'])) {
        LogHelper::socialError('instagram.token_refresh_failed', 'Token refresh failed', [
          'account_id' => $account->id,
          'status_code' => $statusCode,
          'error' => $data['error']['message'] ?? json_encode($data),
        ]);
        return null;
      }

      return $data;
    } catch (\Exception $e) {
      LogHelper::socialError('instagram.token_refresh_exception', $e->getMessage(), [
        'account_id' => $account->id,
      ]);
      return null;
    }
  }

  private function refreshTikTokToken($account, $client)
  {
    if (empty($account->refresh_token)) {
      return null;
    }

    try {
      $response = $client->post('https://open.tiktokapis.com/v2/oauth/token/', [
        'form_params' => [
          'client_key' => config('services.tiktok.client_key'),
          'client_secret' => config('services.tiktok.client_secret'),
          'refresh_token' => $account->refresh_token,
          'grant_type' => 'refresh_token',
        ],
        'http_errors' => false,
        'timeout' => 30,
      ]);

      $statusCode = $response->getStatusCode();
      $data = json_decode($response->getBody(), true);

      if ($statusCode !== 200 || !isset($data['access_token'])) {
        LogHelper::socialError('tiktok.token_refresh_failed', 'Token refresh failed', [
          'account_id' => $account->id,
          'status_code' => $statusCode,
          'error' => $data['error'] ?? json_encode($data),
        ]);
        return null;
      }

      return $data;
    } catch (\Exception $e) {
      LogHelper::socialError('tiktok.token_refresh_exception', $e->getMessage(), [
        'account_id' => $account->id,
      ]);
      return null;
    }
  }
}
