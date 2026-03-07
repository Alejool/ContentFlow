<?php

namespace App\Models\Subscription;

use Illuminate\Database\Eloquent\Model;
use App\Models\Workspace\Workspace;

class StripeInvoice extends Model
{
    protected $fillable = [
        'workspace_id',
        'stripe_invoice_id',
        'stripe_customer_id',
        'stripe_subscription_id',
        'invoice_number',
        'status',
        'subtotal',
        'tax',
        'total',
        'currency',
        'plan_name',
        'description',
        'invoice_pdf',
        'hosted_invoice_url',
        'invoice_date',
        'period_start',
        'period_end',
    ];

    protected $casts = [
        'invoice_date' => 'datetime',
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
