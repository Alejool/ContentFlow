<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

use function Laravel\Prompts\warning;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request)
    {
        try {
            $user = $request->user();
            $validated = $request->validated();
            
            $changes = array_filter($validated, function($value, $key) use ($user) {
                return $user->$key !== $value;
            }, ARRAY_FILTER_USE_BOTH);

            if (!empty($changes)) {
                $user->fill($changes);
                
                if (isset($changes['email'])) {
                    $user->email_verified_at = null;
                }
                
                $user->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'user' => $user
                ]);
            }

            return response()->json([
                'success' => false,
                'warning' => true,
                'message' => 'No changes detected'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
