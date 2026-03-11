<?php

namespace App\Models\Role;

use App\Models\Permission\Permission;
use App\Models\User;
use App\Models\ApprovalLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Role extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'approval_participant',
    ];

    protected $casts = [
        'is_system_role' => 'boolean',
        'approval_participant' => 'boolean',
    ];

    // Role constants
    public const OWNER = 'owner';
    public const ADMIN = 'admin';
    public const EDITOR = 'editor';
    public const VIEWER = 'viewer';

    /**
     * Get the permissions that belong to this role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission')
            ->withTimestamps();
    }

    /**
     * Get the users that have this role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user')
            ->withPivot('workspace_id', 'assigned_by', 'assigned_at');
    }

    /**
     * Get the approval levels that use this role.
     */
    public function approvalLevels(): HasMany
    {
        return $this->hasMany(ApprovalLevel::class);
    }

    /**
     * Scope to filter only system roles.
     */
    public function scopeSystemRoles(Builder $query): Builder
    {
        return $query->where('is_system_role', true);
    }

    /**
     * Scope to filter roles that can participate in approval workflows.
     */
    public function scopeApprovalParticipants(Builder $query): Builder
    {
        return $query->where('approval_participant', true);
    }
}
