<?php

namespace App\Models\Publications;


use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

use App\Models\MediaFiles\MediaFile;
use App\Models\Social\SocialPostLog;
use App\Models\Logs\ApprovalLog;
use App\Models\Workspace\Workspace;
use App\Models\User;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Social\ScheduledPost;
use App\Models\Campaigns\Campaign;
use App\Models\Publications\PublicationComment;
use App\Models\Calendar\ExternalCalendarEvent;

use App\Traits\HandlesUtcDates;

class Publication extends Model
{
  use HasFactory, HandlesUtcDates;

  protected $utcDateFields = [
    'scheduled_at',
    'start_date',
    'end_date',
    'publish_date',
    'approved_at',
    'published_at',
    'rejected_at',
  ];

  protected static function boot()
  {
    parent::boot();

    static::addGlobalScope('workspace', function (Builder $builder) {
      if (Auth::check() && Auth::user()->current_workspace_id) {
        $builder->where('workspace_id', Auth::user()->current_workspace_id);
      }
    });
  }

  protected $table = 'publications';
  protected $availableStatuses = [
    'draft',
    'published',
    'publishing',
    'processing', // Added processing status
    'failed',
    'pending_review',
    'approved',
    'scheduled',
  ];

  protected $fillable = [
    'user_id',
    'title',
    'slug',
    'image',
    'status',
    'start_date',
    'end_date',
    'publish_date',
    'goal',
    'body',
    'url',
    'hashtags',
    'description',
    'scheduled_at',
    'platform_settings',
    'workspace_id',
    'approved_by',
    'approved_at',
    'approved_retries_remaining',
    'published_by',
    'published_at',
    'rejected_by',
    'rejected_at',
    'rejection_reason',
    'portal_token',
  ];

  protected $appends = ['platform_status_summary', 'media_locked_by', 'approval_lock'];


  protected $casts = [
    'start_date' => 'date',
    'end_date' => 'date',
    'publish_date' => 'date',
    'scheduled_at' => 'datetime',
    'hashtags' => 'array',
    'platform_settings' => 'array',
    'workspace_id' => 'integer',
    'approved_by' => 'integer',
    'approved_at' => 'datetime',
    'approved_retries_remaining' => 'integer',
    'published_by' => 'integer',
    'published_at' => 'datetime',
    'rejected_by' => 'integer',
    'rejected_at' => 'datetime',
  ];

  public function scopeDraft($query)
  {
    return $query->where('status', 'draft');
  }

  public function scopePublished($query)
  {
    return $query->where('status', 'published');
  }

  public function scopePublishing($query)
  {
    return $query->where('status', 'publishing');
  }

  public function scopeFailed($query)
  {
    return $query->where('status', 'failed');
  }

  public function scopePendingReview($query)
  {
    return $query->where('status', 'pending_review');
  }

  public function scopeApproved($query)
  {
    return $query->where('status', 'approved');
  }

  public function scopeScheduled($query)
  {
    return $query->where('status', 'scheduled');
  }

  public function isApproved(): bool
  {
    if ($this->status === 'approved' || $this->status === 'published' || $this->status === 'scheduled') {
      return true;
    }

    if ($this->status === 'failed' && $this->approved_retries_remaining > 0) {
      return true;
    }

    return false;
  }

  /**
   * Check if the publication is locked for editing.
   * Only publications in pending_review status cannot be edited.
   * Approved publications can be edited, but will revert to pending status.
   */
  public function isLockedForEditing(): bool
  {
    return $this->status === 'pending_review';
  }

  /**
   * Check if the publication can be published.
   * Only approved publications can be published.
   */
  public function canBePublished(): bool
  {
    return $this->status === 'approved';
  }

  /**
   * Revoke approval if content is modified.
   * This should be called when any content field is updated.
   */
  public function revokeApprovalIfNeeded(): void
  {
    if ($this->status === 'approved' && $this->isDirty(['title', 'body', 'description', 'hashtags', 'platform_settings'])) {
      $this->status = 'draft';
      $this->approved_by = null;
      $this->approved_at = null;
      $this->approved_retries_remaining = 2;
      
      $this->logActivity('approval_revoked', [
        'reason' => 'Content was modified after approval'
      ]);
    }
  }

  /**
   * Get the latest approval log for this publication.
   */
  public function getLatestApprovalLog()
  {
    return $this->approvalLogs()
      ->latest('requested_at')
      ->first();
  }

  /**
   * Check if the publication has a pending approval request.
   */
  public function hasPendingApproval(): bool
  {
    return $this->status === 'pending_review' && 
           $this->approvalLogs()
             ->whereNull('reviewed_at')
             ->exists();
  }

  public function approver(): BelongsTo
  {
    return $this->belongsTo(User::class, 'approved_by');
  }

