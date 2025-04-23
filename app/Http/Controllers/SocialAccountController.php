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
    
    // Obtener URL de autorización para una plataforma
    public function getAuthUrl($platform)
    {
        $url = '';
        $state = Str::random(40);
        
        // Guardar estado en sesión para validación posterior
        session(['social_auth_state' => $state]);
        
        switch (strtolower($platform)) {
            case 'facebook':
                $url = 'https://www.facebook.com/v12.0/dialog/oauth?' . http_build_query([
                    'client_id' => config('services.facebook.client_id'),
                    'redirect_uri' => config('services.facebook.redirect'),
                    'state' => $state,
                    'scope' => 'email,public_profile,pages_show_list,pages_manage_posts'
                ]);
                break;
                
            case 'instagram':
                $url = 'https://api.instagram.com/oauth/authorize?' . http_build_query([
                    'client_id' => config('services.instagram.client_id'),
                    'redirect_uri' => config('services.instagram.redirect'),
                    'response_type' => 'code',
                    'scope' => 'user_profile,user_media',
                    'state' => $state
                ]);
                break;
                
            case 'twitter':
                $url = 'https://twitter.com/i/oauth2/authorize?' . http_build_query([
                    'client_id' => config('services.twitter.client_id'),
                    'redirect_uri' => config('services.twitter.redirect'),
                    'response_type' => 'code',
                    'scope' => 'tweet.read tweet.write users.read',
                    'state' => $state
                ]);
                break;
                
            case 'youtube':
                $url = 'https://accounts.google.com/o/oauth2/auth?' . http_build_query([
                    'client_id' => config('services.google.client_id'),
                    'redirect_uri' => config('services.google.redirect'),
                    'response_type' => 'code',
                    'scope' => 'https://www.googleapis.com/auth/youtube',
                    'access_type' => 'offline',
                    'state' => $state
                ]);
                break;
                
            // Implementar TikTok según su API
            
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
    
    // Guardar nueva cuenta social
    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform' => 'required|string|in:facebook,instagram,tiktok,twitter,youtube',
            'account_id' => 'required|string',
            'access_token' => 'required|string',
            'refresh_token' => 'nullable|string',
            'token_expires_at' => 'nullable|date'
        ]);
        
        // Verificar si ya existe una cuenta para esta plataforma
        $existingAccount = SocialAccount::where('user_id', Auth::id())
            ->where('platform', $validated['platform'])
            ->first();
            
        if ($existingAccount) {
            // Actualizar cuenta existente
            $existingAccount->update($validated);
            $account = $existingAccount;
        } else {
            // Crear nueva cuenta
            $account = SocialAccount::create([
                'user_id' => Auth::id(),
                'platform' => $validated['platform'],
                'account_id' => $validated['account_id'],
                'access_token' => $validated['access_token'],
                'refresh_token' => $validated['refresh_token'] ?? null,
                'token_expires_at' => $validated['token_expires_at'] ?? null
            ]);
        }
        
        return response()->json([
            'success' => true,
            'account' => $account
        ]);
    }
    
    // Eliminar cuenta social
    public function destroy($id)
    {
        $account = SocialAccount::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Cuenta no encontrada'
            ], 404);
        }
        
        $account->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Cuenta desconectada exitosamente'
        ]);
    }
    
    // Callback para cada plataforma
    // Estos métodos serían llamados por las redirecciones de OAuth
    // y enviarían los datos a la ventana principal mediante postMessage
}