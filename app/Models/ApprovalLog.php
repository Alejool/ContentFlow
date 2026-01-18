<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Publications\Publication;

class ApprovalLog extends Model
{
  use HasFactory;

  protected $fillable = [
    'publication_id',
    'requested_by',
    'requested_at',
    'reviewed_by',
    'reviewed_at',
    'action',
    'rejection_reason',
  ];

  protected $casts = [
    'requested_at' => 'datetime',
    'reviewed_at' => 'datetime',
  ];

  /**
   * Get the publication that this approval log belongs to.
   */
  public function publication(): BelongsTo
  {
    return $this->belongsTo(Publication::class);
  }

  /**
   * Get the user who requested the approval.
   */
  public function requester(): BelongsTo
  {
    return $this->belongsTo(User::class, 'requested_by');
  }

  /**
   * Get the user who reviewed the approval request.
   */
  public function reviewer(): BelongsTo
  {
    return $this->belongsTo(User::class, 'reviewed_by');
  }

  /**
   * Scope to get pending approval logs.
   */
  public function scopePending($query)
  {
    return $query->whereNull('reviewed_at');
  }

  /**
   * Scope to get approved logs.
   */
  public function scopeApproved($query)
  {
    return $query->where('action', 'approved');
  }

  /**
   * Scope to get rejected logs.
   */
  public function scopeRejected($query)
  {
    return $query->where('action', 'rejected');
  }

  /**
   * Scope to get logs within a date range.
   */
  public function scopeDateRange($query, $startDate, $endDate)
  {
    return $query->whereBetween('requested_at', [$startDate, $endDate]);
  }
}
