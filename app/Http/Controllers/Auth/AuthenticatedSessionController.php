<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

use App\Models\User;
/*
|--------------------------------------------------------------------------
| Login Controller
|--------------------------------------------------------------------------
|
| This controller handles authenticating users for the application and
| redirecting them to your home screen. The controller uses a trait
| to conveniently provide its functionality to your applications.
|
*/

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    public function store(LoginRequest $request)
    {
        Log::info('Login: Attempting Normal Login', ['email' => $request->input('email')]);
        try {
            $return = $request->authenticate();
            Log::info('Login: Authenticate Success', ['user_id' => Auth::id()]);

            $request->session()->regenerate();
            // Explicitly save session to prevent race conditions
            $request->session()->save();
            Log::info('Login: Session Regenerated and Saved');

            return response()->json($return);
            Log::info('Login: Session Regenerated and Saved');

            return response()->json($return);
        } catch (ValidationException $e) {
            // Let the frontend handle validation errors (422) naturally
            throw $e;
        } catch (\Exception $e) {
            Log::error('Login: Exception', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Authentication failed: ' . $e->getMessage()
            ], 401);
        }
    }

    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function checkUser(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user && $user->provider) {
            return response()->json([
                'provider' => $user->provider,
            ]);
        }

        return response()->json([
            'provider' => null,
        ]);
    }
}
