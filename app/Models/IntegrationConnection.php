<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class IntegrationConnection extends Model
{
    use HasFactory;

    protected $fillable = [
        'integration_id',
        'user_id',
        'provider',
        'access_token',
        'refresh_token',
        'expires_at',
        'scopes',
        'metadata',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'scopes' => 'array',
        'metadata' => 'array',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * Relationships
     */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Accessors & Mutators
     */
    public function setAccessTokenAttribute(?string $value): void
    {
        $this->attributes['access_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getAccessTokenAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function setRefreshTokenAttribute(?string $value): void
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getRefreshTokenAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Helpers
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function needsRefresh(): bool
    {
        // Refresh if expires in less than 5 minutes
        return $this->expires_at && $this->expires_at->subMinutes(5)->isPast();
    }
}
