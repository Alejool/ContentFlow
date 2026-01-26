<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * WorkspaceUser Pivot Model
 *
 * This pivot model connects Users to Workspaces and stores the role_id
 * for the user in that specific workspace.
 *
 * IMPORTANT: The 'role' relationship is auto-loaded via $with = ['role']
 *
 * Usage:
 *   $workspace = $user->workspaces->first();
 *   $role = $workspace->pivot->role; // Auto-loaded!
 *   $permissions = $role->permissions;
 */
class WorkspaceUser extends Pivot
{
    protected $table = 'workspace_user';

    /**
     * Auto-load the role relationship.
     * This means whenever you access a workspace through a user,
     * the role will already be loaded.
     */
    protected $with = ['role'];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
