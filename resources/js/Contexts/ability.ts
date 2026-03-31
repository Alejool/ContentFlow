import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'publish'
  | 'approve'
  | 'reject'
  | 'submit_for_approval'
  | 'manage';

export type Subjects = 'Publication' | 'ApprovalRequest' | 'Campaign' | 'MediaFile' | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Define abilities for a user based on their role and permissions
 *
 * @param user - The authenticated user
 * @param workspace - The current workspace with user's role and permissions
 * @returns AppAbility - The ability instance
 */
export function defineAbilityFor(user: any, workspace: any): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const userRole = workspace?.user_role_slug;
  const permissions = workspace?.permissions || [];

  // Owner can do everything - explicit permissions for better CASL compatibility
  if (userRole === 'owner') {
    can('manage', 'all');
    can('approve', 'ApprovalRequest');
    can('reject', 'ApprovalRequest');
    can('publish', 'Publication');
    can('submit_for_approval', 'Publication');
    return build();
  }

  // Admin permissions
  if (userRole === 'admin') {
    can('read', 'Publication');
    can('create', 'Publication');
    can('update', 'Publication');
    can('delete', 'Publication');
    can('approve', 'ApprovalRequest');
    can('reject', 'ApprovalRequest');
    can('publish', 'Publication'); // Puede publicar solo si no hay workflow o si está aprobado
    can('submit_for_approval', 'Publication'); // Puede enviar a revisión cuando hay workflow
    can('manage', 'Campaign');
    can('manage', 'MediaFile');
  }

  // Editor permissions
  if (permissions.includes('manage-content')) {
    can('read', 'Publication');
    can('create', 'Publication');
    can('update', 'Publication', { user_id: user.id }); // Own content only
    // REMOVED: submit_for_approval - solo usuarios con permiso "publish" pueden enviar a revisión
    can('read', 'Campaign');
    can('read', 'MediaFile');
  }

  // Approve permission (explicit approve permission)
  if (permissions.includes('approve')) {
    can('approve', 'ApprovalRequest');
    can('reject', 'ApprovalRequest');
  }

  // Publish permission (Publisher role)
  // CRÍTICO: Solo usuarios con permiso "publish" pueden enviar a revisión
  if (permissions.includes('publish')) {
    can('publish', 'Publication'); // Puede publicar solo si no hay workflow o si está aprobado
    can('submit_for_approval', 'Publication'); // SOLO usuarios con "publish" pueden enviar a revisión
  }

  // Viewer permissions
  if (permissions.includes('view-content')) {
    can('read', 'Publication');
    can('read', 'Campaign');
    can('read', 'MediaFile');
  }

  return build();
}

/**
 * Check if user can perform an action on a subject
 *
 * @param ability - The ability instance
 * @param action - The action to check
 * @param subject - The subject to check
 * @param field - Optional field to check
 * @returns boolean
 */
export function checkAbility(
  ability: AppAbility,
  action: Actions,
  subject: Subjects,
  field?: string,
): boolean {
  return ability.can(action, subject, field);
}
