<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
class AuthController extends Controller
{
    public function redirectToGoogle()
    {
        $redirect = Socialite::driver('google')->redirect();
        return $redirect;
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                $user->update([
                    'name' => $googleUser->getName(),
                    'photo_url' => $googleUser->getAvatar(),
                    'provider' => 'google',
                    'provider_id' => $googleUser->getId(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);
            } else {
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
            Auth::login($user, true);
            request()->session()->regenerate();
            return redirect()->route('dashboard');
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Error al iniciar sesión con Google: ' . $e->getMessage());
        }
    }
}
