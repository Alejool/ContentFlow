<?php

namespace App\Models\Subscription;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Workspace\Workspace;

class UsageMetric extends Model
{
    protected $fillable = [
        'workspace_id',
        'metric_type',
        'current_usage',
        'limit',
        'period_start',
        'period_end',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function hasReachedLimit(): bool
    {
        // -1 significa ilimitado
        if ($this->limit === -1) {
            return false;
        }

        return $this->current_usage >= $this->limit;
    }

    public function getUsagePercentage(): float
    {
        if ($this->limit === -1) {
            return 0;
        }

        if ($this->limit === 0) {
            return 100;
        }

        return ($this->current_usage / $this->limit) * 100;
    }

    public function getRemainingUsage(): int
    {
        if ($this->limit === -1) {
            return -1; // Ilimitado
        }

        return max(0, $this->limit - $this->current_usage);
    }

    public function isNearLimit(int $threshold = 80): bool
    {
        return $this->getUsagePercentage() >= $threshold;
    }
}
