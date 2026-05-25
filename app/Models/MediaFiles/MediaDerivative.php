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
}
