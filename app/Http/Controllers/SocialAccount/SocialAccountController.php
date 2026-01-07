<?php

namespace App\Http\Controllers\SocialAccount;

use App\Models\SocialAccount;
use App\Models\ScheduledPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use App\Notifications\SocialAccountConnectedNotification;
use App\Notifications\SocialAccountDisconnectedNotification;
use App\Models\SocialPostLog;
use Abraham\TwitterOAuth\TwitterOAuth;

class SocialAccountController extends Controller
{
  public function index()
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $accounts = SocialAccount::where('workspace_id', $workspaceId)->with('user:id,name')->get();

    return response()->json([
      'success' => true,
      'accounts' => $accounts
    ]);
  }

  public function getAuthUrl(Request $request, $platform)
  {
    $state = Str::random(40);
    session(['social_auth_state' => $state]);

    $url = '';

    switch (strtolower($platform)) {
      case 'facebook':
        $url = 'https://www.facebook.com/v18.0/dialog/oauth?' . http_build_query([
          'client_id' => config('services.facebook.client_id'),
          'redirect_uri' => url('/auth/facebook/callback'),
          'response_type' => 'code',
          'scope' => implode(',', [
            'public_profile',
            'pages_show_list',
            'pages_manage_posts',
            'pages_manage_metadata',
            'pages_read_engagement',
            'read_insights'
          ]),
          'state' => $state
        ]);
        break;

      case 'instagram':
        $url = 'https://api.instagram.com/oauth/authorize?' . http_build_query([
          'client_id' => config('services.instagram.client_id'),
          'redirect_uri' => url('/auth/instagram/callback'),
          'response_type' => 'code',
          'scope' => 'user_profile,user_media',
          'state' => $state
        ]);
        break;

      case 'twitter':
        $consumerKey = config('services.twitter.consumer_key');
        $consumerSecret = config('services.twitter.consumer_secret');

        if (!$consumerKey || !$consumerSecret) {
          return response()->json([
            'success' => false,
            'message' => 'Twitter Consumer Key/Secret not configured in .env'
          ], 500);
        }

        $connection = new TwitterOAuth($consumerKey, $consumerSecret);

        try {
          $request_token = $connection->oauth('oauth/request_token', [
            'oauth_callback' => url('/auth/twitter/callback-v1')
          ]);

          session([
            'oauth_token' => $request_token['oauth_token'],
            'oauth_token_secret' => $request_token['oauth_token_secret'],
            'social_auth_state' => $state
          ]);

          $url = $connection->url('oauth/authorize', [
            'oauth_token' => $request_token['oauth_token']
          ]);
        } catch (\Throwable $e) {
          return response()->json([
            'success' => false,
            'message' => 'Failed to initialize Twitter Login: ' . $e->getMessage()
          ], 500);
        }
        break;

      case 'youtube':
        $url = 'https://accounts.google.com/o/oauth2/auth?' . http_build_query([
          'client_id' => config('services.google.client_id'),
          'redirect_uri' => url('/auth/youtube/callback'),
          'response_type' => 'code',
          'scope' => implode(' ', [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/userinfo.email',
          ]),
          'access_type' => 'offline',
          'prompt' => 'consent',
          'state' => $state
        ]);
        break;

      case 'tiktok':
        $codeVerifier = Str::random(128);
        $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
        session(['tiktok_code_verifier' => $codeVerifier]);

        $url = 'https://www.tiktok.com/v2/auth/authorize?' . http_build_query([
          'client_key' => config('services.tiktok.client_key'),
          'redirect_uri' => url('/auth/tiktok/callback'),
          'response_type' => 'code',
          'scope' => 'user.info.basic,video.publish',
          'state' => $state,
          'code_challenge' => $codeChallenge,
          'code_challenge_method' => 'S256'
        ]);
        break;

      default:
        return response()->json([
          'success' => false,
          'message' => 'Platform not supported'
        ], 400);
    }

    return response()->json([
      'success' => true,
      'url' => $url
    ]);
  }

  public function handleFacebookCallback(Request $request)
  {
    if ($request->state !== session('social_auth_state')) {
      return $this->handleOAuthError('Invalid state');
    }
    if (!$request->has('code')) {
      return $this->handleOAuthError('Authorization code not received');
    }

    try {
      $response = Http::post('https://graph.facebook.com/v18.0/oauth/access_token', [
        'client_id' => config('services.facebook.client_id'),
        'client_secret' => config('services.facebook.client_secret'),
        'redirect_uri' => url('/auth/facebook/callback'),
        'code' => $request->code,
      ]);
      $data = $response->json();

      if (!isset($data['access_token'])) {
        return $this->handleOAuthError('Could not obtain access token');
      }

      $userResponse = Http::withToken($data['access_token'])
        ->get('https://graph.facebook.com/me?fields=id,name,picture');

      $userData = $userResponse->json();

      if (!isset($userData['id'])) {
        return $this->handleOAuthError('Could not obtain user information');
      }

      $pages1 = Http::withToken($data['access_token'])->get('https://graph.facebook.com/v24.0/me/accounts', ['fields' => 'id,name,access_token,picture,category,tasks'])->json();
      $pages2 = Http::withToken($data['access_token'])->get('https://graph.facebook.com/v24.0/me', ['fields' => 'accounts{id,name,access_token,picture,category,tasks}'])->json();
      $allPages = array_merge($pages1['data'] ?? [], $pages2['accounts']['data'] ?? []);
      $uniquePages = [];
      foreach ($allPages as $p) {
        $uniquePages[$p['id']] = $p;
      }
      $pagesData = ['data' => array_values($uniquePages)];
      $permsResponse = Http::withToken($data['access_token'])
        ->get('https://graph.facebook.com/v24.0/me/permissions');
      $permsData = $permsResponse->json();

      if (count($uniquePages) === 0) {
        return $this->handleOAuthError('No Facebook Pages found associated with this account. This happens if the user does not have any Pages or if the Facebook App is "Consumer" type instead of "Business".');
      }

      $savedPages = [];
      foreach ($pagesData['data'] as $page) {
        if (true) {
          $this->saveAccount([
            'platform' => 'facebook',
            'account_id' => $page['id'],
            'account_name' => $page['name'],
            'account_metadata' => [
              'avatar' => $page['picture']['data']['url'] ?? null,
              'category' => $page['category'] ?? null,
              'user_id' => $userData['id'],
            ],
            'access_token' => $page['access_token'],
            'refresh_token' => null,
            'token_expires_at' => isset($data['expires_in'])
              ? now()->addSeconds($data['expires_in'])
              : null,
          ]);
          $savedPages[] = $page['name'];
        }
      }

      if (empty($savedPages)) {
        return $this->handleOAuthError('You do not have sufficient permissions to publish on any of your Facebook Pages.');
      }

      return $this->closeWindowWithMessage('success', [
        'platform' => 'facebook',
        'account_name' => count($savedPages) . ' Pages connected: ' . implode(', ', array_slice($savedPages, 0, 2)) . (count($savedPages) > 2 ? '...' : ''),
        'avatar' => $userData['picture']['data']['url'] ?? null,
      ]);
    } catch (\Exception $e) {
      return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
    }
  }

  public function handleInstagramCallback(Request $request)
  {
    if ($request->state !== session('social_auth_state')) {
      return $this->handleOAuthError('Invalid state');
    }

    if (!$request->has('code')) {
      return $this->handleOAuthError('Authorization code not received');
    }

    try {
      $response = Http::asForm()->post('https://api.instagram.com/oauth/access_token', [
        'client_id' => config('services.instagram.client_id'),
        'client_secret' => config('services.instagram.client_secret'),
        'redirect_uri' => url('/auth/instagram/callback'),
        'code' => $request->code,
        'grant_type' => 'authorization_code',
      ]);

      $data = $response->json();

      if (!isset($data['access_token']) || !isset($data['user_id'])) {
        return $this->handleOAuthError('Could not obtain access token: ' . json_encode($data));
      }

      $userResponse = Http::get("https://graph.instagram.com/{$data['user_id']}", [
        'fields' => 'id,username,account_type',
        'access_token' => $data['access_token']
      ]);

      $userData = $userResponse->json();

      $longLivedResponse = Http::get('https://graph.instagram.com/access_token', [
        'grant_type' => 'ig_exchange_token',
        'client_secret' => config('services.instagram.client_secret'),
        'access_token' => $data['access_token']
      ]);

      $longLivedData = $longLivedResponse->json();
      $finalAccessToken = $longLivedData['access_token'] ?? $data['access_token'];
      $expiresIn = $longLivedData['expires_in'] ?? null;

      $account = $this->saveAccount([
        'platform' => 'instagram',
        'account_id' => $data['user_id'],
        'account_name' => $userData['username'] ?? null,
        'account_metadata' => [
          'account_type' => $userData['account_type'] ?? null
        ],
        'access_token' => $finalAccessToken,
        'refresh_token' => null,
        'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
      ]);

      return $this->closeWindowWithMessage('success', [
        'platform' => 'instagram',
        'account_name' => $userData['username'] ?? null,
      ]);
    } catch (\Exception $e) {
      return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
    }
  }

  /**
   * Handle V1 Callback and immediately redirect to V2
   */
  public function handleTwitterV1Callback(Request $request)
  {
    if (!$request->has('oauth_token') || !$request->has('oauth_verifier')) {
      return $this->handleOAuthError('Twitter V1: Missing tokens');
    }

    $cachedToken = session('oauth_token');
    $cachedSecret = session('oauth_token_secret');

    if ($request->oauth_token !== $cachedToken) {
      return $this->handleOAuthError('Twitter V1: Token mismatch');
    }

    try {
      // Exchange for permanent V1 tokens
      $connection = new TwitterOAuth(
        config('services.twitter.consumer_key'),
        config('services.twitter.consumer_secret'),
        $cachedToken,
        $cachedSecret
      );

      $accessToken = $connection->oauth('oauth/access_token', [
        'oauth_verifier' => $request->oauth_verifier
      ]);

      session([
        'twitter_v1_creds' => [
          'oauth_token' => $accessToken['oauth_token'],
          'oauth_token_secret' => $accessToken['oauth_token_secret']
        ]
      ]);

      //Start OAuth 2.0 Flow ===
      $state = session('social_auth_state');

      $codeVerifier = Str::random(128);
      $codeChallenge = strtr(rtrim(
        base64_encode(hash('sha256', $codeVerifier, true)),
        '='
      ), '+/', '-_');

      session(['twitter_code_verifier' => $codeVerifier]);

      $v2Url = 'https://twitter.com/i/oauth2/authorize?' . http_build_query([
        'client_id' => config('services.twitter.client_id'),
        'redirect_uri' => url('/auth/twitter/callback'),
        'response_type' => 'code',
        'scope' => 'tweet.read tweet.write users.read offline.access media.write',
        'state' => $state,
        'code_challenge' => $codeChallenge,
        'code_challenge_method' => 'S256'
      ]);

      return redirect($v2Url);
    } catch (\Throwable $e) {
      return $this->handleOAuthError('Twitter V1 Auth Failed: ' . $e->getMessage());
    }
  }

  public function handleTwitterCallback(Request $request)
  {
    if ($request->state !== session('social_auth_state')) {
      return $this->handleOAuthError('Invalid state');
    }
    if (!$request->has('code')) {
      return $this->handleOAuthError('Authorization code not received');
    }

    try {

      $codeVerifier = session('twitter_code_verifier');
      if (!$codeVerifier) {
        return $this->handleOAuthError('Code verifier not found');
      }

      $response = Http::withBasicAuth(
        config('services.twitter.client_id'),
        config('services.twitter.client_secret')
      )->asForm()->post('https://api.twitter.com/2/oauth2/token', [
            'redirect_uri' => url('/auth/twitter/callback'),
            'code' => $request->code,
            'grant_type' => 'authorization_code',
            'code_verifier' => $codeVerifier,
          ]);

      $data = $response->json();

      if (!isset($data['access_token'])) {
        return $this->handleOAuthError('Could not obtain access token');
      }

      $userResponse = Http::withToken($data['access_token'])
        ->get('https://api.twitter.com/2/users/me', [
          'user.fields' => 'profile_image_url,username,name'
        ]);

      $userData = $userResponse->json();

      if (!isset($userData['data']['id'])) {
        return $this->handleOAuthError('Could not obtain user information');
      }

      $userInfo = $userData['data'];

      // Retrieve V1 credentials from session (from Step 2)
      $v1Creds = session('twitter_v1_creds');

      $metadata = [
        'username' => $userInfo['username'] ?? null,
        'avatar' => $userInfo['profile_image_url'] ?? null,
      ];

      if ($v1Creds) {
        $metadata['oauth1_token'] = $v1Creds['oauth_token'];
        $metadata['secret'] = $v1Creds['oauth_token_secret'];
      }

      $this->saveAccount([
        'platform' => 'twitter',
        'account_id' => $userInfo['id'],
        'account_name' => $userInfo['name'] ?? $userInfo['username'] ?? null,
        'account_metadata' => $metadata,
        'access_token' => $data['access_token'],
        'refresh_token' => $data['refresh_token'] ?? null,
        'token_expires_at' => isset($data['expires_in'])
          ? now()->addSeconds($data['expires_in'])
          : null,
      ]);

      session()->forget(['twitter_v1_creds', 'twitter_code_verifier', 'social_auth_state', 'oauth_token', 'oauth_token_secret']);

      return $this->closeWindowWithMessage('success', [
        'platform' => 'twitter',
        'account_name' => $userInfo['name'] ?? null,
        'username' => $userInfo['username'] ?? null,
        'avatar' => $userInfo['profile_image_url'] ?? null,
      ]);
    } catch (\Exception $e) {
      return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
    }
  }

  public function handleYoutubeCallback(Request $request)
  {
    if ($request->state !== session('social_auth_state')) {
      return $this->handleOAuthError('Invalid state');
    }
    if (!$request->has('code')) {
      return $this->handleOAuthError('Authorization code not received');
    }

    try {
      $response = Http::post('https://oauth2.googleapis.com/token', [
        'client_id' => config('services.google.client_id'),
        'client_secret' => config('services.google.client_secret'),
        'redirect_uri' => url('/auth/youtube/callback'),
        'code' => $request->code,
        'grant_type' => 'authorization_code',
      ]);

      $data = $response->json();

      if (!isset($data['access_token'])) {
        return $this->handleOAuthError('Could not obtain access token');
      }

      $channelResponse = Http::withToken($data['access_token'])
        ->get('https://www.googleapis.com/youtube/v3/channels', [
          'part' => 'snippet',
          'mine' => 'true'
        ]);

      $channelData = $channelResponse->json();

      if (!isset($channelData['items'][0]['id'])) {
        return $this->handleOAuthError('Could not obtain channel information');
      }

      $channelInfo = $channelData['items'][0]['snippet'];

      $userInfoResponse = Http::withToken($data['access_token'])
        ->get('https://www.googleapis.com/oauth2/v3/userinfo');
      $userInfo = $userInfoResponse->json();
      $userEmail = $userInfo['email'] ?? null;

      $this->saveAccount([
        'platform' => 'youtube',
        'account_id' => $channelData['items'][0]['id'],
        'account_name' => $channelInfo['title'] ?? null,
        'account_metadata' => [
          'avatar' => $channelInfo['thumbnails']['default']['url'] ?? null,
          'description' => $channelInfo['description'] ?? null,
          'username' => $channelInfo['customUrl'] ?? null,
          'email' => $userEmail
        ],
        'access_token' => $data['access_token'],
        'refresh_token' => $data['refresh_token'] ?? null,
        'token_expires_at' => isset($data['expires_in'])
          ? now()->addSeconds($data['expires_in'])
          : null,
      ]);

      return $this->closeWindowWithMessage('success', [
        'platform' => 'youtube',
        'account_name' => $channelInfo['title'] ?? null,
        'avatar' => $channelInfo['thumbnails']['default']['url'] ?? null,
      ]);
    } catch (\Exception $e) {
      return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
    }
  }

  public function handleTiktokCallback(Request $request)
  {
    if ($request->state !== session('social_auth_state')) {
      return $this->handleOAuthError('Invalid state');
    }

    if (!$request->has('code')) {
      return $this->handleOAuthError('Authorization code not received');
    }

    $codeVerifier = session('tiktok_code_verifier');

    if (!$codeVerifier) {
      return $this->handleOAuthError('Code verifier not found');
    }

    try {
      $tokenData = [
        'client_key' => config('services.tiktok.client_key'),
        'client_secret' => config('services.tiktok.client_secret'),
        'code' => $request->code,
        'grant_type' => 'authorization_code',
        'redirect_uri' => url('/auth/tiktok/callback'),
        'code_verifier' => $codeVerifier,
      ];

      $response = Http::asForm()->post('https://open.tiktokapis.com/v2/oauth/token/', $tokenData);

      $data = $response->json();

      session()->forget(['tiktok_code_verifier', 'social_auth_state']);

      if (isset($data['error'])) {
        return $this->handleOAuthError(
          'TikTok error: ' . ($data['error_description'] ?? $data['error']['message'] ?? $data['error'])
        );
      }

      $accessToken = $data['access_token'] ?? $data['data']['access_token'] ?? null;
      $openId = $data['open_id'] ?? $data['data']['open_id'] ?? null;
      $expiresIn = $data['expires_in'] ?? $data['data']['expires_in'] ?? null;
      $refreshToken = $data['refresh_token'] ?? $data['data']['refresh_token'] ?? null;

      if (!$accessToken) {
        return $this->handleOAuthError('Could not obtain access token from TikTok');
      }

      if (!$openId) {
        return $this->handleOAuthError('Could not obtain user ID from TikTok');
      }

      $userResponse = Http::withHeaders([
        'Authorization' => 'Bearer ' . $accessToken,
      ])->post('https://open.tiktokapis.com/v2/user/info/', [
            'fields' => 'open_id,union_id,avatar_url,display_name'
          ]);

      $userData = $userResponse->json();

      $userInfo = $userData['data']['user'] ?? [];

      $this->saveAccount([
        'platform' => 'tiktok',
        'account_id' => $openId,
        'account_name' => $userInfo['display_name'] ?? 'TikTok User',
        'account_metadata' => [
          'avatar' => $userInfo['avatar_url'] ?? null,
          'union_id' => $userInfo['union_id'] ?? null,
        ],
        'access_token' => $accessToken,
        'refresh_token' => $refreshToken,
        'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
      ]);

      return $this->closeWindowWithMessage('success', [
        'platform' => 'tiktok',
        'account_name' => $userInfo['display_name'] ?? null,
        'avatar' => $userInfo['avatar_url'] ?? null,
      ]);
    } catch (\Exception $e) {
      return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
    }
  }

  private function saveAccount($data)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $existingAccount = SocialAccount::withTrashed()
      ->where('workspace_id', $workspaceId)
      ->where('platform', $data['platform'])
      ->where('account_id', $data['account_id'])
      ->first();

    $accountData = [
      'account_id' => $data['account_id'],
      'access_token' => $data['access_token'],
      'refresh_token' => $data['refresh_token'] ?? null,
      'token_expires_at' => $data['token_expires_at'] ?? null,
    ];

    if (isset($data['account_name'])) {
      $accountData['account_name'] = $data['account_name'];
    }

    if (isset($data['account_metadata'])) {
      $accountData['account_metadata'] = $data['account_metadata'];
    }

    $isNewConnection = false;
    $wasReconnection = false;

    if ($existingAccount) {
      if ($existingAccount->trashed()) {
        $existingAccount->restore();
        $wasReconnection = true;

        SocialPostLog::where('social_account_id', $existingAccount->id)
          ->where('status', 'orphaned')
          ->update([
            'status' => 'published',
            'error_message' => null
          ]);
      }

      $existingAccount->update($accountData);
      $account = $existingAccount;
    } else {
      $accountData['user_id'] = Auth::id();
      $accountData['workspace_id'] = $workspaceId;
      $accountData['platform'] = $data['platform'];
      $account = SocialAccount::create($accountData);
      $isNewConnection = true;
    }

    $identifier = $data['account_name'] ?? $data['account_id'];

    if (isset($data['account_metadata']['email'])) {
      $identifier = "{$identifier} ({$data['account_metadata']['email']})";
    } elseif (isset($data['account_metadata']['username'])) {
      $identifier = "{$identifier} (@{$data['account_metadata']['username']})";
    }

    $user = Auth::user();
    if ($user) {
      $user->notify(new SocialAccountConnectedNotification(
        $data['platform'],
        $identifier,
        $wasReconnection
      ));
    }

    return $account;
  }

  private function handleOAuthError($message)
  {
    return view('oauth.callback', [
      'success' => false,
      'message' => $message
    ]);
  }

  private function closeWindowWithMessage($status, $data = [])
  {
    return view('oauth.callback', [
      'success' => $status === 'success',
      'data' => json_encode($data)
    ]);
  }


  public function store(Request $request)
  {
    $request->validate([
      'platform' => 'required|string|in:facebook,instagram,twitter,youtube,tiktok',
      'account_id' => 'required|string',
      'access_token' => 'required|string',
      'refresh_token' => 'nullable|string',
      'token_expires_at' => 'nullable|date',
      'account_name' => 'nullable|string',
      'account_metadata' => 'nullable|array',
    ]);

    try {
      $account = $this->saveAccount([
        'platform' => $request->platform,
        'account_id' => $request->account_id,
        'access_token' => $request->access_token,
        'refresh_token' => $request->refresh_token,
        'token_expires_at' => $request->token_expires_at,
        'account_name' => $request->account_name,
        'account_metadata' => $request->account_metadata,
      ]);

      return response()->json([
        'success' => true,
        'message' => 'Account connected successfully',
        'account' => $account
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Error saving account: ' . $e->getMessage()
      ], 500);
    }
  }

  public function destroy(Request $request, $id)
  {
    try {
      $account = SocialAccount::where('id', $id)
        ->where('workspace_id', Auth::user()->current_workspace_id)
        ->first();

      if (!$account) {
        return response()->json([
          'success' => false,
          'message' => trans('notifications.account_not_found', [], $account->user->preferredLocale())
        ], 404);
      }

      $force = $request->query('force') === 'true' || $request->input('force') === true;

      $activePosts = SocialPostLog::where('social_account_id', $account->id)
        ->whereIn('status', ['published', 'pending'])
        ->with('publication:id,title')
        ->get();

      $uniqueActivePosts = $activePosts->unique('publication_id');

      if ($uniqueActivePosts->count() > 0 && !$force) {
        return response()->json([
          'success' => false,
          'can_disconnect' => false,
          'active_posts_count' => $uniqueActivePosts->count(),
          'account_name' => $account->account_name ?? $account->account_id,
          'platform' => $account->platform,
          'posts' => $uniqueActivePosts->map(function ($log) {
            $date = $log->published_at instanceof \DateTimeInterface ? $log->published_at : null;
            if (!$date && $log->created_at instanceof \DateTimeInterface)
              $date = $log->created_at;

            if ($date && $date->format('Y') < 2000)
              $date = null;

            return [
              'id' => $log->publication_id,
              'title' => optional($log->publication)->title ?? 'Untitled',
              'platform_post_id' => $log->platform_post_id,
              'status' => $log->status,
              'published_at' => $date ? \Carbon\Carbon::instance($date)->toIso8601String() : null,
            ];
          })->values(),
          'message' => trans('notifications.try_account_disconnected', ['account_name' => $account->account_name, 'uniqueActivePosts' => $uniqueActivePosts->count(), 'platform' => $account->platform], $account->user->preferredLocale())
        ], 400);
      }

      $pendingPosts = ScheduledPost::where('social_account_id', $account->id)
        ->where('status', 'pending')
        ->with(['campaign:id,title', 'publication:id,title'])
        ->get();
      $uniquePendingPosts = $pendingPosts->unique(function ($item) {
        return $item->publication_id ? 'p' . $item->publication_id : 'c' . $item->campaign_id . '_' . $item->id;
      });

      if ($uniquePendingPosts->count() > 0) {
        if (!$force) {
          return response()->json([
            'success' => false,
            'message' => 'Cannot disconnect account. It has ' . $uniquePendingPosts->count() . ' scheduled post(s). Please remove them from campaigns first.',
            'posts' => $uniquePendingPosts->map(function ($post) {
              $date = $post->scheduled_at instanceof \DateTimeInterface ? $post->scheduled_at : null;
              if (!$date && $post->created_at instanceof \DateTimeInterface)
                $date = $post->created_at;

              if ($date && $date->format('Y') < 2000)
                $date = null;

              return [
                'id' => $post->id,
                'title' => optional($post->publication)->title ?? optional($post->campaign)->title ?? 'Untitled',
                'scheduled_at' => $date ? \Carbon\Carbon::instance($date)->toIso8601String() : null,
                'status' => $post->status,
              ];
            })->values()
          ], 400);
        } else {
          foreach ($pendingPosts as $post) {
            $post->delete();
          }
        }
      }

      $orphanedPostsList = [];
      if ($force && $uniqueActivePosts->count() > 0) {
        $orphanedPostsList = $uniqueActivePosts->map(fn($log) => optional($log->publication)->title ?? 'Untitled')->toArray();

        SocialPostLog::where('social_account_id', $account->id)
          ->whereIn('status', ['published', 'pending'])
          ->update([
            'status' => 'orphaned',
            'error_message' => "Account '{$account->account_name}' was disconnected - cannot manage remotely"
          ]);
      }

      $user = Auth::user();
      if ($user) {
        $identifier = $account->account_name ?? $account->account_id;

        if (isset($account->account_metadata['email'])) {
          $identifier = "{$identifier} ({$account->account_metadata['email']})";
        } elseif (isset($account->account_metadata['username'])) {
          $identifier = "{$identifier} (@{$account->account_metadata['username']})";
        }

        $user->notify(new SocialAccountDisconnectedNotification(
          $account->platform,
          $identifier,
          $uniqueActivePosts->count(),
          $orphanedPostsList
        ));
      }

      $account->delete();

      return response()->json([
        'success' => true,
        'message' => 'Account disconnected successfully',
        'orphaned_posts' => $force ? $activePosts->count() : 0,
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Error disconnecting account: ' . $e->getMessage()
      ], 500);
    }
  }
}
