<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class SubscriptionUsageTracking extends Model
{
    use HasFactory;

    protected $table = 'subscription_usage_tracking';

    protected $fillable = [
        'user_id',
        'subscription_history_id',
        'year',
        'month',
        'period_start',
        'period_end',
        'publications_used',
        'publications_limit',
        'social_accounts_used',
        'social_accounts_limit',
        'storage_used_bytes',
        'storage_limit_bytes',
        'ai_requests_used',
        'ai_requests_limit',
        'reels_generated',
        'scheduled_posts',
        'analytics_views',
        'limit_reached',
        'limit_reached_at',
        'daily_breakdown',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'limit_reached' => 'boolean',
        'limit_reached_at' => 'datetime',
        'daily_breakdown' => 'array',
    ];

    /**
     * Get the user that owns the usage tracking.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subscription history associated with this usage.
     */
    public function subscriptionHistory(): BelongsTo
    {
        return $this->belongsTo(SubscriptionHistory::class);
    }

    /**
     * Scope to get current month's usage.
     */
    public function scopeCurrentMonth($query)
    {
        return $query->where('year', now()->year)
                    ->where('month', now()->month);
    }

    /**
     * Scope to get usage for a specific period.
     */
    public function scopeForPeriod($query, int $year, int $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    /**
     * Increment publication usage.
     */
    public function incrementPublications(int $count = 1): void
    {
        $this->increment('publications_used', $count);
        $this->checkLimits();
        $this->updateDailyBreakdown('publications', $count);
    }

    /**
     * Increment storage usage.
     */
    public function incrementStorage(int $bytes): void
    {
        $this->increment('storage_used_bytes', $bytes);
        $this->checkLimits();
        $this->updateDailyBreakdown('storage', $bytes);
    }

    /**
     * Increment AI requests usage.
     */
    public function incrementAiRequests(int $count = 1): void
    {
        $this->increment('ai_requests_used', $count);
        $this->checkLimits();
        $this->updateDailyBreakdown('ai_requests', $count);
    }

    /**
     * Update social accounts used.
     */
    public function updateSocialAccountsUsed(int $count): void
    {
        $this->update(['social_accounts_used' => $count]);
        $this->checkLimits();
    }

    /**
     * Check if any limits have been reached.
     */
    protected function checkLimits(): void
    {
        $limitReached = $this->publications_used >= $this->publications_limit ||
                       $this->storage_used_bytes >= $this->storage_limit_bytes ||
                       ($this->ai_requests_limit && $this->ai_requests_used >= $this->ai_requests_limit) ||
                       $this->social_accounts_used >= $this->social_accounts_limit;

        if ($limitReached && !$this->limit_reached) {
            $this->update([
                'limit_reached' => true,
                'limit_reached_at' => now(),
            ]);
        }
    }

    /**
     * Update daily breakdown.
     */
    protected function updateDailyBreakdown(string $metric, int $value): void
    {
        $breakdown = $this->daily_breakdown ?? [];
        $today = now()->format('Y-m-d');

        if (!isset($breakdown[$today])) {
            $breakdown[$today] = [];
        }

        $breakdown[$today][$metric] = ($breakdown[$today][$metric] ?? 0) + $value;

        $this->update(['daily_breakdown' => $breakdown]);
    }

    /**
     * Get usage percentage for publications.
     */
    public function getPublicationsUsagePercentage(): float
    {
        if ($this->publications_limit === 0) {
            return 0;
        }

        return min(100, ($this->publications_used / $this->publications_limit) * 100);
    }

    /**
     * Get usage percentage for storage.
     */
    public function getStorageUsagePercentage(): float
    {
        if ($this->storage_limit_bytes === 0) {
            return 0;
        }

        return min(100, ($this->storage_used_bytes / $this->storage_limit_bytes) * 100);
    }

    /**
     * Get remaining publications.
     */
    public function getRemainingPublications(): int
    {
        return max(0, $this->publications_limit - $this->publications_used);
    }

    /**
     * Get remaining storage in bytes.
     */
    public function getRemainingStorage(): int
    {
        return max(0, $this->storage_limit_bytes - $this->storage_used_bytes);
    }

    /**
     * Check if publications limit is reached.
     */
    public function hasReachedPublicationsLimit(): bool
    {
        return $this->publications_used >= $this->publications_limit;
    }

    /**
     * Check if storage limit is reached.
     */
    public function hasReachedStorageLimit(): bool
    {
        return $this->storage_used_bytes >= $this->storage_limit_bytes;
    }
}
