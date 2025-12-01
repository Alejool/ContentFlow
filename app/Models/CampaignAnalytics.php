<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Campaigns\Campaign;

class CampaignAnalytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'date',
        'views',
        'unique_visitors',
        'clicks',
        'conversions',
        'likes',
        'comments',
        'shares',
        'saves',
        'reach',
        'impressions',
        'ctr',
        'conversion_rate',
        'engagement_rate',
    ];

    protected $casts = [
        'date' => 'date',
        'views' => 'integer',
        'unique_visitors' => 'integer',
        'clicks' => 'integer',
        'conversions' => 'integer',
        'likes' => 'integer',
        'comments' => 'integer',
        'shares' => 'integer',
        'saves' => 'integer',
        'reach' => 'integer',
        'impressions' => 'integer',
        'ctr' => 'decimal:2',
        'conversion_rate' => 'decimal:2',
        'engagement_rate' => 'decimal:2',
    ];

    // Relationships
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    // Scopes
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    // Helper methods
    public function getTotalEngagement()
    {
        return $this->likes + $this->comments + $this->shares + $this->saves;
    }

    public function calculateMetrics()
    {
        // Calculate CTR
        if ($this->impressions > 0) {
            $this->ctr = ($this->clicks / $this->impressions) * 100;
        }

        // Calculate conversion rate
        if ($this->clicks > 0) {
            $this->conversion_rate = ($this->conversions / $this->clicks) * 100;
        }

        // Calculate engagement rate
        if ($this->reach > 0) {
            $totalEngagement = $this->getTotalEngagement();
            $this->engagement_rate = ($totalEngagement / $this->reach) * 100;
        }

        return $this;
    }
}
