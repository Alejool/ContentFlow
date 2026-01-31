<?php

namespace App\Models\Social;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\MediaFiles\MediaFile;
use App\Models\Campaigns\Campaign;
use App\Models\Publications\Publication;
use App\Models\Logs\PostLog;

class ScheduledPost extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'social_account_id',
        'campaign_id',
        'publication_id',
        'scheduled_at',
        'status',
        'account_name',
        'platform',
        'workspace_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'social_account_id' => 'integer',
        'campaign_id' => 'integer',
        'workspace_id' => 'integer',
        'scheduled_at' => 'datetime',
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

    public function mediaFile(): BelongsTo
    {
        return $this->belongsTo(MediaFile::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function postLogs(): HasMany
    {
        return $this->hasMany(PostLog::class);
    }
}
