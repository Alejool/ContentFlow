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
use App\Models\SocialAccount;

class Publication extends Model
{
    use HasFactory;

    protected $table = 'publications';

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
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'publish_date' => 'date',
        'scheduled_at' => 'datetime',
    ];

    public function media(): HasMany
    {
        return $this->hasMany(PublicationMedia::class)->orderBy('order');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    public function scheduledPosts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class, 'publication_id');
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


    public function campaigns(): BelongsToMany
    {
        return $this->belongsToMany(Campaign::class, 'campaign_publication')
            ->withPivot('order')
            ->withTimestamps();
    }

    // Accessors
    public function getIsActiveAttribute()
    {
        return $this->status === 'published' &&
            $this->start_date <= now() &&
            $this->end_date >= now();
    }
}
