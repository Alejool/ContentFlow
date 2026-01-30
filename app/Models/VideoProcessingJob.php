<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Publications\Publication;

class VideoProcessingJob extends Model
{
    protected $fillable = [
        'user_id',
        'publication_id',
        'operation',
        'input_path',
        'output_paths',
        'parameters',
        'status',
        'progress',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'output_paths' => 'array',
        'parameters' => 'array',
        'progress' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }
}
