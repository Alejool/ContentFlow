<?php

namespace App\Models\Social;

use App\Casts\EncryptedToken;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\User;
use App\Models\Workspace\Workspace;

class SocialAccount extends Model
{
  use HasFactory, SoftDeletes;

  protected $fillable = [
    'user_id',
    'platform',
    'account_id',
    'account_name',
    'access_token',
    'refresh_token',
    'token_expires_at',
    'is_active',
    'last_failed_at',
    'failure_count',
    'account_metadata',
    'workspace_id',
  ];

  protected $casts = [
    'id' => 'integer',
    'user_id' => 'integer',
    'workspace_id' => 'integer',
    'account_id' => 'string',
    'access_token' => EncryptedToken::class,
    'refresh_token' => EncryptedToken::class,
    'token_expires_at' => 'datetime',
    'is_active' => 'boolean',
    'last_failed_at' => 'datetime',
    'failure_count' => 'integer',
    'account_metadata' => 'array',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function workspace(): BelongsTo
  {
    return $this->belongsTo(Workspace::class);
  }

  /**
   * Get the provider attribute (alias for platform).
   *
   * @return string|null
   */
  public function getProviderAttribute(): ?string
  {
    return $this->platform;
  }

  public function scheduledPosts(): HasMany
  {
    return $this->hasMany(ScheduledPost::class);
  }

  public function metrics(): HasMany
  {
    return $this->hasMany(SocialMediaMetrics::class);
  }

  public function postLogs(): HasMany
  {
    return $this->hasMany(SocialPostLog::class);
  }

  public function isTokenExpired(): bool
  {
    if (!$this->token_expires_at) {
      return false;
    }

    return $this->token_expires_at->isPast();
  }

  public function needsReconnection(): bool
  {
    return !$this->is_active || $this->failure_count >= 3;
  }

  public function markAsActive(): void
  {
    $this->update([
      'is_active' => true,
      'failure_count' => 0,
      'last_failed_at' => null,
    ]);
  }

  public function markAsInactive(?string $reason = null): void
  {
    $this->update([
      'is_active' => false,
      'last_failed_at' => now(),
      'failure_count' => $this->failure_count + 1,
    ]);
  }

  public function getLatestMetrics()
  {
    return $this->metrics()->latest('date')->first();
  }

  public function getFollowerGrowth($days = 30)
  {
    $startDate = now()->subDays($days);
    $metrics = $this->metrics()
      ->where('date', '>=', $startDate)
      ->orderBy('date')
      ->get();

    if ($metrics->count() < 2) {
      return 0;
    }

    $firstFollowers = $metrics->first()->followers;
    $lastFollowers = $metrics->last()->followers;

    return $lastFollowers - $firstFollowers;
  }
}
