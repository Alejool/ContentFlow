<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): array
    {
        $this->ensureIsNotRateLimited();
        $credentials = [
            'email' => $this->input('email'),
            'password' => $this->input('password')
        ];

        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            Log::warning('Login: User not found', ['email' => $credentials['email']]);
            throw ValidationException::withMessages([
                'email' => 'User not found in the system'
            ]);
        }

        if (!Auth::attempt($credentials, true)) {
            Log::warning('Login: Auth::attempt failed', ['email' => $credentials['email']]);
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records'
            ]);
        }

        $this->updateSessionSecurity($user);

        RateLimiter::clear($this->throttleKey());
        $request = request();
        $request->session()->regenerate();

        return [
            'success' => true,
            'user' => Auth::user(),
            'redirect' => route('dashboard'),
            'status' => 200
        ];
    }

    /**
     * Update user security tracking information.
     */
    protected function updateSessionSecurity(User $user): void
    {
        $request = request();
        $previousIp = $user->last_login_ip;
        $currentIp = $request->ip();

        if ($previousIp && $previousIp !== $currentIp) {
            Log::info('User login from new IP', [
                'user_id' => $user->id,
                'email' => $user->email,
                'old_ip' => $previousIp,
                'new_ip' => $currentIp
            ]);
        }

        $userAgent = $request->userAgent();
        $fingerprint = hash('sha256', $userAgent);
        $knownDevices = $user->known_devices ?? [];

        if (!in_array($fingerprint, $knownDevices)) {
            $knownDevices[] = $fingerprint;
            Log::info('User login from new device', [
                'user_id' => $user->id,
                'email' => $user->email,
                'user_agent' => $userAgent
            ]);
        }

        // Update user record
        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $currentIp,
            'known_devices' => $knownDevices,
        ])->save();
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 3)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
    }
}
