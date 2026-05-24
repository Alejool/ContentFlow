export type PermissionCategory =
  | 'content'
  | 'approval'
  | 'workspace'
  | 'analytics'
  | 'team'
  | 'campaigns';

export type PermissionDefinition = {
  slug: string;
  label: string;
  description: string;
  category: PermissionCategory;
};

export const PERMISSION_DEFINITIONS = {
  viewContent: {
    slug: 'view-content' as const,
    label: 'Ver contenido' as const,
    description: 'Permite leer publicaciones, campañas y métricas del workspace sin editarlas.',
    category: 'content',
  },
  createContent: {
    slug: 'create-content',
    label: 'Crear contenido',
    description: 'Permite crear publicaciones, borradores y campañas nuevas.',
    category: 'content',
  },
  manageContent: {
    slug: 'manage-content',
    label: 'Gestionar contenido',
    description: 'Permite editar y eliminar publicaciones existentes, así como administrar borradores.',
    category: 'content',
  },
  publishContent: {
    slug: 'publish',
    label: 'Publicar contenido',
    description: 'Permite enviar contenido al flujo de publicación o directamente a plataformas según el workflow.',
    category: 'approval',
  },
  approve: {
    slug: 'approve',
    label: 'Aprobar contenido',
    description: 'Permite aprobar publicaciones para que continúen en el proceso de publicación.',
    category: 'approval',
  },
  reject: {
    slug: 'reject',
    label: 'Rechazar contenido',
    description: 'Permite rechazar publicaciones y devolverlas para corrección.',
    category: 'approval',
  },
  submitForApproval: {
    slug: 'submit-for-approval',
    label: 'Enviar a aprobación',
    description: 'Permite enviar contenido al proceso de aprobación cuando se usa workflow.',
    category: 'approval',
  },
  viewAnalytics: {
    slug: 'view-analytics',
    label: 'Ver analíticas',
    description: 'Permite ver métricas del workspace, campañas y publicaciones.',
    category: 'analytics',
  },
  manageAccounts: {
    slug: 'manage-accounts',
    label: 'Gestionar cuentas',
    description: 'Permite conectar, editar y eliminar cuentas sociales del workspace.',
    category: 'workspace',
  },
  manageTeam: {
    slug: 'manage-team',
    label: 'Gestionar equipo',
    description: 'Permite invitar, eliminar o cambiar roles del equipo en el workspace.',
    category: 'team',
  },
  manageCampaigns: {
    slug: 'manage-campaigns',
    label: 'Gestionar campañas',
    description: 'Permite crear, editar y eliminar campañas dentro del workspace.',
    category: 'campaigns',
  },
  manageWorkspace: {
    slug: 'manage-workspace' as const,
    label: 'Gestionar workspace' as const,
    description: 'Permite cambiar configuraciones del workspace y tareas administrativas generales.' as const,
    category: 'workspace' as const,
  },
} as const;

export const PERMISSION_SLUGS = Object.fromEntries(
  Object.entries(PERMISSION_DEFINITIONS).map(([key, value]) => [key, value.slug]),
) as { [K in keyof typeof PERMISSION_DEFINITIONS]: typeof PERMISSION_DEFINITIONS[K]['slug'] };

export const PERMISSIONS_BY_SLUG = Object.fromEntries(
  Object.values(PERMISSION_DEFINITIONS).map((permission) => [permission.slug, permission]),
) as Record<string, PermissionDefinition>;

export const ALL_PERMISSION_SLUGS = Object.values(PERMISSION_SLUGS) as Array<
  (typeof PERMISSION_SLUGS)[keyof typeof PERMISSION_SLUGS]
>;

export const PERMISSION_LABELS = Object.fromEntries(
  Object.values(PERMISSION_DEFINITIONS).map((permission) => [permission.slug, permission.label]),
) as Record<string, string>;

export const PERMISSION_DESCRIPTIONS = Object.fromEntries(
  Object.values(PERMISSION_DEFINITIONS).map((permission) => [permission.slug, permission.description]),
) as Record<string, string>;

export type PermissionSlug = (typeof PERMISSION_SLUGS)[keyof typeof PERMISSION_SLUGS];
