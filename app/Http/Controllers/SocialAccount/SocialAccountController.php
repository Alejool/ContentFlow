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

class SocialAccountController extends Controller
{
    // Get all connected accounts for the user
    public function index()
    {
        $accounts = SocialAccount::where('user_id', Auth::id())->get();

        return response()->json([
            'success' => true,
            'accounts' => $accounts
        ]);
    }

    // Method to get authentication URL
    public function getAuthUrl(Request $request, $platform)
    {
        // Generate random state to prevent CSRF
        $state = Str::random(40);
        session(['social_auth_state' => $state]);

        $url = '';

        switch (strtolower($platform)) {
            case 'facebook':
                $url = 'https://www.facebook.com/v18.0/dialog/oauth?' . http_build_query([
                    'client_id' => config('services.facebook.client_id'),
                    'redirect_uri' => url('/auth/facebook/callback'),
                    'response_type' => 'code',
                    'scope' => 'pages_show_list,pages_read_engagement,pages_show_list,pages_read_engagement ,public_profile',
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
                $codeVerifier = Str::random(128);
                $codeChallenge = strtr(rtrim(
                    base64_encode(hash('sha256', $codeVerifier, true)),
                    '='
                ), '+/', '-_');

                session(['twitter_code_verifier' => $codeVerifier]);

                $url = 'https://twitter.com/i/oauth2/authorize?' . http_build_query([
                    'client_id' => config('services.twitter.client_id'),
                    'redirect_uri' => url('/auth/twitter/callback'),
                    'response_type' => 'code',
                    'scope' => 'tweet.read tweet.write users.read offline.access',
                    'state' => $state,
                    'code_challenge' => $codeChallenge,
                    'code_challenge_method' => 'S256' // Cambiar a S256
                ]);
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
                // Generate PKCE code verifier and challenge for TikTok
                $codeVerifier = Str::random(128);
                $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');

                // Store code verifier in session for later use in callback
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

    // Callback for Facebook
    public function handleFacebookCallback(Request $request)
    {
        // Verify state to prevent CSRF
        if ($request->state !== session('social_auth_state')) {
            return $this->handleOAuthError('Invalid state');
        }

        // Check if there is an authorization code
        if (!$request->has('code')) {
            return $this->handleOAuthError('Authorization code not received');
        }



        try {
            // Exchange code for access token
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

            // Get user/page information
            $userResponse = Http::withToken($data['access_token'])
                ->get('https://graph.facebook.com/me?fields=id,name,picture');

            $userData = $userResponse->json();

            if (!isset($userData['id'])) {
                return $this->handleOAuthError('Could not obtain user information');
            }

            // Save the account to the database
            $account = $this->saveAccount([
                'platform' => 'facebook',
                'account_id' => $userData['id'],
                'account_name' => $userData['name'] ?? null,
                'account_metadata' => [
                    'avatar' => $userData['picture']['data']['url'] ?? null,
                ],
                'access_token' => $data['access_token'],
                'refresh_token' => null,
                'token_expires_at' => isset($data['expires_in'])
                    ? now()->addSeconds($data['expires_in'])
                    : null,
            ]);

            // Close the window and send message to the main window
            return $this->closeWindowWithMessage('success', [
                'platform' => 'facebook',
                'account_id' => $userData['id'],
                'account_name' => $userData['name'] ?? null,
                'avatar' => $userData['picture']['data']['url'] ?? null,
                'access_token' => $data['access_token'],
                'refresh_token' => null,
                'token_expires_at' => isset($data['expires_in'])
                    ? now()->addSeconds($data['expires_in'])->toIso8601String()
                    : null
            ]);
        } catch (\Exception $e) {
            return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
        }
    }

    // Callback for Instagram
    public function handleInstagramCallback(Request $request)
    {
        // ... (Verification logic remains same until user info fetch)
        // Verify state to prevent CSRF
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
                Log::error('Instagram OAuth Error:', $data);
                return $this->handleOAuthError('Could not obtain access token: ' . json_encode($data));
            }

            // Fetch user profile (username) - Basic Display API
            $userResponse = Http::get("https://graph.instagram.com/{$data['user_id']}", [
                'fields' => 'id,username,account_type',
                'access_token' => $data['access_token']
            ]);

            $userData = $userResponse->json();

            // Exchange for long-lived token
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
                'account_id' => $data['user_id'],
                'account_name' => $userData['username'] ?? null,
                'access_token' => $finalAccessToken,
                'refresh_token' => null,
                'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn)->toIso8601String() : null
            ]);
        } catch (\Exception $e) {
            Log::error('Instagram OAuth Exception:', ['message' => $e->getMessage()]);
            return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
        }
    }

