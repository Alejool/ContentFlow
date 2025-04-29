<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SocialAccountController extends Controller
{
    // Obtener todas las cuentas conectadas del usuario
    public function index()
    {
        $accounts = SocialAccount::where('user_id', Auth::id())->get();
        
        return response()->json([
            'success' => true,
            'accounts' => $accounts
        ]);
    }
    
    // Método para obtener URL de autenticación
    public function getAuthUrl(Request $request, $platform)
    {
        // Generar estado aleatorio para prevenir CSRF
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
                $url = 'https://www.tiktok.com/v2/auth/authorize?' . http_build_query([
                    'client_key' => config('services.tiktok.client_key'),
                    'redirect_uri' => url('/auth/tiktok/callback'),
                    'response_type' => 'code',
                    'scope' => 'user.info.basic,video.publish',
                    'state' => $state
                ]);
                break;
                
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Plataforma no soportada'
                ], 400);
        }
        
        return response()->json([
            'success' => true,
            'url' => $url
        ]);
    }
    
    // Callback para Facebook
    public function handleFacebookCallback(Request $request)
    {
        // Verificar estado para prevenir CSRF
        if ($request->state !== session('social_auth_state')) {
            return $this->handleOAuthError('Estado inválido');
        }
        
        // Verificar si hay un código de autorización
        if (!$request->has('code')) {
            return $this->handleOAuthError('No se recibió código de autorización');
        }
        
        try {
            // Intercambiar código por token de acceso
            $response = Http::post('https://graph.facebook.com/v18.0/oauth/access_token', [
                'client_id' => config('services.facebook.client_id'),
                'client_secret' => config('services.facebook.client_secret'),
                'redirect_uri' => url('/auth/facebook/callback'),
                'code' => $request->code,
            ]);
            
            $data = $response->json();
            
            if (!isset($data['access_token'])) {
                return $this->handleOAuthError('No se pudo obtener el token de acceso');
            }
            
            // Obtener información del usuario/página
            $userResponse = Http::withToken($data['access_token'])
                ->get('https://graph.facebook.com/me?fields=id,name');
            
            $userData = $userResponse->json();
            
            if (!isset($userData['id'])) {
                return $this->handleOAuthError('No se pudo obtener información del usuario');
            }
            
            // Guardar la cuenta en la base de datos
            $account = $this->saveAccount([
                'platform' => 'facebook',
                'account_id' => $userData['id'],
                'access_token' => $data['access_token'],
                'refresh_token' => null,
                'token_expires_at' => isset($data['expires_in']) 
                    ? now()->addSeconds($data['expires_in']) 
                    : null,
            ]);
            
            // Cerrar la ventana y enviar mensaje a la ventana principal
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
            return $this->handleOAuthError('Error al procesar la autenticación: ' . $e->getMessage());
        }
    }
    
    // Callback para Instagram
    public function handleInstagramCallback(Request $request)
    {
        // Verificar estado para prevenir CSRF
        if ($request->state !== session('social_auth_state')) {
            return $this->handleOAuthError('Estado inválido');
        }
        
        // Verificar si hay un código de autorización
        if (!$request->has('code')) {
            return $this->handleOAuthError('No se recibió código de autorización');
        }
        
        try {
            // Intercambiar código por token de acceso
            $response = Http::post('https://api.instagram.com/oauth/access_token', [
                'client_id' => config('services.instagram.client_id'),
                'client_secret' => config('services.instagram.client_secret'),
                'redirect_uri' => url('/auth/instagram/callback'),
                'code' => $request->code,
                'grant_type' => 'authorization_code',
            ]);
            
            $data = $response->json();
            
            if (!isset($data['access_token']) || !isset($data['user_id'])) {
                return $this->handleOAuthError('No se pudo obtener el token de acceso');
            }
            
            // Guardar la cuenta en la base de datos
            $account = $this->saveAccount([
                'platform' => 'instagram',
                'account_id' => $data['user_id'],
                'access_token' => $data['access_token'],
                'refresh_token' => null,
                'token_expires_at' => null,
            ]);
            
            // Cerrar la ventana y enviar mensaje a la ventana principal
            return $this->closeWindowWithMessage('success', [
                'platform' => 'instagram',
                'account_id' => $data['user_id'],
                'access_token' => $data['access_token'],
                'refresh_token' => null,
                'token_expires_at' => null
            ]);
            
        } catch (\Exception $e) {
            return $this->handleOAuthError('Error al procesar la autenticación: ' . $e->getMessage());
        }
    }
    
    // Callback para Twitter
    public function handleTwitterCallback(Request $request)
    {
        // Verificar estado para prevenir CSRF
        if ($request->state !== session('social_auth_state')) {
            return $this->handleOAuthError('Estado inválido');
        }
        
        // Verificar si hay un código de autorización
        if (!$request->has('code')) {
            return $this->handleOAuthError('No se recibió código de autorización');
        }
        
        try {
            // Intercambiar código por token de acceso
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
                return $this->handleOAuthError('No se pudo obtener el token de acceso');
            }
            
            // Obtener información del usuario
            $userResponse = Http::withToken($data['access_token'])
                ->get('https://api.twitter.com/2/users/me');
            
            $userData = $userResponse->json();
            
            if (!isset($userData['data']['id'])) {
                return $this->handleOAuthError('No se pudo obtener información del usuario');
            }
            
            // Guardar la cuenta en la base de datos
            $account = $this->saveAccount([
                'platform' => 'twitter',
                'account_id' => $userData['data']['id'],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in']) 
                    ? now()->addSeconds($data['expires_in']) 
                    : null,
            ]);
            
            // Cerrar la ventana y enviar mensaje a la ventana principal
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
            return $this->handleOAuthError('Error al procesar la autenticación: ' . $e->getMessage());
        }
    }
    
    // Callback para YouTube
    public function handleYoutubeCallback(Request $request)
    {
        // Verificar estado para prevenir CSRF
        if ($request->state !== session('social_auth_state')) {
            return $this->handleOAuthError('Estado inválido');
        }
        
        // Verificar si hay un código de autorización
        if (!$request->has('code')) {
            return $this->handleOAuthError('No se recibió código de autorización');
        }
        
        try {
            // Intercambiar código por token de acceso
            $response = Http::post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => url('/auth/youtube/callback'),
                'code' => $request->code,
                'grant_type' => 'authorization_code',
            ]);
            
            $data = $response->json();
            
            if (!isset($data['access_token'])) {
                return $this->handleOAuthError('No se pudo obtener el token de acceso');
            }
            
            // Obtener información del canal
            $channelResponse = Http::withToken($data['access_token'])
                ->get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true');
            
            $channelData = $channelResponse->json();
            
            if (!isset($channelData['items'][0]['id'])) {
                return $this->handleOAuthError('No se pudo obtener información del canal');
            }
            
            // Guardar la cuenta en la base de datos
            $account = $this->saveAccount([
                'platform' => 'youtube',
                'account_id' => $channelData['items'][0]['id'],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => isset($data['expires_in']) 
                    ? now()->addSeconds($data['expires_in']) 
                    : null,
            ]);
            
            // Cerrar la ventana y enviar mensaje a la ventana principal
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
            return $this->handleOAuthError('Error al procesar la autenticación: ' . $e->getMessage());
        }
    }
    
    // Callback para TikTok
    public function handleTiktokCallback(Request $request)
    {
        // Verificar estado para prevenir CSRF
        if ($request->state !== session('social_auth_state')) {
            return $this->handleOAuthError('Estado inválido');
        }
        
        // Verificar si hay un código de autorización
        if (!$request->has('code')) {
            return $this->handleOAuthError('No se recibió código de autorización');
        }
        
        try {
            // Intercambiar código por token de acceso
            $response = Http::post('https://open-api.tiktok.com/oauth/access_token/', [
                'client_key' => config('services.tiktok.client_key'),
                'client_secret' => config('services.tiktok.client_secret'),
                'code' => $request->code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => url('/auth/tiktok/callback'),
            ]);
            
            $data = $response->json();
            
            if (!isset($data['data']['access_token']) || !isset($data['data']['open_id'])) {
                return $this->handleOAuthError('No se pudo obtener el token de acceso');
            }
            
            // Guardar la cuenta en la base de datos
            $account = $this->saveAccount([
                'platform' => 'tiktok',
                'account_id' => $data['data']['open_id'],
                'access_token' => $data['data']['access_token'],
                'refresh_token' => $data['data']['refresh_token'] ?? null,
                'token_expires_at' => isset($data['data']['expires_in']) 
                    ? now()->addSeconds($data['data']['expires_in']) 
                    : null,
            ]);
            
            // Cerrar la ventana y enviar mensaje a la ventana principal
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
            return $this->handleOAuthError('Error al procesar la autenticación: ' . $e->getMessage());
        }
    }
    
    // Método auxiliar para guardar la cuenta
    private function saveAccount($data)
    {
        // Verificar si ya existe una cuenta para esta plataforma
        $existingAccount = SocialAccount::where('user_id', Auth::id())
            ->where('platform', $data['platform'])
            ->first();
            
        if ($existingAccount) {
            // Actualizar cuenta existente
            $existingAccount->update([
                'account_id' => $data['account_id'],
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => $data['token_expires_at'] ?? null,
            ]);
            return $existingAccount;
        } else {
            // Crear nueva cuenta
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
    
    // Método para manejar errores de OAuth
    private function handleOAuthError($message)
    {
        return view('oauth.callback', [
            'success' => false,
            'message' => $message
        ]);
    }
    
    // Método para cerrar la ventana y enviar mensaje a la ventana principal
    private function closeWindowWithMessage($status, $data = [])
    {
        return view('oauth.callback', [
            'success' => $status === 'success',
            'data' => json_encode($data)
        ]);
    }
}