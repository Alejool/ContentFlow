<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class MediaFile extends Model
{
    use HasFactory;
    protected $appends = [];

    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        'file_type',
        'youtube_type',
        'duration',
        'mime_type',
        'size',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'size' => 'integer',
        'duration' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scheduledPosts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }

    public function derivatives(): HasMany
    {
        return $this->hasMany(MediaDerivative::class);
    }

    public function getFilePathAttribute($value)
    {
        return $value ? (str_starts_with($value, 'http') ? $value : Storage::disk('s3')->url($value)) : null;
    }


    public function getThumbnail()
    {
        return $this->derivatives()
            ->where('derivative_type', 'thumbnail')
            ->first();
    }

    public function getDerivativeForPlatform($platform, $type = 'platform_variant')
    {
        return $this->derivatives()
            ->where('derivative_type', $type)
            ->where('platform', $platform)
            ->first();
    }

    public function getPreview()
    {
        return $this->derivatives()
            ->where('derivative_type', 'preview')
            ->first();
    }

    public function getYoutubeThumbnail()
    {
        return $this->derivatives()
            ->where('derivative_type', 'thumbnail')
            ->where('platform', 'youtube')
            ->first();
    }

    /**
     * Check if video can be marked as a YouTube Short
     * Shorts must be 60 seconds or less
     */
    public function canBeYoutubeShort(): bool
    {
        if ($this->file_type !== 'video') {
            return false;
        }

        if ($this->duration === null) {
            return false;
        }

        return $this->duration <= 60;
    }

    /**
     * Get formatted duration string
     */
    public function getFormattedDuration(): ?string
    {
        if ($this->duration === null) {
            return null;
        }

        $minutes = floor($this->duration / 60);
        $seconds = $this->duration % 60;

        if ($minutes > 0) {
            return sprintf('%d:%02d', $minutes, $seconds);
        }

        return sprintf('0:%02d', $seconds);
    }
}
