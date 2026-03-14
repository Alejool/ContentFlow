<?php

namespace App\Models\Approval;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Publications\Publication;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\Logs\ApprovalLog;
use App\Models\User;

class ApprovalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'publication_id',
        'workflow_id',
        'current_step_id',
        'status',
        'submitted_by',
        'submitted_at',
        'completed_at',
        'completed_by',
        'rejection_reason',
        'metadata',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    // Status constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the publication that this request belongs to.
     */
    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    /**
     * Get the workflow for this request.
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    /**
     * Get the current step.
     */
    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(ApprovalLevel::class, 'current_step_id');
    }

    /**
     * Get the user who submitted the request.
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * Get the user who completed the request.
     */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Get all logs for this request (complete audit trail).
     */
    public function logs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class, 'approval_request_id')->orderBy('created_at');
    }

    /**
     * Scope to get pending requests.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope to get approved requests.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope to get rejected requests.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    /**
     * Scope to get requests for a specific user.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where('submitted_by', $user->id);
    }

    /**
     * Scope to get requests pending approval by a specific user.
     * Only shows requests where the user is responsible for the current step.
     */
    public function scopePendingForUser($query, User $user)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->whereHas('currentStep', function ($q) use ($user) {
                // Check if user has the role assigned to this step
                $q->whereHas('role.users', function ($roleQuery) use ($user) {
                    $roleQuery->where('users.id', $user->id);
                })
                // OR if user is directly assigned to this step
                ->orWhere('user_id', $user->id)
                // OR if user is in the step's user list
                ->orWhereHas('users', function ($userQuery) use ($user) {
                    $userQuery->where('users.id', $user->id);
                });
            });
    }

    /**
     * Scope to get the latest request for a publication.
     */
    public function scopeLatestForPublication($query, int $publicationId)
    {
        return $query->where('publication_id', $publicationId)
            ->orderBy('submitted_at', 'desc')
            ->limit(1);
    }

    /**
     * Check if request is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if request is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * Check if request is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Check if request is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Check if request is completed (approved or rejected).
     */
    public function isCompleted(): bool
    {
        return in_array($this->status, [self::STATUS_APPROVED, self::STATUS_REJECTED]);
    }

    /**
     * Get the rejection details from logs.
     */
    public function getRejectionDetails(): ?array
    {
        if (!$this->isRejected()) {
            return null;
        }

        $rejectionLog = $this->logs()
            ->where('action', 'rejected')
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$rejectionLog) {
            return null;
        }

        return [
            'level_number' => $rejectionLog->level_number,
            'step_name' => $rejectionLog->approvalStep?->level_name,
            'rejected_by' => $rejectionLog->user,
            'rejected_at' => $rejectionLog->created_at,
            'reason' => $rejectionLog->comment ?? $this->rejection_reason,
        ];
    }
}
