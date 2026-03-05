<?php

namespace App\Models\Workspace;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\Publications\Publication;
use App\Models\Workspace\WorkspaceUser;
use App\Models\User;
use App\Models\Social\SocialAccount;
use App\Models\MediaFiles\MediaFile;
use App\Models\Campaigns\Campaign;
use Illuminate\Notifications\Notifiable;
use App\Models\Calendar\ExternalCalendarConnection;
use App\Models\Calendar\BulkOperationHistory;
use App\Models\Subscription\Subscription;
use App\Models\Subscription\UsageMetric;
use Laravel\Cashier\Billable;


class Workspace extends Model
{
    use HasFactory, SoftDeletes, Notifiable, Billable;


    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
        'public',
        'allow_public_invites',
        'slack_webhook_url',
        'discord_webhook_url',
    ];

    protected static function booted()
    {
        static::creating(function ($workspace) {
            $baseSlug = $workspace->slug ?: Str::slug($workspace->name ?: 'workspace');
            $slug = $baseSlug;

            // Ensure slug is unique (including soft-deleted ones)
            $count = 0;
            while (static::withTrashed()->where('slug', $slug)->exists()) {
                $count++;
                // Safety break if it's too many attempts or if base name is empty
                if ($count > 10) {
                    $slug = $baseSlug . '-' . time() . '-' . Str::random(4);
                    break;
                }

                // Increase randomness as we fail
                $randomLen = $count > 3 ? 8 : 4;
                $slug = $baseSlug . '-' . Str::lower(Str::random($randomLen));
            }

            $workspace->slug = $slug;
        });
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'workspace_user')
            ->using(WorkspaceUser::class)
            ->withPivot('role_id')
            ->withTimestamps();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function publications()
    {
        return $this->hasMany(Publication::class);
    }

    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function mediaFiles()
    {
        return $this->hasMany(MediaFile::class);
    }

    /**
     * Route notifications for the Slack channel.
     */
    public function routeNotificationForSlack()
    {
        return $this->slack_webhook_url;
    }

    /**
     * Route notifications for the Discord channel.
     */
    public function routeNotificationForDiscord()
    {
        return $this->discord_webhook_url;
    }

    /**
     * Get the external calendar connections for this workspace.
     */
    public function externalCalendarConnections()
    {
        return $this->hasMany(ExternalCalendarConnection::class);
    }

    /**
     * Get the bulk operation history for this workspace.
     */
    public function bulkOperationHistory()
    {
        return $this->hasMany(BulkOperationHistory::class);
    }

    /**
     * Get the subscription for this workspace.
     */
    public function subscription()
    {
        return $this->hasOne(Subscription::class);
    }

    /**
     * Get the usage metrics for this workspace.
     */
    public function usageMetrics()
    {
        return $this->hasMany(UsageMetric::class);
    }

    /**
     * Get the current usage metric for a specific type.
     */
    public function getUsageMetric(string $metricType): ?UsageMetric
    {
        return $this->usageMetrics()
            ->where('metric_type', $metricType)
            ->where('period_start', '<=', now())
            ->where('period_end', '>=', now())
            ->first();
    }

    /**
     * Get monthly publication count.
     */
    public function getMonthlyPublicationCount(): int
    {
        return $this->publications()
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
    }

    /**
     * Get storage usage in GB.
     */
    public function getStorageUsageGB(): float
    {
        $bytes = $this->mediaFiles()->sum('size');
        return round($bytes / (1024 * 1024 * 1024), 2);
    }

    /**
     * Check if workspace has an active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        return $this->subscription && $this->subscription->isActive();
    }

    /**
     * Get the workspace owner.
     */
    public function owner()
    {
        return $this->users()
            ->wherePivot('role_id', function($query) {
                $query->select('id')
                    ->from('roles')
                    ->where('slug', 'owner')
                    ->limit(1);
            })
            ->first();
    }
}
