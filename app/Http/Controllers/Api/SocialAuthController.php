<?php

namespace App\Http\Controllers\Api;

use App\Models\Social\SocialAccount;
use Laravel\Socialite\Facades\Socialite;
use App\Http\Controllers\Controller;

class SocialAuthController extends Controller
{
  public function redirect($platform)
  {
    $scopes = $this->getScopes($platform);

    // Generate and store state for CSRF protection
    $state = \Str::random(40);
    session()->put('oauth_state', $state);

    return Socialite::driver($platform)
      ->scopes($scopes)
      ->with(['state' => $state])
      ->redirect();
  }

  public function callback($platform)
  {
    try {
      // Check for OAuth denial
      if (request()->has('error')) {
        $error = request()->get('error');
        $errorDescription = request()->get('error_description', '');
        
        // Handle different OAuth error types
        $errorType = match ($error) {
          'access_denied' => 'denied',
          'invalid_request' => 'invalid_state',
          'server_error' => 'server_error',
          default => 'unknown',
        };

        return $this->sendOAuthErrorToPopup(
          $errorType,
          $errorDescription ?: 'Authentication was denied or failed'
        );
      }

      // Validate state parameter to prevent CSRF attacks
      if (request()->has('state')) {
        $state = request()->get('state');
        $sessionState = session()->get('oauth_state');
        
        if (!$sessionState || $state !== $sessionState) {
          return $this->sendOAuthErrorToPopup(
            'invalid_state',
            'Invalid authentication state. Please try again.'
          );
        }
        
        // Clear the state from session
        session()->forget('oauth_state');
      }

      // Attempt to get user from OAuth provider
      $socialUser = Socialite::driver($platform)->user();

      // Validate required user data
      if (!$socialUser->getId()) {
        throw new \Exception('Failed to retrieve user ID from provider');
      }

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

      return $this->sendOAuthSuccessToPopup($account);
    } catch (\Laravel\Socialite\Two\InvalidStateException $e) {
      // Handle invalid state exception
      return $this->sendOAuthErrorToPopup(
        'invalid_state',
        'Invalid authentication state. Please try again.'
      );
    } catch (\GuzzleHttp\Exception\RequestException $e) {
      // Handle network/timeout errors
      return $this->sendOAuthErrorToPopup(
        'network',
        'Network error occurred. Please check your connection and try again.'
      );
    } catch (\Exception $e) {
      // Log the error for debugging
      \Log::error('OAuth callback error', [
        'platform' => $platform,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);

      return $this->sendOAuthErrorToPopup(
        'unknown',
        'Error connecting account: ' . $e->getMessage()
      );
    }
  }

  /**
   * Send OAuth success message to popup window
   */
  private function sendOAuthSuccessToPopup($account)
  {
    return view('oauth-callback', [
      'success' => true,
      'account' => $account,
      'message' => 'Account connected successfully',
    ]);
  }

  /**
   * Send OAuth error message to popup window
   */
  private function sendOAuthErrorToPopup($errorType, $message)
  {
    // Clean up any partial OAuth state
    $this->cleanupPartialOAuthState();

    return view('oauth-callback', [
      'success' => false,
      'errorType' => $errorType,
      'message' => $message,
    ]);
  }

  /**
   * Clean up partial OAuth state on error
   */
  private function cleanupPartialOAuthState()
  {
    // Clear OAuth state from session
    session()->forget('oauth_state');
    
    // Clear any temporary OAuth data
    session()->forget('oauth_temp_data');
    
    // Note: We don't delete the social account record if it exists
    // because it might be a re-authentication attempt
    // The account will be marked as inactive if authentication fails repeatedly
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
