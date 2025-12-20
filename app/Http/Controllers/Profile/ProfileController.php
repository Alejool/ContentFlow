<?php

namespace App\Http\Controllers\Profile;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Requests\PasswordUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Http\Controllers\Controller;


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
            'globalPlatformSettings' => $request->user()->global_platform_settings ?? [],
        ]);
    }

    public function socialSettings(Request $request): Response
    {
        return Inertia::render('Settings/SocialConfig', [
            'settings' => $request->user()->global_platform_settings ?? [],
        ]);
    }

    public function updateSocialSettings(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        $user = $request->user();
        $user->global_platform_settings = $validated['settings'];
        $user->save();

        return Redirect::back()->with('status', 'settings-updated');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request)
    {
        try {
            $user = User::find(Auth::id());
            $validated = $request->validated();


            $changes = array_filter($validated, function ($value, $key) use ($user) {
                return $user->$key !== $value;
            }, ARRAY_FILTER_USE_BOTH);

            // if (!empty($changes)) {
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
            // }

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

    public function changePassword(PasswordUpdateRequest $request)
    {

        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not logged in'
            ]);
        }
        $data = $request->validated();
        $user = User::find(Auth::id());

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }


        // Use Hash::check() to properly compare hashed passwords
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ]);
        }
        $user->password = Hash::make($data['password']);
        $user->save();
        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully',
            'user' => $user
        ]);
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
