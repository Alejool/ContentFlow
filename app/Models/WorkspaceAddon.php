<?php

namespace App\Models;

use App\Models\Workspace\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceAddon extends Model
{
    protected $fillable = [
        'workspace_id',
        'addon_type',
        'addon_sku',
        'quantity',
        'total_amount',
        'used_amount',
        'price_paid',
        'currency',
        'purchased_at',
        'expires_at',
        'is_active',
        'stripe_payment_intent_id',
        'stripe_invoice_id',
        'stripe_session_id',
        'stripe_customer_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'total_amount' => 'integer',
        'used_amount' => 'integer',
        'price_paid' => 'decimal:2',
        'purchased_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function isActive(): bool
    {
        return $this->is_active && 
               ($this->expires_at === null || $this->expires_at->isFuture());
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function getAvailable(): int
    {
        return max(0, $this->total_amount - $this->used_amount);
    }

    public function incrementUsed(int $amount = 1): void
    {
        $this->increment('used_amount', $amount);
    }

    public function decrementUsed(int $amount = 1): void
    {
        $this->decrement('used_amount', max(0, $amount));
    }
}
