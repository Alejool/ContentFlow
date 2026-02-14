<?php

namespace App\Models\Social;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Social\SocialAccount;
use App\Models\Social\ScheduledPost;
use App\Models\MediaFiles\MediaFile;


class SocialPostLog extends Model
{
  use HasFactory;

  protected $status = [
    'published',
    'failed',
    'pending',
    'orphaned',
    'publishing',
    'removed_on_platform'
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
    'platform_settings',
    'workspace_id',
    'comment_sentiment_data',
  ];

  protected $casts = [
    'id' => 'integer',
    'user_id' => 'integer',
    'workspace_id' => 'integer',
    'social_account_id' => 'integer',
    'scheduled_post_id' => 'integer',
    'media_urls' => 'array',
    'published_at' => 'timestamp',
    'engagement_data' => 'array',
    'post_metadata' => 'array',
    'platform_settings' => 'array',
    'retry_count' => 'integer',
    'last_retry_at' => 'timestamp',
    'comment_sentiment_data' => 'array',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function workspace(): BelongsTo
  {
    return $this->belongsTo(Workspace::class);
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
  public function isPublishing(): bool
  {
    return $this->status === 'publishing';
  }
  public function isOrphaned(): bool
  {
    return $this->status === 'orphaned';
  }
  public function isRemovedOnPlatform(): bool
  {
    return $this->status === 'removed_on_platform';
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

  /**
   * Get comments filtered by sentiment
   *
   * @param string $sentiment positive|inquiry|hate_speech
   * @return array
   */
  public function getCommentsBySentiment(string $sentiment): array
  {
    $data = $this->comment_sentiment_data ?? [];
    $comments = $data['comments'] ?? [];

    return array_filter($comments, fn($c) => ($c['sentiment'] ?? '') === $sentiment);
  }

  /**
   * Get all comments with sentiment data
   *
   * @return array
   */
  public function getAllComments(): array
  {
    $data = $this->comment_sentiment_data ?? [];
    return $data['comments'] ?? [];
  }

  /**
   * Get sentiment summary statistics
   *
   * @return array
   */
  public function getSentimentSummary(): array
  {
    $data = $this->comment_sentiment_data ?? [];
    return $data['summary'] ?? [
      'total' => 0,
      'positive' => 0,
      'inquiry' => 0,
      'hate_speech' => 0,
      'last_synced_at' => null
    ];
  }

  /**
   * Update comment sentiment data
   *
   * @param array $comments
   * @param array $summary
   * @return bool
   */
  public function updateCommentSentimentData(array $comments, array $summary): bool
  {
    $this->comment_sentiment_data = [
      'comments' => $comments,
      'summary' => $summary
    ];

    return $this->save();
  }
}
