<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Auth\Authenticatable as AuthenticatableTrait;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Auth\Passwords\CanResetPassword as CanResetPasswordTrait;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Contracts\Translation\HasLocalePreference;

use App\Models\Publications\Publication;
use App\Models\Workspace\WorkspaceUser;
use App\Models\Social\SocialAccount;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialPostLog;
use App\Models\MediaFiles\MediaFile;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;
use App\Models\Calendar\ExternalCalendarConnection;
use App\Models\Calendar\BulkOperationHistory;
use App\Models\SubscriptionHistory;
use App\Models\SubscriptionUsageTracking;
use App\Traits\HasTimezone;

class User extends Model implements Authenticatable, MustVerifyEmail, CanResetPassword, HasLocalePreference
{
  use AuthenticatableTrait;
  use MustVerifyEmailTrait;
  use CanResetPasswordTrait;
  use HasApiTokens, HasFactory, Notifiable, HasTimezone;

  protected $fillable = [
    'name',
    'email',
    'password',
    'provider',
    'provider_id',
    'is_super_admin',
    'photo_url',
    'default_avatar_icon',
    'email_verified_at',
    'current_plan',
    'plan_started_at',
    'plan_renews_at',
    'locale',
    'timezone',
    'theme',
    'theme_color',
    'global_platform_settings',
    'phone',
    'country_code',
    'bio',
    'remember_token',
    'current_workspace_id',
    'ai_settings',
    'last_login_at',
    'last_login_ip',
    'created_ip',
    'known_devices',
    'two_factor_secret',
    'two_factor_backup_codes',
    'two_factor_enabled_at',
  ];

  protected $hidden = [
    'password',
    'remember_token',
  ];

  protected $casts = [
    'email_verified_at' => 'datetime',
    'password' => 'hashed',
    'is_super_admin' => 'boolean',
    'global_platform_settings' => 'array',
    'ai_settings' => 'array',
    'known_devices' => 'array',
    'last_login_at' => 'datetime',
    'two_factor_enabled_at' => 'datetime',
    'plan_started_at' => 'datetime',
    'plan_renews_at' => 'datetime',
  ];

  protected $attributes = [
    'theme_color' => 'orange',
  ];

  /**
   * Get the user's preferred locale.
   */
  public function preferredLocale(): string
  {
    return $this->locale ?? app()->getLocale();
  }

  public function publications(): HasMany
  {
    return $this->hasMany(Publication::class);
  }


  public function sendEmailVerificationNotification()
  {
    $this->notify(new VerifyEmailNotification);
  }

  // Social Media Relationships
  public function socialAccounts(): HasMany
  {
    return $this->hasMany(SocialAccount::class);
  }

  public function scheduledPosts(): HasMany
  {
    return $this->hasMany(ScheduledPost::class);
  }


  public function socialPostLogs(): HasMany
  {
    return $this->hasMany(SocialPostLog::class);
  }

  public function mediaFiles(): HasMany
  {
    return $this->hasMany(MediaFile::class);
  }

  // Workspace Relationships
  public function workspaces()
  {
    return $this->belongsToMany(Workspace::class, 'role_user')
      ->using(WorkspaceUser::class)
      ->withPivot('role_id', 'assigned_by', 'assigned_at');
  }

  /**
   * Get the roles assigned to the user across workspaces
   */
  public function roles()
  {
    return $this->belongsToMany(Role::class, 'role_user')
      ->withPivot('workspace_id', 'assigned_by', 'assigned_at');
  }


  public function currentWorkspace()
  {
    return $this->belongsTo(Workspace::class, 'current_workspace_id');
  }

  /**
   * Get user's workspaces with their roles and permissions.
   *
   * Usage:
   *   $user->getWorkspacesWithRolesAndPermissions();
   *
   * Access data:
   *   foreach ($user->workspaces as $workspace) {
   *       $role = $workspace->pivot->role;
   *       $permissions = $role->permissions;
   *   }
   *
   * @return \Illuminate\Database\Eloquent\Collection
   */
  public function getWorkspacesWithRolesAndPermissions()
  {
    return $this->load('workspaces')->workspaces;
  }


