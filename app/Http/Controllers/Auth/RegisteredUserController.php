<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
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
use App\Services\Onboarding\OnboardingService;


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
    public function store(RegisterRequest $request)
    {

        $createdIp = $request->ip();
        $geo = app(\App\Services\Analytics\GeoIpService::class)->lookup($createdIp);

        $user = User::create([
            'name'         => $request->name,
            'email'        => $request->email,
            'provider'     => $request->provider,
            'provider_id'  => $request->provider_id,
            'password'     => Hash::make($request->password),
            'locale'       => $request->locale ?? 'es',
            'created_ip'   => $createdIp,
            'country_code' => $geo['country_code'] ?? null,
            'country'      => $geo['country'] ?? null,
            'timezone'     => $geo['timezone'] ?? 'UTC',
        ]);

        event(new Registered($user));
        
        // Initialize onboarding for new users
        $onboardingService = app(OnboardingService::class);
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
            'message' => __('messages.auth.user_registered'),
            'user' => Auth::user(),
            'redirect' => route('dashboard'),
            'status' => 200
        ]);
    }
}


