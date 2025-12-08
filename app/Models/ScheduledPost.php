<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduledPost extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'user_id',
        'social_account_id',
        'campaign_id',
        'media_file_id',
        'caption',
        'scheduled_at',
        'status',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'social_account_id' => 'integer',
        'campaign_id' => 'integer',
        'media_file_id' => 'integer',
        'scheduled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
        return $this->belongsTo(\App\Models\Campaigns\Campaign::class);
    }

    public function postLogs(): HasMany
    {
        return $this->hasMany(PostLog::class);
    }
}
