<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        'file_type',
        'mime_type',
        'size',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'size' => 'integer',
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

    // Helper methods for derivatives
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

    public function getFullPathAttribute(): string
    {
        return storage_path('app/' . $this->file_path);
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
}
