<?php

namespace App\Http\Controllers\Profile;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Requests\PasswordUpdateRequest;
use App\Services\Storage\S3PathService;
use App\Traits\ApiResponse;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WorkspaceUsageService;

class ProfileController extends Controller
{
  use ApiResponse;

  /**
   * Display the user's profile form.
   */
  public function edit(Request $request): Response
  {
    $user = $request->user();

    // Get current workspace and its subscription/usage
    // Priority: current_workspace → enterprise workspace → first workspace
    $workspace = null;

    if ($user->current_workspace_id) {
      $workspace = $user->workspaces()->where('workspaces.id', $user->current_workspace_id)->with('subscription')->first();
    }

    if (!$workspace) {
      $workspace = $user->workspaces()->with('subscription')->first();
    }

    $subscription = null;
    $usage = null;
    $billingHistory = [];

    if ($workspace) {
      $planId = strtolower($workspace->getPlanName());
      $planConfig = config("plans.{$planId}", config('plans.free'));
      $workspaceSubscription = $workspace->subscription;

      $subscription = [
        'plan_name' => $planConfig['name'] ?? ucfirst($planId),
        'plan_id' => $planId,
        'status' => $workspaceSubscription ? ($workspaceSubscription->stripe_status ?: 'active') : 'active',
        'current_period_end' => $workspaceSubscription ? $workspaceSubscription->ends_at?->toISOString() : $user->plan_renews_at?->toISOString(),
        'trial_ends_at' => $workspaceSubscription ? $workspaceSubscription->trial_ends_at?->toISOString() : null,
        'is_trial' => $workspaceSubscription ? ($workspaceSubscription->trial_ends_at && $workspaceSubscription->trial_ends_at->isFuture()) : false,
        'features' => $planConfig['features'] ?? [],
      ];

      // Get current month usage using logic from WorkspaceUsageService
      $usageService = app(WorkspaceUsageService::class);
      $summary = $usageService->getUsageSummary($workspace);

      $usage = [
        'publications_used' => $summary['usage']['publications']['current'],
        'publications_limit' => $summary['usage']['publications']['limit'],
        'storage_used' => $summary['usage']['storage']['current'],
        'storage_limit' => $summary['usage']['storage']['limit'],
        'ai_requests_used' => $summary['usage']['ai_requests']['current'],
        'ai_requests_limit' => $summary['usage']['ai_requests']['limit'],
        'social_accounts_used' => $summary['usage']['social_accounts']['current'],
        'social_accounts_limit' => $summary['usage']['social_accounts']['limit'],
        'team_members_used' => $summary['usage']['team_members']['current'],
        'team_members_limit' => $summary['usage']['team_members']['limit'],
        'external_integrations_used' => $summary['usage']['external_integrations']['current'],
        'external_integrations_limit' => $summary['usage']['external_integrations']['limit'],
      ];

      // Fetch billing history
      if ($workspaceSubscription && $workspaceSubscription->stripe_id && !str_starts_with($workspaceSubscription->stripe_id, 'demo_')) {
        try {
          // Attempt to fetch real Stripe invoices if applicable
          if (str_starts_with($workspaceSubscription->stripe_id, 'sub_')) {
            $stripeInvoices = $workspace->invoices();
            $billingHistory = collect($stripeInvoices)->take(5)->map(function ($invoice) {
              return [
                'id' => $invoice->id,
                'date' => $invoice->date()->toDateTimeString(),
                'total' => $invoice->total() / 100,
                'status' => $invoice->status,
                'description' => 'Suscripción',
                'invoice_pdf' => $invoice->invoice_pdf
              ];
            })->toArray();
          }
        } catch (\Exception $e) {
          Log::warning('Could not fetch Stripe invoices for profile: ' . $e->getMessage());
        }
      }

      // Fallback to user subscription history if no Stripe invoices or error
      if (empty($billingHistory)) {
        $billingHistory = $user->subscriptionHistory()
          ->where('price', '>', 0)
          ->orderBy('started_at', 'desc')
          ->take(5)
          ->get()
          ->map(function ($history) {
            return [
              'id' => $history->id,
              'date' => $history->started_at?->toDateTimeString(),
              'total' => $history->price,
              'status' => 'paid',
              'description' => 'Suscripción ' . ucfirst($history->plan_name),
              'invoice_pdf' => null
            ];
          })->toArray();
      }
    }

    return Inertia::render('Profile/Edit', [
      'mustVerifyEmail' => $user instanceof MustVerifyEmail,
      'status' => session('status'),
      'globalPlatformSettings' => $user->global_platform_settings ?? [],
      'twoFactorEnabled' => !is_null($user->two_factor_secret),
      'twoFactorEnabledAt' => $user->two_factor_enabled_at?->toISOString(),
      'subscription' => $subscription,
      'usage' => $usage,
      'billingHistory' => $billingHistory ?? [],
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
   * Upload avatar image
   */
  public function uploadAvatar(Request $request)
  {
    try {
      $request->validate([
        'avatar' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:2048', // 2MB max
        'name' => 'required|string',
      ]);

      $user = User::find(Auth::id());
      
      \Log::info('Avatar upload started', ['user_id' => $user->id]);

      if ($request->hasFile('avatar')) {
        $file = $request->file('avatar');
        $extension = $file->getClientOriginalExtension();
        
        // Usar el nuevo servicio de rutas organizadas
        $path = S3PathService::avatarPath($user->id, $extension);
        
        \Log::info('Uploading avatar to S3', ['path' => $path]);
        
        // Upload to S3
        Storage::disk('s3')->put($path, file_get_contents($file->getRealPath()));
        
        // Get public URL
        $url = Storage::disk('s3')->url($path);
        
        \Log::info('Avatar uploaded successfully', ['url' => $url]);
        
        // Delete old avatar if exists
        if ($user->photo_url && strpos($user->photo_url, 's3.amazonaws.com') !== false) {
          $oldPath = parse_url($user->photo_url, PHP_URL_PATH);
          $oldPath = ltrim($oldPath, '/');
          if (Storage::disk('s3')->exists($oldPath)) {
            Storage::disk('s3')->delete($oldPath);
            \Log::info('Deleted old avatar', ['path' => $oldPath]);
          }
        }
        
        // Update user
        $user->photo_url = $url;
        $user->save();
        
        \Log::info('User updated with new avatar', ['user_id' => $user->id, 'photo_url' => $url]);
        
        return response()->json([
          'success' => true,
          'message' => __('messages.profile.avatar_uploaded'),
          'user' => $user->fresh()->toArray(),
        ]);
      }
      
      return response()->json([
        'success' => false,
        'message' => 'No file uploaded',
      ], 400);
      
    } catch (\Exception $e) {
      \Log::error('Error uploading avatar', [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      
      return response()->json([
        'success' => false,
        'message' => __('Error uploading avatar: ') . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Delete avatar image
   */
  public function deleteAvatar()
  {
    try {
      $user = User::find(Auth::id());
      
      \Log::info('Avatar deletion started', ['user_id' => $user->id]);
      
      // Delete from S3 if exists
      if ($user->photo_url && strpos($user->photo_url, 's3.amazonaws.com') !== false) {
        $oldPath = parse_url($user->photo_url, PHP_URL_PATH);
        $oldPath = ltrim($oldPath, '/');
        if (\Storage::disk('s3')->exists($oldPath)) {
          \Storage::disk('s3')->delete($oldPath);
          \Log::info('Deleted avatar from S3', ['path' => $oldPath]);
        }
      }
      
      // Update user
      $user->photo_url = null;
      $user->save();
      
      \Log::info('Avatar deleted successfully', ['user_id' => $user->id]);
      
      return response()->json([
        'success' => true,
        'message' => __('messages.profile.avatar_deleted'),
        'user' => $user->fresh()->toArray(),
      ]);
      
    } catch (\Exception $e) {
      \Log::error('Error deleting avatar', [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      
      return response()->json([
        'success' => false,
        'message' => __('Error deleting avatar: ') . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Update the user's profile information.
   */
  public function update(ProfileUpdateRequest $request)
  {
    try {
      $user = User::find(Auth::id());
      $validated = $request->validated();

      \Log::info('Profile update request', [
        'user_id' => $user->id,
        'has_photo_url' => isset($validated['photo_url']),
        'photo_url_length' => isset($validated['photo_url']) ? strlen($validated['photo_url']) : 0,
      ]);

      // Handle photo_url if it's base64
      if (isset($validated['photo_url']) && !empty($validated['photo_url'])) {
        if (strpos($validated['photo_url'], 'data:image') === 0) {
          // Es base64, subir a S3
          try {
            \Log::info('Processing base64 image for S3 upload');
            
            $image = $validated['photo_url'];
            $image = str_replace('data:image/png;base64,', '', $image);
            $image = str_replace('data:image/jpg;base64,', '', $image);
            $image = str_replace('data:image/jpeg;base64,', '', $image);
            $image = str_replace('data:image/gif;base64,', '', $image);
            $image = str_replace(' ', '+', $image);
            $imageData = base64_decode($image);
            $extension = 'png';

            // Usar el nuevo servicio de rutas organizadas
            $path = S3PathService::avatarPath($user->id, $extension);
            
            \Log::info('Uploading to S3', ['path' => $path, 'size' => strlen($imageData)]);
            
            // Subir a S3
            \Storage::disk('s3')->put($fileName, $imageData, 'public');
            $validated['photo_url'] = \Storage::disk('s3')->url($fileName);

            \Log::info('S3 upload successful', ['url' => $validated['photo_url']]);

            // Eliminar foto anterior si existe
            if ($user->photo_url && strpos($user->photo_url, 's3.amazonaws.com') !== false) {
              $oldPath = parse_url($user->photo_url, PHP_URL_PATH);
              $oldPath = ltrim($oldPath, '/');
              if (Storage::disk('s3')->exists($oldPath)) {
                Storage::disk('s3')->delete($oldPath);
                \Log::info('Deleted old avatar', ['path' => $oldPath]);
              }
            }
          } catch (\Exception $e) {
            \Log::error('Error uploading avatar to S3: ' . $e->getMessage());
            \Log::error('S3 Error trace: ' . $e->getTraceAsString());
            // Si falla S3, guardar como base64 (fallback)
          }
        }
      }

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

      // Log para debug
      \Log::info('Avatar updated', [
        'user_id' => $user->id,
        'photo_url' => $user->photo_url,
        'default_avatar_icon' => $user->default_avatar_icon,
      ]);

      // Reload the user to get fresh data with proper JSON casting
      $freshUser = $user->fresh();

      // Ensure JSON fields are properly cast
      $userData = $freshUser->toArray();

      return response()->json([
        'success' => true,
        'message' => __('messages.profile.updated'),
        'user' => $userData,
      ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
      \Log::error('Validation error in profile update', ['errors' => $e->errors()]);
      return response()->json([
        'success' => false,
        'message' => __('messages.profile.validation_failed'),
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      \Log::error('Error in profile update', [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      return $this->errorResponse(__('Error updating profile: ') . $e->getMessage(), 500);
    }
  }

  public function changePassword(PasswordUpdateRequest $request)
  {
    if (!Auth::check()) {
      return response()->json([
        'success' => false,
        'message' => __('messages.auth.not_authenticated')
      ], 401);
    }

    $user = User::find(Auth::id());

    if (!$user) {
      return response()->json([
        'success' => false,
        'message' => __('messages.auth.user_not_found')
      ], 404);
    }

    // Check if user registered via OAuth (Google, etc.)
    if ($user->provider !== null) {
      return response()->json([
        'success' => false,
        'message' => __('messages.profile.oauth_password_change_not_allowed'),
        'errors' => [
          'current_password' => [__('messages.profile.oauth_password_change_not_allowed')]
        ]
      ], 403);
    }

    $data = $request->validated();

    // Verify current password
    if (!Hash::check($data['current_password'], $user->password)) {
      return response()->json([
        'success' => false,
        'message' => __('messages.profile.current_password_incorrect'),
        'errors' => [
          'current_password' => [__('messages.profile.current_password_incorrect')]
        ]
      ], 422);
    }

    // Update password
    $user->password = Hash::make($data['password']);
    $user->save();

    return $this->successResponse(null, __('messages.profile.password_updated'));
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
