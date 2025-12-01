<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialMediaMetrics extends Model
{
    use HasFactory;

    protected $fillable = [
        'social_account_id',
        'date',
        'followers',
        'following',
        'posts_count',
        'total_likes',
        'total_comments',
        'total_shares',
        'total_saves',
        'reach',
        'impressions',
        'profile_views',
        'followers_gained',
        'followers_lost',
        'growth_rate',
        'engagement_rate',
        'platform_data',
    ];

    protected $casts = [
        'date' => 'date',
        'followers' => 'integer',
        'following' => 'integer',
        'posts_count' => 'integer',
        'total_likes' => 'integer',
        'total_comments' => 'integer',
        'total_shares' => 'integer',
        'total_saves' => 'integer',
        'reach' => 'integer',
        'impressions' => 'integer',
        'profile_views' => 'integer',
        'followers_gained' => 'integer',
        'followers_lost' => 'integer',
        'growth_rate' => 'decimal:2',
        'engagement_rate' => 'decimal:2',
        'platform_data' => 'array',
    ];

    // Relationships
    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }

    // Scopes
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    // Helper methods
    public function getTotalEngagement()
    {
        return $this->total_likes + $this->total_comments + $this->total_shares + $this->total_saves;
    }

    public function calculateMetrics()
    {
        // Calculate engagement rate
        if ($this->followers > 0) {
            $totalEngagement = $this->getTotalEngagement();
            $this->engagement_rate = ($totalEngagement / $this->followers) * 100;
        }

        return $this;
    }

    public function calculateGrowthRate($previousFollowers)
    {
        if ($previousFollowers > 0) {
            $this->growth_rate = (($this->followers - $previousFollowers) / $previousFollowers) * 100;
        }

        return $this;
    }
}
