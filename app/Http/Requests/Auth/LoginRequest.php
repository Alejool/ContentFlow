<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User; // Asegúrate de importar el modelo User

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

        if (!$this->has('firebase_user') || !isset($this->firebase_user['email'])) {
            throw ValidationException::withMessages([
                'email' => 'Invalid firebase user data'
            ]);
        }

        $firebaseUser = $this->input('firebase_user');
        $user = User::where('email', $firebaseUser['email'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => 'User not found in the system'
            ]);
        }

        // Debug credentials
        $credentials = [
            'email' => $firebaseUser['email'],
            'password' => $this->input('password')
        ];

        \Log::info('Auth attempt credentials:', [
            'email' => $credentials['email'],
            'hasPassword' => !empty($credentials['password'])
        ]);

        if (!Auth::attempt($credentials, true)) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records'
            ]);
        }

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
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
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