    // Callback for Twitter
    public function handleTwitterCallback(Request $request)
    {
        // ... (Verification logic)
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

            // Get user information with profile fields
            $userResponse = Http::withToken($data['access_token'])
                ->get('https://api.twitter.com/2/users/me', [
                    'user.fields' => 'profile_image_url,username,name'
                ]);

            $userData = $userResponse->json();

            if (!isset($userData['data']['id'])) {
                return $this->handleOAuthError('Could not obtain user information');
            }

            $userInfo = $userData['data'];

            $account = $this->saveAccount([
                'platform' => 'twitter',
                'account_id' => $userInfo['id'],
                'account_name' => $userInfo['name'] ?? $userInfo['username'] ?? null,
                'account_metadata' => [
                    'username' => $userInfo['username'] ?? null,
                    'avatar' => $userInfo['profile_image_url'] ?? null,
                ],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in'])
                    ? now()->addSeconds($data['expires_in'])
                    : null,
            ]);

            return $this->closeWindowWithMessage('success', [
                'platform' => 'twitter',
                'account_id' => $userInfo['id'],
                'account_name' => $userInfo['name'] ?? null,
                'username' => $userInfo['username'] ?? null,
                'avatar' => $userInfo['profile_image_url'] ?? null,
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in'])
                    ? now()->addSeconds($data['expires_in'])->toIso8601String()
                    : null
            ]);
        } catch (\Exception $e) {
            return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
        }
    }

    // Callback for YouTube
    public function handleYoutubeCallback(Request $request)
    {
        // ... (Verification logic)
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

            // Get channel information
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

            // Get Google User Info (Email)
            $userInfoResponse = Http::withToken($data['access_token'])
                ->get('https://www.googleapis.com/oauth2/v3/userinfo');
            $userInfo = $userInfoResponse->json();
            $userEmail = $userInfo['email'] ?? null;

            $account = $this->saveAccount([
                'platform' => 'youtube',
                'account_id' => $channelData['items'][0]['id'],
                'account_name' => $channelInfo['title'] ?? null,
                'account_metadata' => [
                    'avatar' => $channelInfo['thumbnails']['default']['url'] ?? null,
                    'description' => $channelInfo['description'] ?? null,
                    'username' => $channelInfo['customUrl'] ?? null,
                    'email' => $userEmail // Save email in metadata
                ],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in'])
                    ? now()->addSeconds($data['expires_in'])
                    : null,
            ]);

            return $this->closeWindowWithMessage('success', [
                'platform' => 'youtube',
                'account_id' => $channelData['items'][0]['id'],
                'account_name' => $channelInfo['title'] ?? null,
                'avatar' => $channelInfo['thumbnails']['default']['url'] ?? null,
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in'])
                    ? now()->addSeconds($data['expires_in'])->toIso8601String()
                    : null
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
            // Preparar los datos del request
            $tokenData = [
                'client_key' => config('services.tiktok.client_key'),
                'client_secret' => config('services.tiktok.client_secret'),
                'code' => $request->code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => url('/auth/tiktok/callback'),
                'code_verifier' => $codeVerifier,
            ];

            // Log para debugging (eliminar en producción)
            \Log::info('TikTok Token Request', [
                'url' => 'https://open.tiktokapis.com/v2/oauth/token/',
                'data' => array_merge($tokenData, [
                    'client_secret' => '***', // Ocultar en logs
                    'code_verifier' => '***'
                ])
            ]);


            // ✅ LOG COMPLETO DE LO QUE ENVÍAS
            \Log::info('TikTok Token Request FULL', [
                'url' => 'https://open.tiktokapis.com/v2/oauth/token',
                'client_key' => $tokenData['client_key'],
                'client_secret_length' => strlen($tokenData['client_secret']),
                'code' => $tokenData['code'],
                'code_length' => strlen($tokenData['code']),
                'grant_type' => $tokenData['grant_type'],
                'redirect_uri' => $tokenData['redirect_uri'],
                'code_verifier' => $tokenData['code_verifier'],
                'code_verifier_length' => strlen($tokenData['code_verifier']),
            ]);

            $response = Http::asForm()->post('https://open.tiktokapis.com/v2/oauth/token/', $tokenData);

            $data = $response->json();

            // Log de la respuesta completa
            \Log::info('TikTok Token Response', [
                'status' => $response->status(),
                'body' => $data
            ]);

            // Limpiar sesión
            session()->forget(['tiktok_code_verifier', 'social_auth_state']);

            // Verificar errores en la respuesta
            if (isset($data['error'])) {
                \Log::error('TikTok OAuth Error', $data);
                return $this->handleOAuthError(
                    'TikTok error: ' . ($data['error_description'] ?? $data['error']['message'] ?? $data['error'])
                );
            }

            // TikTok puede retornar en diferentes estructuras
            $accessToken = $data['access_token'] ?? $data['data']['access_token'] ?? null;
            $openId = $data['open_id'] ?? $data['data']['open_id'] ?? null;
            $expiresIn = $data['expires_in'] ?? $data['data']['expires_in'] ?? null;
            $refreshToken = $data['refresh_token'] ?? $data['data']['refresh_token'] ?? null;

            if (!$accessToken) {
                \Log::error('TikTok Access Token Not Found', ['response' => $data]);
                return $this->handleOAuthError('Could not obtain access token from TikTok');
            }

            if (!$openId) {
                \Log::error('TikTok Open ID Not Found', ['response' => $data]);
                return $this->handleOAuthError('Could not obtain user ID from TikTok');
            }

            // Obtener información del usuario
            $userResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])->post('https://open.tiktokapis.com/v2/user/info/', [
                'fields' => 'open_id,union_id,avatar_url,display_name'
            ]);

            $userData = $userResponse->json();

            \Log::info('TikTok User Info Response', [
                'status' => $userResponse->status(),
                'body' => $userData
            ]);

            $userInfo = $userData['data']['user'] ?? [];

            $account = $this->saveAccount([
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
                'account_id' => $openId,
                'account_name' => $userInfo['display_name'] ?? null,
                'avatar' => $userInfo['avatar_url'] ?? null,
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn)->toIso8601String() : null
            ]);
        } catch (\Exception $e) {
            \Log::error('TikTok OAuth Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
        }
    }

    // Helper method to save the account
    private function saveAccount($data)
    {
        // Check if an account already exists for this platform (including trashed)
        $existingAccount = SocialAccount::withTrashed()
            ->where('user_id', Auth::id())
            ->where('platform', $data['platform'])
            ->where('account_id', $data['account_id'])
            ->first();

        // Prepare data for update/create
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
            // Restore if deleted
            if ($existingAccount->trashed()) {
                $existingAccount->restore();
                $wasReconnection = true;

                // Healing Logic: Restore 'orphaned' posts to 'published'
                // This ensures re-linking if the SAME account connects again
                SocialPostLog::where('social_account_id', $existingAccount->id)
                    ->where('status', 'orphaned')
                    ->update([
                        'status' => 'published',
                        'error_message' => null
                    ]);
            }

            // Update existing account
            $existingAccount->update($accountData);
            $account = $existingAccount;
        } else {
            // Create new account
            $accountData['user_id'] = Auth::id();
            $accountData['platform'] = $data['platform'];
            $account = SocialAccount::create($accountData);
            $isNewConnection = true;
        }

        // Determine best identifier for notification
        $identifier = $data['account_name'] ?? $data['account_id'];

        if (isset($data['account_metadata']['email'])) {
            $identifier = "{$identifier} ({$data['account_metadata']['email']})";
        } elseif (isset($data['account_metadata']['username'])) {
            $identifier = "{$identifier} (@{$data['account_metadata']['username']})";
        }

        // Send system notification for account connection
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

    // ... (rest of the file: handleOAuthError, closeWindowWithMessage, store, destroy)
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
            // Validation for optional fields
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

    // Delete/disconnect a social account
    public function destroy(Request $request, $id)
    {
        try {
            $account = SocialAccount::where('id', $id)
                ->where('user_id', Auth::id())
                ->first();

            if (!$account) {
                return response()->json([
                    'success' => false,
                    'message' => trans('notifications.account_not_found', [], $account->user->preferredLocale())
                ], 404);
            }

            $force = $request->query('force') === 'true' || $request->input('force') === true;

            // Check for active published posts (not just scheduled)
            $activePosts = SocialPostLog::where('social_account_id', $account->id)
                ->whereIn('status', ['published', 'pending'])
                ->with('publication:id,title')
                ->get();

            // Deduplicate active posts by publication_id
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
                        // Fallback to created_at if published_at is missing/invalid
                        if (!$date && $log->created_at instanceof \DateTimeInterface) $date = $log->created_at;

                        if ($date && $date->format('Y') < 2000) $date = null; // Sanity check

                        return [
                            'id' => $log->publication_id,
                            'title' => optional($log->publication)->title ?? 'Untitled',
                            'platform_post_id' => $log->platform_post_id,
                            'status' => $log->status,
                            'published_at' => $date ? $date->toIso8601String() : null,
                        ];
                    })->values(),
                    'message' => trans('notifications.try_account_disconnected', ['account_name' => $account->account_name, 'uniqueActivePosts' => $uniqueActivePosts->count(), 'platform' => $account->platform], $account->user->preferredLocale())
                ], 400);
            }

            // Check for associated scheduled posts
            $pendingPosts = ScheduledPost::where('social_account_id', $account->id)
                ->where('status', 'pending')
                ->with(['campaign:id,title', 'publication:id,title'])
                ->get();

            // Deduplicate pending posts by publication_id (or id if null, though duplications usually share publication_id)
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
                            // Fallback to created_at if scheduled_at is missing
                            if (!$date && $post->created_at instanceof \DateTimeInterface) $date = $post->created_at;

                            if ($date && $date->format('Y') < 2000) $date = null;

                            return [
                                'id' => $post->id,
                                'title' => optional($post->publication)->title ?? optional($post->campaign)->title ?? 'Untitled',
                                'scheduled_at' => $date ? $date->toIso8601String() : null,
                                'status' => $post->status,
                            ];
                        })->values()
                    ], 400);
                } else {
                    // Force delete: delete posts first
                    foreach ($pendingPosts as $post) {
                        $post->delete();
                    }
                }
            }

            // If forcing disconnect with active posts, mark them as orphaned
            $orphanedPostsList = [];
            if ($force && $uniqueActivePosts->count() > 0) {
                // Keep track of unique titles for notification
                $orphanedPostsList = $uniqueActivePosts->map(fn($log) => optional($log->publication)->title ?? 'Untitled')->toArray();

                SocialPostLog::where('social_account_id', $account->id)
                    ->whereIn('status', ['published', 'pending'])
                    ->update([
                        'status' => 'orphaned',
                        'error_message' => "Account '{$account->account_name}' was disconnected - cannot manage remotely"
                    ]);
            }

            // Send application notification for account disconnection
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
