<?php

namespace App\Models\Subscription;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Referral extends Model
{
    protected $fillable = [
        'referrer_id',
        'referred_id',
        'status',
        'commission_amount',
        'completed_at',
    ];

    protected $casts = [
        'commission_amount' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_id');
    }

    public function markAsCompleted(float $commissionAmount = 0): void
    {
        $this->update([
            'status' => 'completed',
            'commission_amount' => $commissionAmount,
            'completed_at' => now(),
        ]);
    }

    public function markAsRewarded(): void
    {
        $this->update([
            'status' => 'rewarded',
        ]);
    }
}
