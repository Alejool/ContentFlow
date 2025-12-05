<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialPostLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'social_account_id',
        'scheduled_post_id',
        'platform',
        'platform_post_id',
        'content',
        'media_urls',
        'published_at',
        'status',
        'error_message',
        'engagement_data',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'social_account_id' => 'integer',
        'scheduled_post_id' => 'integer',
        'media_urls' => 'array',
        'published_at' => 'timestamp',
        'engagement_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }

    public function scheduledPost(): BelongsTo
    {
        return $this->belongsTo(ScheduledPost::class);
    }

    public function getEngagementMetrics(): array
    {
        if (!$this->engagement_data) {
            return [
                'likes' => 0,
                'comments' => 0,
                'shares' => 0,
                'views' => 0,
            ];
        }

        return $this->engagement_data;
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeByPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('published_at', [$startDate, $endDate]);
    }
}
