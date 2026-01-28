<?php

namespace App\Models\Publications;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Publications\Publication;
use App\Models\MediaFile;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PublicationMedia extends Model
{
    use HasFactory;

    protected $table = 'publication_media';

    protected $fillable = [
        'publication_id',
        'media_file_id',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function mediaFile(): BelongsTo
    {
        return $this->belongsTo(MediaFile::class);
    }
}
