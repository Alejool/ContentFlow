<?php

namespace App\Models\Logs;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Social\ScheduledPost;

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
        'posted_at' => 'datetime',
    ];

    public function scheduledPost(): BelongsTo
    {
        return $this->belongsTo(ScheduledPost::class);
    }
}
