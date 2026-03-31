<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Role\Role;
use App\Models\Logs\ApprovalLog;

class ApprovalLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'approval_workflow_id',
        'level_number',
        'level_name',
        'role_id',
        'user_id',
        'require_all_users',
        'auto_advance',
        'timeout_hours',
        'description',
    ];

    protected $casts = [
        'require_all_users' => 'boolean',
        'auto_advance' => 'boolean',
    ];

    protected $appends = ['name'];

    /**
     * Get the name attribute (alias for level_name).
     */
    public function getNameAttribute(): ?string
    {
        return $this->level_name;
    }

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
     * Get specific users assigned to this step (many-to-many).
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            \App\Models\User::class,
            'approval_step_users',
            'step_id',
            'user_id'
        )->withTimestamps();
    }

    /**
     * Get all step approvals for this level.
     */
    /**
     * Get all logs for this step.
     */
    public function logs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class, 'approval_step_id');
    }

    /**
     * Scope to order levels by their level number.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('level_number');
    }

    /**
     * Get all approvers for this step (either from role or specific users).
     */
    public function getApprovers(): \Illuminate\Support\Collection
    {
        // If step has specific users assigned via pivot table
        if ($this->users()->exists()) {
            return $this->users;
        }

        // If step has a single user assigned via user_id
        if ($this->user_id) {
            $user = \App\Models\User::find($this->user_id);
            return $user ? collect([$user]) : collect();
        }

        // If step has role assigned
        if ($this->role_id) {
            return \App\Models\User::whereHas('roles', function ($query) {
                $query->where('roles.id', $this->role_id)
                    ->where('role_user.workspace_id', $this->workflow->workspace_id);
            })->get();
        }

        return collect();
    }
}
