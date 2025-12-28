<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class WorkspaceUser extends Pivot
{
    protected $table = 'workspace_user';
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
