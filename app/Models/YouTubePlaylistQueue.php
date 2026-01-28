<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Campaign;

class YouTubePlaylistQueue extends Model
{
  use HasFactory;

  protected $table = 'youtube_playlist_queue';

  protected $fillable = [
    'social_post_log_id',
    'campaign_id',
    'video_id',
    'playlist_id',
    'playlist_name',
    'status',
    'error_message',
    'retry_count',
    'last_attempt_at',
  ];

  protected $casts = [
    'last_attempt_at' => 'datetime',
    'retry_count' => 'integer',
  ];

  /**
   * Get the social post log associated with this queue item
   */
  public function socialPostLog(): BelongsTo
  {
    return $this->belongsTo(SocialPostLog::class);
  }

  /**
   * Get the campaign associated with this queue item
   */
  public function campaign(): BelongsTo
  {
    return $this->belongsTo(Campaign::class);
  }

  /**
   * Check if this item can be retried
   */
  public function canRetry(): bool
  {
    return $this->retry_count < 3;
  }

  /**
   * Mark as processing
   */
  public function markAsProcessing(): void
  {
    $this->update([
      'status' => 'processing',
      'last_attempt_at' => now(),
    ]);
  }

  /**
   * Mark as completed
   */
  public function markAsCompleted(): void
  {
    $this->update([
      'status' => 'completed',
      'error_message' => null,
    ]);
  }

  /**
   * Mark as failed
   */
  public function markAsFailed(string $errorMessage): void
  {
    $this->update([
      'status' => 'failed',
      'error_message' => $errorMessage,
      'retry_count' => $this->retry_count + 1,
      'last_attempt_at' => now(),
    ]);
  }
}
