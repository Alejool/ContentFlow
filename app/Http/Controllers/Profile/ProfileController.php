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
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

use App\Models\User;

use function Laravel\Prompts\warning;

class ProfileController extends Controller
{
    use ApiResponse;

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

        if ($request->wantsJson() || $request->is('api/*')) {
            return $this->successResponse($user->global_platform_settings, 'Settings updated successfully');
        }

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

            // Remove global_platform_settings and ai_settings from update if empty
            if (isset($validated['global_platform_settings']) && empty($validated['global_platform_settings'])) {
                unset($validated['global_platform_settings']);
            }
            if (isset($validated['ai_settings']) && empty($validated['ai_settings'])) {
                unset($validated['ai_settings']);
            }

            $user->fill($validated);

            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            $user->save();

            // Reload the user to get fresh data with proper JSON casting
            $freshUser = $user->fresh();

            // Ensure JSON fields are properly cast
            $userData = $freshUser->toArray();

            return response()->json([
                'success' => true,
                'message' => __('Profile updated successfully'),
                'user' => $userData,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => __('Validation failed'),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return $this->errorResponse(__('Error updating profile: ') . $e->getMessage(), 500);
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

        return $this->successResponse(null, 'Password updated successfully');
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
