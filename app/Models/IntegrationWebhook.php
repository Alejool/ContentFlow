<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegrationWebhook extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'integration_id',
        'provider',
        'event_type',
        'payload',
        'processed_at',
        'error_message',
        'created_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    /**
     * Scopes
     */
    public function scopeUnprocessed($query)
    {
        return $query->whereNull('processed_at');
    }

    public function scopeProcessed($query)
    {
        return $query->whereNotNull('processed_at');
    }

    public function scopeOfProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Helpers
     */
    public function isProcessed(): bool
    {
        return $this->processed_at !== null;
    }

    public function markAsProcessed(): void
    {
        $this->update(['processed_at' => now()]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'processed_at' => now(),
            'error_message' => $error,
        ]);
    }
}
