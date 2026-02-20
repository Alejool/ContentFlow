<?php

namespace App\Models\Calendar;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Carbon\Carbon;

class BulkOperationHistory extends Model
{
    protected $table = 'bulk_operation_history';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'workspace_id',
        'operation_type',
        'event_ids',
        'previous_state',
        'new_state',
        'successful_count',
        'failed_count',
        'error_details',
    ];

    protected $casts = [
        'event_ids' => 'array',
        'previous_state' => 'array',
        'new_state' => 'array',
        'error_details' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user that performed the operation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the workspace where the operation was performed.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Check if this operation can be undone (within 1 hour).
     */
    public function canUndo(): bool
    {
        if (!$this->created_at) {
            return false;
        }

        // Can only undo operations from the last hour
        return $this->created_at->diffInHours(Carbon::now()) < 1;
    }
}
