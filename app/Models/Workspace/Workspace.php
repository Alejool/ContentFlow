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
use Laravel\Sanctum\HasApiTokens;


class Workspace extends Model
{
    use HasFactory, SoftDeletes, Notifiable, Billable, HasApiTokens;


    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
        'public',
        'allow_public_invites',
        'slack_webhook_url',
        'discord_webhook_url',
        'white_label_logo_url',
        'white_label_primary_color',
        'white_label_favicon_url',
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

    /**
     * Route model binding key — use slug so URLs work with slugs.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
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
     * Get monthly post count (published + scheduled).
     */
    public function getMonthlyPostCount(): int
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        // Count published posts from this month
        $publishedCount = \App\Models\Social\SocialPostLog::where('workspace_id', $this->id)
            ->whereIn('status', ['published', 'orphaned', 'publishing'])
            ->whereBetween('published_at', [$start, $end])
            ->count();

        // Count scheduled posts for this month (that are still scheduled)
        $scheduledCount = \App\Models\Social\ScheduledPost::where('workspace_id', $this->id)
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_at', [$start, $end])
            ->count();

        return $publishedCount + $scheduledCount;
    }

    /**
     * Get monthly publication count. (DEPRECATED in favor of getMonthlyPostCount)
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
            ->wherePivot('role_id', function ($query) {
                $query->select('id')
                    ->from('roles')
                    ->where('slug', 'owner')
                    ->limit(1);
            })
            ->first();
    }

    /**
     * Get workspace plan name.
     */
    public function getPlanName(): string
    {
        $subscription = $this->subscription;
        return $subscription?->plan ?? 'free';
    }

    /**
     * Get workspace plan limits.
     */
    public function getPlanLimits(): array
    {
        $plan = $this->getPlanName();
        return config("plans.{$plan}.limits", config('plans.free.limits'));
    }

    /**
     * Get workspace plan features.
     */
    public function getPlanFeatures(): array
    {
        $plan = $this->getPlanName();
        return config("plans.{$plan}.features", config('plans.free.features'));
    }

    /**
     * Check if workspace can perform an action based on limits.
     */
    public function canPerformAction(string $limitType): bool
    {
        $usageService = app(\App\Services\WorkspaceUsageService::class);
        return $usageService->canPerformAction($this, $limitType);
    }

    /**
     * Check if workspace can add more team members.
     */
    public function canAddTeamMember(): bool
    {
        return $this->canPerformAction('team_members');
    }

    /**
     * Get remaining team member slots.
     */
    public function getRemainingTeamSlots(): int
    {
        $limits = $this->getPlanLimits();
        $limit = $limits['team_members'] ?? 1;

        if ($limit === -1) {
            return PHP_INT_MAX;
        }

        $currentMembers = $this->users()->count();
        return max(0, $limit - $currentMembers);
    }

    /**
     * Check if workspace can connect more social accounts.
     */
    public function canConnectSocialAccount(): bool
    {
        return $this->canPerformAction('social_accounts');
    }

    /**
     * Check if workspace can add more external integrations.
     */
    public function canAddIntegration(): bool
    {
        return $this->canPerformAction('external_integrations');
    }

    /**
     * Check if workspace has a specific feature.
     */
    public function hasFeature(string $feature): bool
    {
        $features = $this->getPlanFeatures();

        // Check if feature exists as a key (for features with values)
        if (isset($features[$feature])) {
            return $features[$feature] === true || $features[$feature] !== false;
        }

        // Check if feature exists in array (for simple feature flags)
        return in_array($feature, $features);
    }

    /**
     * Get analytics type for workspace.
     */
    public function getAnalyticsType(): string
    {
        $features = $this->getPlanFeatures();
        return $features['analytics_type'] ?? 'basic';
    }

    /**
     * Get support type for workspace.
     */
    public function getSupportType(): string
    {
        $features = $this->getPlanFeatures();
        return $features['support_type'] ?? 'email';
    }

    /**
     * Check if user is the owner of this workspace.
     */
    public function isOwner(User $user): bool
    {
        return $this->created_by === $user->id;
    }

    /**
     * Check if user can manage subscription (only owner).
     */
    public function canManageSubscription(User $user): bool
    {
        return $this->isOwner($user);
    }

    /**
     * Increment usage for a metric.
     */
    public function incrementUsage(string $metricType, int $amount = 1): void
    {
        $usageService = app(\App\Services\WorkspaceUsageService::class);
        $usageService->incrementUsage($this, $metricType, $amount);
    }

    /**
     * Decrement usage for a metric.
     */
    public function decrementUsage(string $metricType, int $amount = 1): void
    {
        $usageService = app(\App\Services\WorkspaceUsageService::class);
        $usageService->decrementUsage($this, $metricType, $amount);
    }
}
