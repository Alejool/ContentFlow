<?php

namespace App\Models\MediaFiles;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use \Illuminate\Database\Eloquent\Relations\HasOne;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Social\ScheduledPost;
use App\Models\MediaFiles\MediaDerivative;

class MediaFile extends Model
{
    use HasFactory;
    protected $appends = [];
    protected $with = [];

    public function thumbnail(): HasOne
    {
        return $this->hasOne(MediaDerivative::class)->where('derivative_type', 'thumbnail');
    }


    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        's3_key',
        'file_type',
        'youtube_type',
        'duration',
        'mime_type',
        'size',
        'workspace_id',
        'status',
        'processing_error',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'workspace_id' => 'integer',
        'size' => 'integer',
        'duration' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function scheduledPosts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }

    public function derivatives(): HasMany
    {
        return $this->hasMany(MediaDerivative::class);
    }

    /**
     * IMPORTANTE: Este accessor NO genera URLs directas de S3
     * El bucket es privado - solo devolvemos la ruta/key
     * El frontend debe usar usePresignedUrl hook para obtener URLs temporales
     * 
     * Si el valor ya es una URL completa (http), la devolvemos tal cual
     * Si es una ruta S3 key, la devolvemos sin procesar
     */
    public function getFilePathAttribute($value)
    {
        return $value;
    }

    /**
     * Accessor for s3_key.
     * Fallback to file_path for older records where s3_key is not populated.
     */
    public function getS3KeyAttribute($value)
    {
        return $value ?: $this->file_path;
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
