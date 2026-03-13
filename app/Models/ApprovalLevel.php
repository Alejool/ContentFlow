<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Role\Role;

class ApprovalLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'approval_workflow_id',
        'level_number',
        'level_name',
        'role_id',
        'user_id',
    ];

    /**
     * Get the workflow that owns this approval level.
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'approval_workflow_id');
    }

    /**
     * Get the role assigned to this approval level.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the user assigned to this approval level.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Scope to order levels by their level number.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('level_number');
    }
}
