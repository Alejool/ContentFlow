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
use Illuminate\Support\Facades\Log;

use App\Models\User;



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
      $usageService = app(\App\Services\WorkspaceUsageService::class);
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
        'message' => __('messages.profile.updated'),
        'user' => $userData,
      ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
      return response()->json([
        'success' => false,
        'message' => __('messages.profile.validation_failed'),
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
        'message' => __('messages.auth.not_authenticated')
      ]);
    }
    $data = $request->validated();
    $user = User::find(Auth::id());

    if (!$user) {
      return response()->json([
        'success' => false,
        'message' => __('messages.auth.user_not_found')
      ], 404);
    }


    // Use Hash::check() to properly compare hashed passwords
    if (!Hash::check($data['current_password'], $user->password)) {
      return response()->json([
        'success' => false,
        'message' => __('messages.profile.current_password_incorrect')
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
