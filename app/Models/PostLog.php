<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'scheduled_post_id',
        'response_message',
        'posted_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'scheduled_post_id' => 'integer',
        'posted_at' => 'timestamp',
    ];

    public function scheduledPost(): BelongsTo
    {
        return $this->belongsTo(ScheduledPost::class);
    }
}
