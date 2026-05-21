<?php

namespace App\Models\Auth;

use App\Models\Auth\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

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

    private const IDENTIFIER_ALIASES = [
        'publish' => ['publish', 'publish_content', 'publish-content'],
        'publish_content' => ['publish', 'publish_content', 'publish-content'],
        'publish-content' => ['publish', 'publish_content', 'publish-content'],
        'manage-content' => ['manage-content', 'manage_content'],
        'manage_content' => ['manage-content', 'manage_content'],
        'view-content' => ['view-content', 'view_content'],
        'view_content' => ['view-content', 'view_content'],
        'create-content' => ['create-content', 'create_content'],
        'create_content' => ['create-content', 'create_content'],
        'manage-workspace' => ['manage-workspace', 'manage_workspace'],
        'manage_workspace' => ['manage-workspace', 'manage_workspace'],
    ];

    /**
     * Return normalized permission identifiers for legacy and slug variants.
     *
     * This supports both legacy permission names/slugs and the newer
     * publish_content / publish-content conventions.
     */
    public static function normalizeIdentifier(string $permission): array
    {
        $permission = trim((string) $permission);

        if ($permission === '') {
            return [];
        }

        $normalizedPermission = strtolower($permission);

        $variants = [
            $permission,
            Str::slug($permission),
            Str::snake($permission, '_'),
            str_replace('_', '-', $permission),
            str_replace('-', '_', $permission),
        ];

        if (isset(self::IDENTIFIER_ALIASES[$normalizedPermission])) {
            $variants = array_merge($variants, self::IDENTIFIER_ALIASES[$normalizedPermission]);
        }

        return array_values(array_unique($variants));
    }

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission')
            ->withTimestamps();
    }
}
