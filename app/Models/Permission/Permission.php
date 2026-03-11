<?php

namespace App\Models\Permission;

use App\Models\Role\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    // Permission constants
    public const VIEW_CONTENT = 'view_content';
    public const CREATE_CONTENT = 'create_content';
    public const MANAGE_CONTENT = 'manage_content';
    public const PUBLISH_CONTENT = 'publish_content';
    public const MANAGE_WORKSPACE = 'manage_workspace';

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission')
            ->withTimestamps();
    }
}
