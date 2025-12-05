<?php

namespace App\Http\Controllers\SocialAccount;

use App\Models\SocialAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;

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
                    'scope' => 'pages_show_list,pages_read_engagement,pages_manage_posts,public_profile',
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
                $url = 'https://twitter.com/i/oauth2/authorize?' . http_build_query([
                    'client_id' => config('services.twitter.client_id'),
                    'redirect_uri' => url('/auth/twitter/callback'),
                    'response_type' => 'code',
                    'scope' => 'tweet.read tweet.write users.read offline.access',
                    'state' => $state,
                    'code_challenge' => 'challenge',
                    'code_challenge_method' => 'plain'
                ]);
                break;
                
            case 'youtube':
                $url = 'https://accounts.google.com/o/oauth2/auth?' . http_build_query([
                    'client_id' => config('services.google.client_id'),
                    'redirect_uri' => url('/auth/youtube/callback'),
                    'response_type' => 'code',
                    'scope' => 'https://www.googleapis.com/auth/youtube',
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
                ->get('https://graph.facebook.com/me?fields=id,name');
            
            $userData = $userResponse->json();
            
            if (!isset($userData['id'])) {
                return $this->handleOAuthError('Could not obtain user information');
            }
            
            // Save the account to the database
            $account = $this->saveAccount([
                'platform' => 'facebook',
                'account_id' => $userData['id'],
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
        // Verify state to prevent CSRF
        if ($request->state !== session('social_auth_state')) {
            return $this->handleOAuthError('Invalid state');
        }
        
        // Check if there is an authorization code
        if (!$request->has('code')) {
            return $this->handleOAuthError('Authorization code not received');
        }
        
        try {
            // Exchange code for access token (Instagram Basic Display API)
            $response = Http::asForm()->post('https://api.instagram.com/oauth/access_token', [
                'client_id' => config('services.instagram.client_id'),
                'client_secret' => config('services.instagram.client_secret'),
                'redirect_uri' => url('/auth/instagram/callback'),
                'code' => $request->code,
                'grant_type' => 'authorization_code',
            ]);
            
            $data = $response->json();
            
            if (!isset($data['access_token']) || !isset($data['user_id'])) {
                \Log::error('Instagram OAuth Error:', $data);
                return $this->handleOAuthError('Could not obtain access token: ' . json_encode($data));
            }
            
            // Exchange for long-lived token (expires in 60 days)
            $longLivedResponse = Http::get('https://graph.instagram.com/access_token', [
                'grant_type' => 'ig_exchange_token',
                'client_secret' => config('services.instagram.client_secret'),
                'access_token' => $data['access_token']
            ]);
            
            $longLivedData = $longLivedResponse->json();
            $finalAccessToken = $longLivedData['access_token'] ?? $data['access_token'];
            $expiresIn = $longLivedData['expires_in'] ?? null;
            
            // Save the account to the database
            $account = $this->saveAccount([
                'platform' => 'instagram',
                'account_id' => $data['user_id'],
                'access_token' => $finalAccessToken,
                'refresh_token' => null,
                'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
            ]);
            
            // Close the window and send message to the main window
            return $this->closeWindowWithMessage('success', [
                'platform' => 'instagram',
                'account_id' => $data['user_id'],
                'access_token' => $finalAccessToken,
                'refresh_token' => null,
                'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn)->toIso8601String() : null
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Instagram OAuth Exception:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
        }
    }
    
    // Callback for Twitter
    public function handleTwitterCallback(Request $request)
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
            $response = Http::asForm()->post('https://api.twitter.com/2/oauth2/token', [
                'client_id' => config('services.twitter.client_id'),
                'client_secret' => config('services.twitter.client_secret'),
                'redirect_uri' => url('/auth/twitter/callback'),
                'code' => $request->code,
                'grant_type' => 'authorization_code',
                'code_verifier' => 'challenge',
            ]);
            
            $data = $response->json();
            
            if (!isset($data['access_token'])) {
                return $this->handleOAuthError('Could not obtain access token');
            }
            
            // Get user information
            $userResponse = Http::withToken($data['access_token'])
                ->get('https://api.twitter.com/2/users/me');
            
            $userData = $userResponse->json();
            
            if (!isset($userData['data']['id'])) {
                return $this->handleOAuthError('Could not obtain user information');
            }
            
            // Save the account to the database
            $account = $this->saveAccount([
                'platform' => 'twitter',
                'account_id' => $userData['data']['id'],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in']) 
                    ? now()->addSeconds($data['expires_in']) 
                    : null,
            ]);
            
            // Close the window and send message to the main window
            return $this->closeWindowWithMessage('success', [
                'platform' => 'twitter',
                'account_id' => $userData['data']['id'],
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
                ->get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true');
            
            $channelData = $channelResponse->json();
            
            if (!isset($channelData['items'][0]['id'])) {
                return $this->handleOAuthError('Could not obtain channel information');
            }
            
            // Save the account to the database
            $account = $this->saveAccount([
                'platform' => 'youtube',
                'account_id' => $channelData['items'][0]['id'],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in']) 
                    ? now()->addSeconds($data['expires_in']) 
                    : null,
            ]);
            
            // Close the window and send message to the main window
            return $this->closeWindowWithMessage('success', [
                'platform' => 'youtube',
                'account_id' => $channelData['items'][0]['id'],
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
    
    // Callback for TikTok
    public function handleTiktokCallback(Request $request)
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
            // Get code verifier from session
            $codeVerifier = session('tiktok_code_verifier');
            
            if (!$codeVerifier) {
                return $this->handleOAuthError('Code verifier not found in session');
            }
            
            // Exchange code for access token with code_verifier
            $response = Http::asForm()->post('https://open.tiktokapis.com/v2/oauth/token/', [
                'client_key' => config('services.tiktok.client_key'),
                'client_secret' => config('services.tiktok.client_secret'),
                'code' => $request->code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => url('/auth/tiktok/callback'),
                'code_verifier' => $codeVerifier,
            ]);
            
            $data = $response->json();
            
            // Clear code verifier from session
            session()->forget('tiktok_code_verifier');
            
            if (!isset($data['data']['access_token']) || !isset($data['data']['open_id'])) {
                return $this->handleOAuthError('Could not obtain access token');
            }
            
            // Save the account to the database
            $account = $this->saveAccount([
                'platform' => 'tiktok',
                'account_id' => $data['data']['open_id'],
                'access_token' => $data['data']['access_token'],
                'refresh_token' => $data['data']['refresh_token'] ?? null,
                'token_expires_at' => isset($data['data']['expires_in']) 
                    ? now()->addSeconds($data['data']['expires_in']) 
                    : null,
            ]);
            
            // Close the window and send message to the main window
            return $this->closeWindowWithMessage('success', [
                'platform' => 'tiktok',
                'account_id' => $data['data']['open_id'],
                'access_token' => $data['data']['access_token'],
                'refresh_token' => $data['data']['refresh_token'] ?? null,
                'token_expires_at' => isset($data['data']['expires_in']) 
                    ? now()->addSeconds($data['data']['expires_in'])->toIso8601String() 
                    : null
            ]);
            
        } catch (\Exception $e) {
            return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
        }
    }
    
    // Helper method to save the account
    private function saveAccount($data)
    {
        // Check if an account already exists for this platform
        $existingAccount = SocialAccount::where('user_id', Auth::id())
            ->where('platform', $data['platform'])
            ->first();
            
        if ($existingAccount) {
            // Update existing account
            $existingAccount->update([
                'account_id' => $data['account_id'],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => $data['token_expires_at'] ?? null,
            ]);
            return $existingAccount;
        } else {
            // Create new account
            return SocialAccount::create([
                'user_id' => Auth::id(),
                'platform' => $data['platform'],
                'account_id' => $data['account_id'],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => $data['token_expires_at'] ?? null,
            ]);
        }
    }
    
    // Method to handle OAuth errors
    private function handleOAuthError($message)
    {
        return view('oauth.callback', [
            'success' => false,
            'message' => $message
        ]);
    }
    
    // Method to close the window and send message to the main window
    private function closeWindowWithMessage($status, $data = [])
    {
        return view('oauth.callback', [
            'success' => $status === 'success',
            'data' => json_encode($data)
        ]);
    }
    
    // Store a new social account
    public function store(Request $request)
    {
        $request->validate([
            'platform' => 'required|string|in:facebook,instagram,twitter,youtube,tiktok',
            'account_id' => 'required|string',
            'access_token' => 'required|string',
            'refresh_token' => 'nullable|string',
            'token_expires_at' => 'nullable|date',
        ]);
        
        try {
            $account = $this->saveAccount([
                'platform' => $request->platform,
                'account_id' => $request->account_id,
                'access_token' => $request->access_token,
                'refresh_token' => $request->refresh_token,
                'token_expires_at' => $request->token_expires_at,
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
    public function destroy($id)
    {
        try {
            $account = SocialAccount::where('id', $id)
                ->where('user_id', Auth::id())
                ->first();
                
            if (!$account) {
                return response()->json([
                    'success' => false,
                    'message' => 'Account not found'
                ], 404);
            }
            
            $account->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Account disconnected successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error disconnecting account: ' . $e->getMessage()
            ], 500);
        }
    }
}