<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Log;

use App\Models\User;

class AuthController extends Controller
{
  public function redirectToGoogle()
  {
    $redirect = Socialite::driver('google')->redirect();
    return $redirect;
  }

  public function handleGoogleCallback()
  {
    Log::info('Google Callback: Started');
    try {
      /** @var \Laravel\Socialite\Two\User $googleUser */
      $googleUser = Socialite::driver('google')->stateless()->user();
      Log::info('Google Callback: User received', ['email' => $googleUser->getEmail()]);

      $user = User::where('email', $googleUser->getEmail())->first();
      $isNewUser = false;

      if ($user) {
        $user->update([
          'name' => $googleUser->getName(),
          'photo_url' => $googleUser->getAvatar(),
          'provider' => 'google',
          'provider_id' => $googleUser->getId(),
          'email_verified_at' => $user->email_verified_at ?? now(),
        ]);
      } else {
        $isNewUser = true;
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
          'created_ip' => request()->ip(),
        ]);
        
        // Initialize onboarding for new users
        $onboardingService = app(\App\Services\OnboardingService::class);
        $onboardingService->initializeOnboarding($user);
        Log::info('Google Callback: Onboarding initialized for new user', ['user_id' => $user->id]);
      }
      
      Auth::login($user, true);
      $user->updateLoginStats();
      Log::info('Google Callback: User logged in', ['id' => $user->id, 'is_new' => $isNewUser]);

      // request()->session()->regenerate(); // Potentially causing race conditions in Docker/mixed content
      request()->session()->save();
      Log::info('Google Callback: Session saved', ['user_id' => $user->id, 'session_id' => request()->session()->getId()]);

      return redirect()->route('dashboard');
    } catch (\Exception $e) {
      Log::error('Google Callback: Error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
      return redirect()->route('login')->with('error', 'Error al iniciar sesión con Google: ' . $e->getMessage());
    }
  }

  /**
   * Handle authentication via API token (e.g., from a mobile app or frontend SDK).
   */
  public function handleGoogleAuth(Request $request)
  {
    return response()->json(['message' => 'API Google Auth not fully implemented. please use /auth/google/redirect'], 501);
  }
}
