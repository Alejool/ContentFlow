<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingAnalytics extends Model
{
    protected $fillable = [
        'user_id',
        'event_type',
        'event_data',
        'step_id',
        'duration_seconds',
    ];

    protected $casts = [
        'event_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
