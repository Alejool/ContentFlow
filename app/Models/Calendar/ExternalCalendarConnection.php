<?php

namespace App\Models\Calendar;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Workspace\Workspace;

class ExternalCalendarConnection extends Model
{
    protected $fillable = [
        'user_id',
        'workspace_id',
        'provider',
        'email',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'sync_enabled',
        'sync_config',
        'last_sync_at',
        'status',
        'error_message',
    ];

    protected $casts = [
        'sync_config' => 'array',
        'sync_enabled' => 'boolean',
        'token_expires_at' => 'datetime',
        'last_sync_at' => 'datetime',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * Get the user that owns the connection.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the workspace that owns the connection.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Get the external calendar events for this connection.
     */
    public function events(): HasMany
    {
        return $this->hasMany(ExternalCalendarEvent::class, 'connection_id');
    }

    /**
     * Check if the access token is expired.
     */
    public function isTokenExpired(): bool
    {
        if (!$this->token_expires_at) {
            return false;
        }

        return $this->token_expires_at->isPast();
    }

    /**
     * Check if the token needs to be refreshed (expires within 5 minutes).
     */
    public function needsRefresh(): bool
    {
        if (!$this->token_expires_at) {
            return false;
        }

        return $this->token_expires_at->subMinutes(5)->isPast();
    }
}