  public function publisher(): BelongsTo
  {
    return $this->belongsTo(User::class, 'published_by');
  }

  public function rejector(): BelongsTo
  {
    return $this->belongsTo(User::class, 'rejected_by');
  }

  public function rejectedBy(): BelongsTo
  {
    return $this->rejector();
  }

  public function approvedBy(): BelongsTo
  {
    return $this->belongsTo(User::class, 'approved_by');
  }

  public function media(): HasMany
  {
    return $this->hasMany(PublicationMedia::class)->orderBy('order');
  }

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function workspace(): BelongsTo
  {
    return $this->belongsTo(Workspace::class);
  }

  public function mediaFiles(): BelongsToMany
  {
    return $this->belongsToMany(MediaFile::class, 'publication_media', 'publication_id', 'media_file_id')
      ->withPivot('order')
      ->withTimestamps()
      ->orderBy('publication_media.order');
  }

  public function analytics(): HasMany
  {
    return $this->hasMany(CampaignAnalytics::class, 'publication_id');
  }

  public function scheduled_posts(): HasMany
  {
    return $this->hasMany(ScheduledPost::class, 'publication_id');
  }

  public function socialPostLogs(): HasMany
  {
    return $this->hasMany(SocialPostLog::class, 'publication_id');
  }

  // Helper methods for analytics
  public function getTotalViews()
  {
    return $this->analytics()->sum('views');
  }

  public function getTotalClicks()
  {
    return $this->analytics()->sum('clicks');
  }

  public function getTotalConversions()
  {
    return $this->analytics()->sum('conversions');
  }

  public function getAverageEngagementRate()
  {
    return $this->analytics()->avg('engagement_rate');
  }
  // Scopes
  public function scopeActive($query)
  {
    return $query->where('start_date', '<=', now())
      ->where('end_date', '>=', now())
      ->where('status', 'published');
  }

  public function scopeUpcoming($query)
  {
    return $query->where('start_date', '>', now());
  }

  public function scopeCompleted($query)
  {
    return $query->where('end_date', '<', now());
  }

  public function scopeByDateRange($query, $start, $end)
  {
    if ($start && $end) {
      return $query->whereBetween('created_at', [$start, $end]);
    }
    return $query;
  }
  public function social_post_logs(): HasMany
  {
    return $this->hasMany(SocialPostLog::class);
  }


  public function campaigns(): BelongsToMany
  {
    return $this->belongsToMany(Campaign::class, 'campaign_publication')
      ->withPivot('order')
      ->withTimestamps();
  }

  public function approvalLogs(): HasMany
  {
    return $this->hasMany(ApprovalLog::class)->orderBy('requested_at', 'desc');
  }

  // Accessors
  public function getIsActiveAttribute()
  {
    return $this->status === 'published' &&
      $this->start_date <= now() &&
      $this->end_date >= now();
  }

  public function getPlatformStatusSummaryAttribute(): array
  {
    $summary = [];
    $logs = $this->socialPostLogs()
      ->whereIn('id', function ($query) {
        $query->selectRaw('MAX(id)')
          ->from('social_post_logs')
          ->where('publication_id', $this->id)
          ->groupBy('social_account_id');
      })->get();

    foreach ($logs as $log) {
      $summary[$log->social_account_id] = [
        'platform' => $log->platform,
        'status' => $log->status,
        'published_at' => $log->published_at,
        'error' => $log->error_message,
        'url' => $log->post_url,
      ];
    }

    return $summary;
  }

  public function getMediaLockedByAttribute()
  {
    $lockUserId = cache()->get("publication:{$this->id}:media_lock");
    if ($lockUserId) {
      return User::find($lockUserId)?->only(['id', 'name', 'photo_url']);
    }
    return null;
  }

  public function getApprovalLockAttribute()
  {
    if ($this->isLockedForEditing()) {
      return [
        'locked_by' => 'approval_workflow',
        'status' => $this->status,
        'reason' => 'This publication is awaiting approval and cannot be edited.',
      ];
    }
    return null;
  }

  public function activities(): HasMany
  {
    return $this->hasMany(PublicationActivity::class)->orderBy('created_at', 'desc');
  }

  public function logActivity(string $type, $details = null, $user = null): void
  {
    $this->activities()->create([
      'user_id' => $user ? $user->id : (Auth::id() ?? null),
      'publication_id' => $this->id,
      'type' => $type,
      'details' => $details,
    ]);
  }

  public function comments(): HasMany
  {
    return $this->hasMany(PublicationComment::class)->orderBy('created_at', 'asc');
  }

  /**
   * Get the external calendar events for this publication.
   */
  public function externalCalendarEvents(): HasMany
  {
    return $this->hasMany(ExternalCalendarEvent::class);
  }
}
