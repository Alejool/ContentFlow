<?php

namespace App\Models\Reports;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Workspace\Workspace;
use App\Models\User;

class ScheduledReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'user_id',
        'name',
        'type',
        'frequency',
        'recipients',
        'filters',
        'is_active',
        'last_sent_at',
        'next_send_at',
    ];

    protected $casts = [
        'recipients' => 'array',
        'filters' => 'array',
        'is_active' => 'boolean',
        'last_sent_at' => 'datetime',
        'next_send_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDueToSend($query)
    {
        return $query->active()
            ->where('next_send_at', '<=', now());
    }
}
