<?php

namespace App\Models\Publications;

use App\Models\User;
use App\Models\CampaignAnalytics;
use App\Models\ScheduledPost;
use App\Models\Campaign;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\MediaFile;
use App\Models\SocialPostLog;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class Publication extends Model
{
  use HasFactory;

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
  protected $status = [
    'draft',
    'published',
    'publishing',
    'failed',
    'pending_review',
    'approved',
    'scheduled',
    'rejected',
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
  ];


  protected $casts = [
    'start_date' => 'date',
    'end_date' => 'date',
    'publish_date' => 'date',
    'scheduled_at' => 'datetime',
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
    return $query->where('status', $this->status[0]);
  }

  public function scopePublished($query)
  {
    return $query->where('status', $this->status[1]);
  }

  public function scopePublishing($query)
  {
    return $query->where('status', $this->status[2]);
  }

  public function scopeFailed($query)
  {
    return $query->where('status', $this->status[3]);
  }

  public function scopePendingReview($query)
  {
    return $query->where('status', $this->status[4]);
  }

  public function scopeApproved($query)
  {
    return $query->where('status', $this->status[5]);
  }

  public function scopeScheduled($query)
  {
    return $query->where('status', $this->status[6]);
  }

  public function scopeRejected($query)
  {
    return $query->where('status', $this->status[7]);
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
    return $this->hasMany(\App\Models\SocialPostLog::class, 'publication_id');
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
    return $this->hasMany(\App\Models\ApprovalLog::class)->orderBy('requested_at', 'desc');
  }

  // Accessors
  public function getIsActiveAttribute()
  {
    return $this->status === 'published' &&
      $this->start_date <= now() &&
      $this->end_date >= now();
  }
}
