<?php

namespace App\Models\Logs;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Approval\ApprovalRequest;
use App\Models\ApprovalLevel;
use App\Models\User;

class ApprovalLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'approval_request_id',
        'approval_step_id',
        'user_id',
        'action',
        'level_number',
        'comment',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Action constants
    public const ACTION_SUBMITTED = 'submitted';
    public const ACTION_APPROVED = 'approved';
    public const ACTION_REJECTED = 'rejected';
    public const ACTION_REASSIGNED = 'reassigned';
    public const ACTION_CANCELLED = 'cancelled';
    public const ACTION_AUTO_ADVANCED = 'auto_advanced';

    /**
     * Get the approval request that this log belongs to.
     */
    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    /**
     * Get the approval step/level associated with this log.
     */
    public function approvalStep(): BelongsTo
    {
        return $this->belongsTo(ApprovalLevel::class, 'approval_step_id');
    }

    /**
     * Get the user who performed this action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get logs for a specific request.
     */
    public function scopeForRequest($query, int $requestId)
    {
        return $query->where('approval_request_id', $requestId);
    }

    /**
     * Scope to get logs by action type.
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to get approved logs.
     */
    public function scopeApproved($query)
    {
        return $query->where('action', self::ACTION_APPROVED);
    }

    /**
     * Scope to get rejected logs.
     */
    public function scopeRejected($query)
    {
        return $query->where('action', self::ACTION_REJECTED);
    }

    /**
     * Scope to get logs for a specific level.
     */
    public function scopeForLevel($query, int $levelNumber)
    {
        return $query->where('level_number', $levelNumber);
    }

    /**
     * Scope to get logs within a date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Check if this log represents an approval action.
     */
    public function isApproval(): bool
    {
        return $this->action === self::ACTION_APPROVED;
    }

    /**
     * Check if this log represents a rejection action.
     */
    public function isRejection(): bool
    {
        return $this->action === self::ACTION_REJECTED;
    }

    /**
     * Check if this log represents a submission action.
     */
    public function isSubmission(): bool
    {
        return $this->action === self::ACTION_SUBMITTED;
    }
}
