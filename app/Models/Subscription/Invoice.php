<?php

namespace App\Models\Subscription;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Workspace\Workspace;

class Invoice extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'provider',
        'provider_invoice_id',
        'provider_customer_id',
        'provider_subscription_id',
        'invoice_number',
        'status',
        'subtotal',
        'tax',
        'total',
        'currency',
        'plan_name',
        'description',
        'invoice_pdf_url',
        'hosted_invoice_url',
        'invoice_date',
        'period_start',
        'period_end',
        'sync_status',
        'last_synced_at',
        'sync_error',
        'metadata',
    ];

    protected $casts = [
        'invoice_date' => 'datetime',
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'last_synced_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'metadata' => 'array',
    ];

    /**
     * Get the workspace that owns the invoice.
     */
    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Scope a query to only include invoices for a specific workspace.
     */
    public function scopeForWorkspace($query, int $workspaceId)
    {
        return $query->where('workspace_id', $workspaceId);
    }

    /**
     * Scope a query to only include invoices from a specific provider.
     */
    public function scopeByProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope a query to only include paid invoices.
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope a query to only include failed invoices.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope a query to only include invoices that need syncing.
     */
    public function scopeNeedsSync($query)
    {
        return $query->whereIn('sync_status', ['pending', 'failed']);
    }
}
