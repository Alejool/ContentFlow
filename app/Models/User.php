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
use App\Models\Campaign;

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
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'global_platform_settings' => 'array',
    ];

    /**
     * Get the user's preferred locale.
     */
    public function preferredLocale(): string
    {
        return $this->locale ?? app()->getLocale();
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

    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    public function socialPostLogs(): HasMany
    {
        return $this->hasMany(SocialPostLog::class);
    }

    public function mediaFiles(): HasMany
    {
        return $this->hasMany(MediaFile::class);
    }
}
