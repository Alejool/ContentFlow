<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionHistory extends Model
{
    use HasFactory;

    protected $table = 'subscription_history';

    protected $fillable = [
        'user_id',
        'subscription_id',
        'plan_name',
        'stripe_price_id',
        'price',
        'billing_cycle',
        'change_type',
        'previous_plan',
        'reason',
        'started_at',
        'ended_at',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Get the user that owns the subscription history.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subscription associated with this history entry.
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Get the usage tracking records for this subscription period.
     */
    public function usageTracking(): HasMany
    {
        return $this->hasMany(SubscriptionUsageTracking::class);
    }

    /**
     * Scope to get active subscription history.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get history for a specific plan.
     */
    public function scopeForPlan($query, string $planName)
    {
        return $query->where('plan_name', $planName);
    }

    /**
     * Get the duration of this subscription period in days.
     */
    public function getDurationInDays(): ?int
    {
        if (!$this->ended_at) {
            return $this->started_at->diffInDays(now());
        }

        return $this->started_at->diffInDays($this->ended_at);
    }

    /**
     * Check if this is an upgrade from the previous plan.
     */
    public function isUpgrade(): bool
    {
        return $this->change_type === 'upgraded';
    }

    /**
     * Check if this is a downgrade from the previous plan.
     */
    public function isDowngrade(): bool
    {
        return $this->change_type === 'downgraded';
    }

    /**
     * End this subscription period.
     */
    public function end(?string $reason = null): void
    {
        $this->update([
            'ended_at' => now(),
            'is_active' => false,
            'reason' => $reason ?? $this->reason,
        ]);
    }
}
