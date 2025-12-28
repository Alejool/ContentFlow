<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'permission_role')
            ->withTimestamps();
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'workspace_user')
            ->withPivot('workspace_id')
            ->withTimestamps();
    }
}
