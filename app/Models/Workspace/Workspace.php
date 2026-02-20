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


class Workspace extends Model
{
    use HasFactory, SoftDeletes, Notifiable;


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
}
