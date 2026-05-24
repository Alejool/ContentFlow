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

    public const VIEW_CONTENT_SLUG = 'view-content';
    public const CREATE_CONTENT_SLUG = 'create-content';
    public const MANAGE_CONTENT_SLUG = 'manage-content';
    public const PUBLISH_CONTENT_SLUG = 'publish';
    public const SUBMIT_FOR_APPROVAL = 'submit_for_approval';
    public const SUBMIT_FOR_APPROVAL_SLUG = 'submit-for-approval';
    public const MANAGE_WORKSPACE_SLUG = 'manage-workspace';

    private const IDENTIFIER_ALIASES = [
        'publish' => ['publish', 'publish_content', 'publish-content'],
        'publish_content' => ['publish', 'publish_content', 'publish-content'],
        'publish-content' => ['publish', 'publish_content', 'publish-content'],
        'submit_for_approval' => ['submit_for_approval', 'submit-for-approval'],
        'submit-for-approval' => ['submit_for_approval', 'submit-for-approval'],
        'manage-content' => ['manage-content', 'manage_content'],
        'manage_content' => ['manage-content', 'manage_content'],
        'view-content' => ['view-content', 'view_content'],
        'view_content' => ['view-content', 'view_content'],
        'create-content' => ['create-content', 'create_content'],
        'create_content' => ['create-content', 'create_content'],
        'manage-workspace' => ['manage-workspace', 'manage_workspace'],
        'manage_workspace' => ['manage-workspace', 'manage_workspace'],
    ];

    private const CANONICAL_SLUGS = [
        'view-content' => self::VIEW_CONTENT_SLUG,
        'view_content' => self::VIEW_CONTENT_SLUG,
        self::VIEW_CONTENT => self::VIEW_CONTENT_SLUG,
        self::VIEW_CONTENT_SLUG => self::VIEW_CONTENT_SLUG,
        'create-content' => self::CREATE_CONTENT_SLUG,
        'create_content' => self::CREATE_CONTENT_SLUG,
        self::CREATE_CONTENT => self::CREATE_CONTENT_SLUG,
        self::CREATE_CONTENT_SLUG => self::CREATE_CONTENT_SLUG,
        'manage-content' => self::MANAGE_CONTENT_SLUG,
        'manage_content' => self::MANAGE_CONTENT_SLUG,
        self::MANAGE_CONTENT => self::MANAGE_CONTENT_SLUG,
        self::MANAGE_CONTENT_SLUG => self::MANAGE_CONTENT_SLUG,
        'publish' => self::PUBLISH_CONTENT_SLUG,
        'publish_content' => self::PUBLISH_CONTENT_SLUG,
        'publish-content' => self::PUBLISH_CONTENT_SLUG,
        self::PUBLISH_CONTENT => self::PUBLISH_CONTENT_SLUG,
        self::PUBLISH_CONTENT_SLUG => self::PUBLISH_CONTENT_SLUG,
        'submit_for_approval' => self::SUBMIT_FOR_APPROVAL_SLUG,
        'submit-for-approval' => self::SUBMIT_FOR_APPROVAL_SLUG,
        self::SUBMIT_FOR_APPROVAL => self::SUBMIT_FOR_APPROVAL_SLUG,
        self::SUBMIT_FOR_APPROVAL_SLUG => self::SUBMIT_FOR_APPROVAL_SLUG,
        'manage-workspace' => self::MANAGE_WORKSPACE_SLUG,
        'manage_workspace' => self::MANAGE_WORKSPACE_SLUG,
        self::MANAGE_WORKSPACE => self::MANAGE_WORKSPACE_SLUG,
        self::MANAGE_WORKSPACE_SLUG => self::MANAGE_WORKSPACE_SLUG,
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
     * Return a canonical slug for the given permission identifier.
     */
    public static function canonicalSlug(string $permission): string
    {
        $permission = trim(strtolower($permission));

        if ($permission === '') {
            return '';
        }

        if (isset(self::CANONICAL_SLUGS[$permission])) {
            return self::CANONICAL_SLUGS[$permission];
        }

        $normalized = Str::slug($permission);

        return self::CANONICAL_SLUGS[$normalized] ?? $normalized;
    }

    /**
     * Return all canonical permission slugs known by the system.
     */
    public static function allPermissionSlugs(): array
    {
        return [
            self::VIEW_CONTENT_SLUG,
            self::CREATE_CONTENT_SLUG,
            self::MANAGE_CONTENT_SLUG,
            self::PUBLISH_CONTENT_SLUG,
            self::SUBMIT_FOR_APPROVAL_SLUG,
            self::MANAGE_WORKSPACE_SLUG,
        ];
    }

    /**
     * Return all permission definitions from the database in canonical form.
     */
    public static function getAllPermissionDefinitions(): array
    {
        return self::all()->map(function (self $permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'slug' => self::canonicalSlug($permission->slug),
                'display_name' => $permission->display_name,
                'description' => $permission->description,
            ];
        })->toArray();
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
