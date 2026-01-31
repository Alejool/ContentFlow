<?php

namespace App\Models\Campaigns;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
