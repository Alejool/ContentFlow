<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Integration extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'type',
        'name',
        'status',
        'config',
        'credentials',
        'last_sync_at',
    ];

    protected $casts = [
        'config' => 'array',
        'last_sync_at' => 'datetime',
    ];

    protected $hidden = [
        'credentials',
    ];

    /**
     * Relationships
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function connections(): HasMany
    {
        return $this->hasMany(IntegrationConnection::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(IntegrationLog::class);
    }

    public function webhooks(): HasMany
    {
        return $this->hasMany(IntegrationWebhook::class);
    }

    /**
     * Accessors & Mutators
     */
    public function setCredentialsAttribute(?array $value): void
    {
        $this->attributes['credentials'] = $value ? Crypt::encryptString(json_encode($value)) : null;
    }

    public function getCredentialsAttribute(?string $value): ?array
    {
        if (!$value) {
            return null;
        }

        try {
            return json_decode(Crypt::decryptString($value), true);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Helpers
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function markAsActive(): void
    {
        $this->update(['status' => 'active']);
    }

    public function markAsInactive(): void
    {
        $this->update(['status' => 'inactive']);
    }

    public function markAsError(): void
    {
        $this->update(['status' => 'error']);
    }

    public function updateLastSync(): void
    {
        $this->update(['last_sync_at' => now()]);
    }
}
