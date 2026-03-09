<?php

namespace App\Models\Subscription;

use App\Models\Workspace\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceAddon extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'addon_type',
        'addon_sku',
        'quantity',
        'total_amount',
        'used_amount',
        'price_paid',
        'stripe_payment_intent_id',
        'stripe_invoice_id',
        'payment_gateway',
        'payment_id',
        'purchased_by',
        'purchased_at',
        'expires_at',
        'is_active',
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

    /**
     * Get the workspace that owns the addon.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Get the user who purchased the addon.
     */
    public function purchaser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'purchased_by');
    }

    /**
     * Scope to get active addons.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope to get addons by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('addon_type', $type);
    }

    /**
     * Check if addon has remaining amount.
     */
    public function hasRemaining(): bool
    {
        return $this->used_amount < $this->total_amount;
    }

    /**
     * Get remaining amount.
     */
    public function getRemainingAmount(): int
    {
        return max(0, $this->total_amount - $this->used_amount);
    }

    /**
     * Get usage percentage.
     */
    public function getUsagePercentage(): float
    {
        if ($this->total_amount === 0) {
            return 0;
        }

        return round(($this->used_amount / $this->total_amount) * 100, 2);
    }

    /**
     * Increment used amount.
     */
    public function incrementUsage(int $amount = 1): bool
    {
        if ($this->used_amount + $amount > $this->total_amount) {
            return false;
        }

        $this->increment('used_amount', $amount);

        // Desactivar si se agotó
        if ($this->fresh()->used_amount >= $this->total_amount) {
            $this->update(['is_active' => false]);
        }

        return true;
    }

    /**
     * Decrement used amount (for refunds or corrections).
     */
    public function decrementUsage(int $amount = 1): void
    {
        $newUsage = max(0, $this->used_amount - $amount);
        $this->update([
            'used_amount' => $newUsage,
            'is_active' => $newUsage < $this->total_amount,
        ]);
    }

    /**
     * Check if addon is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Deactivate addon.
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }
}
