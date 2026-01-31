<?php

namespace App\Models\MediaFiles;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use App\Models\MediaFiles\MediaFile;

class MediaDerivative extends Model
{
    use HasFactory;
    protected $appends = [];


    protected $fillable = [
        'media_file_id',
        'derivative_type',
        'file_path',
        'file_name',
        'mime_type',
        'size',
        'width',
        'height',
        'platform',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    public function mediaFile(): BelongsTo
    {
        return $this->belongsTo(MediaFile::class);
    }

    // Scopes
    public function scopeOfType($query, $type)
    {
        return $query->where('derivative_type', $type);
    }

    public function scopeForPlatform($query, $platform)
    {
        return $query->where('platform', $platform);
    }

    public function scopeThumbnails($query)
    {
        return $query->where('derivative_type', 'thumbnail');
    }

    public function scopePreviews($query)
    {
        return $query->where('derivative_type', 'preview');
    }


    // Accessors
    public function getFilePathAttribute($value)
    {
        return $value ? (str_starts_with($value, 'http') ? $value : Storage::disk('s3')->url($value)) : null;
    }
}
