<?php

namespace App\Models\Integrations;

use App\Models\Workspace\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegrationDeliveryLog extends Model
{
    protected $fillable = [
        'workspace_id',
        'subscription_id',
        'channel_type',
        'event_type',
        'payload',
        'status',
        'error_message',
        'http_status',
        'delivered_at',
    ];

    protected $casts = [
        'payload'      => 'array',
        'delivered_at' => 'datetime',
    ];

    const STATUS_PENDING   = 'pending';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FAILED    = 'failed';

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(IntegrationEventSubscription::class, 'subscription_id');
    }
}
