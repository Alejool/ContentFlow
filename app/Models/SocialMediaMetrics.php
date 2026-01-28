<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
        'metadata',
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
        'metadata' => 'array',
    ];

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }
}
