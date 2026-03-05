<?php

namespace App\Models\Subscription;

use Laravel\Cashier\Subscription as CashierSubscription;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Workspace\Workspace;

class Subscription extends CashierSubscription
{
    protected $fillable = [
        'user_id',
        'workspace_id',
        'type',
        'stripe_id',
        'stripe_status',
        'stripe_price',
        'quantity',
        'plan',
        'status',
        'trial_ends_at',
        'ends_at',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function isActive(): bool
    {
        return $this->stripe_status === 'active' || $this->onTrial();
    }

    public function onTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function getPlanLimits(): array
    {
        return config("plans.{$this->plan}");
    }

    public function hasFeature(string $feature): bool
    {
        $features = config("plans.{$this->plan}.features", []);
        return in_array($feature, $features);
    }

    public function canPerformAction(string $limitType): bool
    {
        $limits = $this->getPlanLimits()['limits'] ?? [];
        $limit = $limits[$limitType] ?? 0;

        // -1 significa ilimitado
        if ($limit === -1) {
            return true;
        }

        return true; // La verificación real se hace en UsageMetric
    }
}
