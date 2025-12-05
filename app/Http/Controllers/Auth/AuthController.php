<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{

    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return \Laravel\Socialite\Facades\Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback()
    {
        \Log::info('Google Callback Hit - Starting Process');
        try {
            // Use stateless() to avoid session state issues which are common
            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();

            \Log::info('Google User Retrieved', [
                'email' => $googleUser->getEmail(),
                'id' => $googleUser->getId()
            ]);

            // Find or create user
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                \Log::info('Existing user found, updating...');
                // Update existing user
                $user->update([
                    'name' => $googleUser->getName(),
                    'photo_url' => $googleUser->getAvatar(),
                    'provider' => 'google',
                    'provider_id' => $googleUser->getId(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);
            } else {
                \Log::info('Creating new user...');
                // Create new user
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(Str::random(32)),
                    'photo_url' => $googleUser->getAvatar(),
                    'provider' => 'google',
                    'provider_id' => $googleUser->getId(),
                    'email_verified_at' => now(),
                    'locale' => 'en',
                    'theme' => 'light',
                ]);
            }

            \Log::info('User saved/updated. ID: ' . $user->id);

            // Log the user in
            Auth::login($user, true);
            \Log::info('Auth::login called');

            // Regenerate session
            request()->session()->regenerate();
            \Log::info('Session regenerated. User ID in session: ' . Auth::id());

            return redirect()->route('dashboard');
        } catch (\Exception $e) {
            \Log::error('Google OAuth Critical Error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return redirect()->route('login')->with('error', 'Error al iniciar sesión con Google: ' . $e->getMessage());
        }
    }
}
