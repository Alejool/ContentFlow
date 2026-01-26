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
use App\Models\WorkspaceUser;

class User extends Model implements Authenticatable, MustVerifyEmail, CanResetPassword, HasLocalePreference
{
    use AuthenticatableTrait;
    use MustVerifyEmailTrait;
    use CanResetPasswordTrait;
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'provider',
        'provider_id',
        'photo_url',
        'email_verified_at',
        'locale',
        'theme',
        'global_platform_settings',
        'phone',
        'country_code',
        'bio',
        'remember_token',
        'current_workspace_id',
        'ai_settings',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'global_platform_settings' => 'array',
        'ai_settings' => 'array',
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
        return $this->belongsToMany(Workspace::class, 'workspace_user')
            ->using(WorkspaceUser::class)
            ->withPivot('role_id')
            ->withTimestamps();
    }

    public function currentWorkspace()
    {
        return $this->belongsTo(Workspace::class, 'current_workspace_id');
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
}
