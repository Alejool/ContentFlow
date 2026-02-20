<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use App\Mail\PasswordRecoveryMail;


class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' =>'required|string|min:8|max:255',
            'provider' => 'nullable|string',
            'provider_id' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'locale' => 'nullable|string|in:en,es',
        ], [
            'email.unique' => 'Ya existe una cuenta con ese correo electrónico.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'name.required' => 'El nombre es obligatorio.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'provider' => $request->provider,
            'provider_id' => $request->provider_id,
            'password' => Hash::make($request->password),
            'locale' => $request->locale ?? 'es', // Default to Spanish
        ]);

        event(new Registered($user));
        
        // Initialize onboarding for new users
        $onboardingService = app(\App\Services\OnboardingService::class);
        $onboardingService->initializeOnboarding($user);
        Log::info('Onboarding initialized for new user', ['user_id' => $user->id]);
        
        // Log in and regenerate session
        Auth::login($user);
        $request->session()->regenerate();

        // Send email verification notification
        try {
            $user->sendEmailVerificationNotification();
            Log::info('Email verification sent to: ' . $user->email);
        } catch (\Exception $e) {
            Log::error('Failed to send verification email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => Auth::user(),
            'redirect' => route('dashboard'),
            'status' => 200
        ]);
    }
}


