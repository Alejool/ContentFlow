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
use App\Models\Social\SocialAccount;
use App\Models\Logs\ApprovalLog;
use App\Models\Workspace\Workspace;
use App\Models\User;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Social\ScheduledPost;
use App\Models\Campaigns\Campaign;
use App\Models\Publications\PublicationComment;
use App\Models\Calendar\ExternalCalendarEvent;
use App\Models\ApprovalStep;

use App\Traits\HandlesUtcDates;
use App\Events\Publications\PublicationCreated;
use App\Events\Publications\PublicationDeleted;

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

  protected $dispatchesEvents = [
    'created' => PublicationCreated::class,
    'deleted' => PublicationDeleted::class,
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
    'retrying', // Added retrying status for job retries
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
    'content_type',
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
    'is_recurring',
    'recurrence_type',
    'recurrence_interval',
    'recurrence_days',
    'recurrence_end_date',
    'recurrence_accounts',
    'poll_options',
    'poll_duration_hours',
    'carousel_items',
    'content_metadata',
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
    'is_recurring' => 'boolean',
    'recurrence_interval' => 'integer',
    'recurrence_days' => 'array',
    'recurrence_end_date' => 'date',
    'recurrence_accounts' => 'array',
    'poll_options' => 'array',
    'poll_duration_hours' => 'integer',
    'carousel_items' => 'array',
    'content_metadata' => 'array',
    'submitted_for_approval_at' => 'datetime',
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

  // Status constants for new approval workflow
  public const STATUS_DRAFT = 'draft';
  public const STATUS_PENDING_REVIEW = 'pending_review';
  public const STATUS_APPROVED = 'approved';
  public const STATUS_REJECTED = 'rejected';
  public const STATUS_PUBLISHED = 'published';

  /**
   * Check if the publication is in draft status.
   */
  public function isDraft(): bool
  {
    return $this->status === self::STATUS_DRAFT;
  }

  /**
   * Check if the publication is pending review.
   */
  public function isPendingReview(): bool
  {
    return $this->status === self::STATUS_PENDING_REVIEW;
  }

  /**
   * Check if the publication is rejected.
   */
  public function isRejected(): bool
  {
    return $this->status === 'rejected';
  }

  /**
   * Check if the publication is published.
   */
  public function isPublished(): bool
  {
    return $this->status === self::STATUS_PUBLISHED || $this->status === 'published';
  }

  /**
   * Get the current approval level for this publication.
   */
  public function getCurrentApprovalLevel(): int
  {
    return $this->current_approval_level ?? 0;
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
   * Can publish if:
   * - Status is 'approved' (first time publishing)
   * - Status is 'failed' (retry after failure)
   * - Status is 'published' (republish to additional platforms)
   * - Has been approved before (approved_at exists) - allows republishing
   * - Status is 'draft' or 'rejected' (if user has publish permission)
   *
   * Cannot publish if:
   * - Status is 'pending_review' (must be approved or rejected first)
   * - Status is 'publishing' or 'retrying' (already in progress)
   */
  public function canBePublished(bool $hasPublishPermission = false): bool
  {
    // Never allow publishing if pending review
    if ($this->status === 'pending_review') {
      return false;
    }

    // Allow publishing to different platforms even if currently publishing/retrying
    // The controller will check for platform-specific conflicts
    if (in_array($this->status, ['publishing', 'retrying'])) {
      return true;
    }

    // If user has publish permission, allow any status except blocked ones
    if ($hasPublishPermission) {
      return true;
    }

    // Otherwise, only allow if approved, failed, published, or was previously approved
    return in_array($this->status, ['approved', 'failed', 'published']) ||
      !is_null($this->approved_at);
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

  /**
   * Get the approval actions for this publication (new approval workflow).
   */
  public function approvalActions(): HasMany
  {
    return $this->hasMany(\App\Models\ApprovalAction::class, 'content_id');
  }

  public function currentApprovalStep(): BelongsTo
  {
    return $this->belongsTo(ApprovalStep::class, 'current_approval_step_id');
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
      ->with('socialAccount')
      ->whereIn('id', function ($query) {
        $query->selectRaw('MAX(id)')
          ->from('social_post_logs')
          ->where('publication_id', $this->id)
          ->groupBy('social_account_id');
      })->get();

    foreach ($logs as $log) {
      $socialAccount = $log->socialAccount;
      $isCurrentAccount = $socialAccount && !$socialAccount->trashed();

      $summary[$log->social_account_id] = [
        'platform' => $log->platform,
        'status' => $log->status,
        'published_at' => $log->published_at,
        'error' => $log->error_message,
        'url' => $log->post_url,
        'account_name' => $log->account_name,
        'account_id' => $socialAccount ? $socialAccount->account_id : null,
        'is_current_account' => $isCurrentAccount,
        'can_unpublish' => $isCurrentAccount && in_array($log->status, ['published', 'failed']),
      ];
    }

    return $summary;
  }

  /**
   * Get publications in other accounts for the same platform
   * This helps identify when content is published in a different account
   */
  public function getPublicationsInOtherAccounts(string $platform): array
  {
    $currentWorkspaceAccounts = SocialAccount::where('workspace_id', $this->workspace_id)
      ->where('platform', $platform)
      ->whereNull('deleted_at')
      ->pluck('id')
      ->toArray();

    $otherAccountLogs = $this->socialPostLogs()
      ->with('socialAccount')
      ->where('platform', $platform)
      ->whereIn('status', ['published', 'orphaned'])
      ->whereNotIn('social_account_id', $currentWorkspaceAccounts)
      ->get();

    return $otherAccountLogs->map(function ($log) {
      return [
        'account_name' => $log->account_name,
        'status' => $log->status,
        'published_at' => $log->published_at,
        'url' => $log->post_url,
      ];
    })->toArray();
  }

  /**
   * Check if publication can be published to a specific platform
   * considering current account vs previously published accounts
   */
  public function canPublishToPlatform(SocialAccount $account): array
  {
    // Check if already published with THIS specific account
    $existingLog = $this->socialPostLogs()
      ->where('social_account_id', $account->id)
      ->where('status', 'published')
      ->first();

    if ($existingLog) {
      return [
        'can_publish' => false,
        'reason' => 'already_published_this_account',
        'message' => 'Already published with this account',
      ];
    }

    // Check if published with a DIFFERENT account of the same platform
    $otherAccountLog = $this->socialPostLogs()
      ->with('socialAccount')
      ->where('platform', $account->platform)
      ->where('social_account_id', '!=', $account->id)
      ->where('status', 'published')
      ->first();

    if ($otherAccountLog) {
      return [
        'can_publish' => true,
        'reason' => 'different_account',
        'message' => "Content is published on a different {$account->platform} account ({$otherAccountLog->account_name}). You can publish to this account as well.",
        'other_account' => [
          'name' => $otherAccountLog->account_name,
          'published_at' => $otherAccountLog->published_at,
        ],
      ];
    }

    return [
      'can_publish' => true,
      'reason' => 'not_published',
      'message' => 'Ready to publish',
    ];
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

  /**
   * Get the recurrence settings for this publication.
   */
  public function recurrenceSettings(): \Illuminate\Database\Eloquent\Relations\HasOne
  {
    return $this->hasOne(PublicationRecurrenceSetting::class);
  }

  /**
   * Check if this is a post type publication
   */
  public function isPost(): bool
  {
    return $this->content_type === 'post';
  }

  /**
   * Check if this is a reel/short video
   */
  public function isReel(): bool
  {
    return $this->content_type === 'reel';
  }

  /**
   * Check if this is a story
   */
  public function isStory(): bool
  {
    return $this->content_type === 'story';
  }

  /**
   * Check if this is a poll
   */
  public function isPoll(): bool
  {
    return $this->content_type === 'poll';
  }

  /**
   * Check if this is a carousel
   */
  public function isCarousel(): bool
  {
    return $this->content_type === 'carousel';
  }

  /**
   * Get supported content types for a platform
   */
  public static function getSupportedContentTypes(string $platform): array
  {
    $supportedTypes = [
      'instagram' => ['post', 'reel', 'story', 'carousel'],
      'twitter' => ['post', 'poll'],
      'tiktok' => ['reel'],
      'youtube' => ['post', 'reel'],
      'facebook' => ['post', 'story', 'poll', 'reel'],
      'linkedin' => ['post', 'carousel'],
      'pinterest' => ['post', 'carousel'],
    ];

    return $supportedTypes[strtolower($platform)] ?? ['post'];
  }

  /**
   * Get all available content types
   */
  public static function getAllContentTypes(): array
  {
    return [
      'post' => [
        'label' => 'Post',
        'description' => 'Standard social media post',
        'icon' => 'FileText',
        'platforms' => ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'],
      ],
      'reel' => [
        'label' => 'Reel/Short',
        'description' => 'Short vertical video',
        'icon' => 'Video',
        'platforms' => ['instagram', 'tiktok', 'youtube', 'facebook'],
      ],
      'story' => [
        'label' => 'Story',
        'description' => 'Temporary 24h content',
        'icon' => 'Clock',
        'platforms' => ['instagram', 'facebook'],
      ],
      'poll' => [
        'label' => 'Poll',
        'description' => 'Interactive poll/survey',
        'icon' => 'BarChart3',
        'platforms' => ['twitter', 'facebook'],
      ],
      'carousel' => [
        'label' => 'Carousel',
        'description' => 'Multiple images/slides',
        'icon' => 'Images',
        'platforms' => ['instagram', 'linkedin', 'pinterest'],
      ],
    ];
  }
}
