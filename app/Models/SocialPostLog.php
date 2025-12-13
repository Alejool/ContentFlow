<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Publications\Publication;

class SocialPostLog extends Model
{
    use HasFactory;

    protected $status = [
        'published',
        'failed',
        'pending',
        'orphaned',
    ];

    protected $fillable = [
        'user_id',
        'social_account_id',
        'scheduled_post_id',
        'publication_id',
        'media_file_id',
        'platform',
        'account_name',
        'platform_post_id',
        'post_type',
        'post_url',
        'content',
        'media_urls',
        'thumbnail_url',
        'published_at',
        'status',
        'error_message',
        'notes',
        'retry_count',
        'last_retry_at',
        'engagement_data',
        'post_metadata',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'social_account_id' => 'integer',
        'scheduled_post_id' => 'integer',
        'media_urls' => 'array',
        'published_at' => 'timestamp',
        'engagement_data' => 'array',
        'post_metadata' => 'array',
        'retry_count' => 'integer',
        'last_retry_at' => 'timestamp',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class)->withTrashed();
    }

    public function scheduledPost(): BelongsTo
    {
        return $this->belongsTo(ScheduledPost::class);
    }

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function mediaFile(): BelongsTo
    {
        return $this->belongsTo(MediaFile::class);
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
    public function canRetry(): bool
    {
        return $this->status === 'failed' && $this->retry_count < 3;
    }
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }


    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('published_at', [$startDate, $endDate]);
    }

    public function scopeByPublication($query, $publicationId)
    {
        return $query->where('publication_id', $publicationId);
    }
    public function scopeRetryable($query)
    {
        return $query->where('status', 'failed')
            ->where('retry_count', '<', 3);
    }
    public function scopeByMediaFile($query, $mediaFileId)
    {
        return $query->where('media_file_id', $mediaFileId);
    }
}
