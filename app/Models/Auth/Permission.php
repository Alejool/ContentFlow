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

    private const PERMISSION_DEFINITIONS = [
        self::VIEW_CONTENT_SLUG => [
            'slug' => self::VIEW_CONTENT_SLUG,
            'label' => 'Ver contenido',
            'description' => 'Permite leer publicaciones, campañas y métricas del workspace sin editarlas.',
            'category' => 'content',
        ],
        self::CREATE_CONTENT_SLUG => [
            'slug' => self::CREATE_CONTENT_SLUG,
            'label' => 'Crear contenido',
            'description' => 'Permite crear publicaciones, borradores y campañas nuevas.',
            'category' => 'content',
        ],
        self::MANAGE_CONTENT_SLUG => [
            'slug' => self::MANAGE_CONTENT_SLUG,
            'label' => 'Gestionar contenido',
            'description' => 'Permite editar y eliminar publicaciones existentes, así como administrar borradores.',
            'category' => 'content',
        ],
        self::PUBLISH_CONTENT_SLUG => [
            'slug' => self::PUBLISH_CONTENT_SLUG,
            'label' => 'Publicar contenido',
            'description' => 'Permite enviar contenido al flujo de publicación o directamente a plataformas según el workflow.',
            'category' => 'approval',
        ],
        self::SUBMIT_FOR_APPROVAL_SLUG => [
            'slug' => self::SUBMIT_FOR_APPROVAL_SLUG,
            'label' => 'Enviar a aprobación',
            'description' => 'Permite enviar contenido al proceso de aprobación cuando se usa workflow.',
            'category' => 'approval',
        ],
        'approve' => [
            'slug' => 'approve',
            'label' => 'Aprobar contenido',
            'description' => 'Permite aprobar publicaciones para que continúen en el proceso de publicación.',
            'category' => 'approval',
        ],
        'reject' => [
            'slug' => 'reject',
            'label' => 'Rechazar contenido',
            'description' => 'Permite rechazar publicaciones y devolverlas para corrección.',
            'category' => 'approval',
        ],
        'view-analytics' => [
            'slug' => 'view-analytics',
            'label' => 'Ver analíticas',
            'description' => 'Permite ver métricas del workspace, campañas y publicaciones.',
            'category' => 'analytics',
        ],
        'manage-accounts' => [
            'slug' => 'manage-accounts',
            'label' => 'Gestionar cuentas',
            'description' => 'Permite conectar, editar y eliminar cuentas sociales del workspace.',
            'category' => 'workspace',
        ],
        'manage-team' => [
            'slug' => 'manage-team',
            'label' => 'Gestionar equipo',
            'description' => 'Permite invitar, eliminar o cambiar roles del equipo del workspace.',
            'category' => 'team',
        ],
        'manage-campaigns' => [
            'slug' => 'manage-campaigns',
            'label' => 'Gestionar campañas',
            'description' => 'Permite crear, editar y eliminar campañas dentro del workspace.',
            'category' => 'campaigns',
        ],
        self::MANAGE_WORKSPACE_SLUG => [
            'slug' => self::MANAGE_WORKSPACE_SLUG,
            'label' => 'Gestionar workspace',
            'description' => 'Permite cambiar configuraciones del workspace y tareas administrativas generales.',
            'category' => 'workspace',
        ],
    ];

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
        return array_keys(self::PERMISSION_DEFINITIONS);
    }

    /**
     * Return static permission definitions for backend validation and role generation.
     */
    public static function permissionDefinitions(): array
    {
        return self::PERMISSION_DEFINITIONS;
    }

    public static function getPermissionDefinition(string $slug): ?array
    {
        $slug = self::canonicalSlug($slug);

        return self::PERMISSION_DEFINITIONS[$slug] ?? null;
    }

    public static function isValidPermissionSlug(string $slug): bool
    {
        return isset(self::PERMISSION_DEFINITIONS[self::canonicalSlug($slug)]);
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
