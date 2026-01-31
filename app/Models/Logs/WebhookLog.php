<?php

namespace App\Models\Logs;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Workspace\Workspace;

class WebhookLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'channel',
        'event_type',
        'payload',
        'response',
        'status_code',
        'success',
        'error_message',
    ];

    protected $casts = [
        'payload' => 'array',
        'response' => 'array',
        'success' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
