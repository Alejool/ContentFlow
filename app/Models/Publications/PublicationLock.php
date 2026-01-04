<?php

namespace App\Models\Publications;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicationLock extends Model
{
    protected $fillable = [
        'publication_id',
        'user_id',
        'session_id',
        'ip_address',
        'user_agent',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