  public function hasPermission($permissionSlug, $workspaceId = null)
  {
    $workspaceId = $workspaceId ?: $this->current_workspace_id;

    if (!$workspaceId) {
      return false;
    }

    // Get the workspace with pivot data
    $workspace = $this->workspaces()
      ->where('workspaces.id', $workspaceId)
      ->first();

    if (!$workspace) {
      return false;
    }

    // Owner/Creator bypass
    if ($workspace->created_by === $this->id) {
      return true;
    }

    // Get role from pivot
    $roleId = $workspace->pivot->role_id;

    if (!$roleId) {
      return false;
    }

    $role = Role::find($roleId);

    if (!$role) {
      return false;
    }

    // Owner role bypass
    if ($role->slug === 'owner' || $role->slug === 'admin-owner') {
      return true;
    }

    // If checking for basic viewing, any role in the workspace should suffice if we want to be permissive
    if ($permissionSlug === 'view-content') {
      return true;
    }

    return $role->permissions()->where('slug', $permissionSlug)->exists();
  }

  /**
   * Update user login statistics.
   */
  public function updateLoginStats(): void
  {
    $request = request();
    $currentIp = $request->ip();
    \Illuminate\Support\Facades\Log::info('updateLoginStats called', [
      'ip' => $currentIp,
      'user_id' => $this->id,
      'x-forwarded-for' => $request->header('x-forwarded-for'),
      'remote_addr' => $request->server('REMOTE_ADDR'),
    ]);

    $userAgent = $request->userAgent();
    $fingerprint = hash('sha256', $userAgent);

    // Track known devices (simple fingerprinting)
    $knownDevices = $this->known_devices ?? [];
    if (!in_array($fingerprint, $knownDevices)) {
      $knownDevices[] = $fingerprint;
    }

    $this->forceFill([
      'last_login_at' => now(),
      'last_login_ip' => $currentIp,
      'known_devices' => $knownDevices,
    ])->save();
  }

  /**
   * Get the user's onboarding state.
   */
  public function onboardingState()
  {
    return $this->hasOne(\App\Models\OnboardingState::class);
  }

  /**
   * Get the user's external calendar connections.
   */
  public function externalCalendarConnections(): HasMany
  {
    return $this->hasMany(ExternalCalendarConnection::class);
  }

  /**
   * Get the user's bulk operation history.
   */
  public function bulkOperationHistory(): HasMany
  {
    return $this->hasMany(BulkOperationHistory::class);
  }

  /**
   * Get the user's subscription history.
   */
  public function subscriptionHistory(): HasMany
  {
    return $this->hasMany(SubscriptionHistory::class)->orderBy('started_at', 'desc');
  }

  /**
   * Get the user's active subscription history.
   */
  public function activeSubscriptionHistory()
  {
    return $this->hasOne(SubscriptionHistory::class)->where('is_active', true)->latest('started_at');
  }

  /**
   * Get the user's usage tracking records.
   */
  public function usageTracking(): HasMany
  {
    return $this->hasMany(SubscriptionUsageTracking::class)->orderBy('year', 'desc')->orderBy('month', 'desc');
  }

  /**
   * Get the user's current month usage tracking.
   */
  public function currentMonthUsage()
  {
    return $this->hasOne(SubscriptionUsageTracking::class)
      ->where('year', now()->year)
      ->where('month', now()->month);
  }

  /**
   * Get the current plan configuration.
   */
  public function getPlanConfig(): array
  {
    return config("plans.{$this->current_plan}", config('plans.free'));
  }

  /**
   * Get the current plan limits.
   */
  public function getPlanLimits(): array
  {
    return $this->getPlanConfig()['limits'] ?? [];
  }

  /**
   * Check if user has a specific feature in their plan.
   */
  public function hasFeature(string $feature): bool
  {
    $features = $this->getPlanConfig()['features'] ?? [];
    return in_array($feature, $features);
  }

  /**
   * Check if the plan needs renewal (monthly cycle).
   */
  public function needsPlanRenewal(): bool
  {
    if (!$this->plan_renews_at) {
      return false;
    }
    return now()->greaterThanOrEqualTo($this->plan_renews_at);
  }

  /**
   * Check if user is on a paid plan.
   */
  public function isOnPaidPlan(): bool
  {
    return !in_array($this->current_plan, ['free', 'demo']);
  }
}

