import { AbilityBuilder, createMongoAbility, type MongoAbility, type MongoQuery } from '@casl/ability';
import { PERMISSION_SLUGS, type PermissionSlug } from '@/Constants/permissions';

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

export type AppAbility = MongoAbility<[Actions, Subjects], MongoQuery<Record<string, any>>>;

export type AuthUser = {
  id?: string | number;
};

export type AuthWorkspace = {
  user_role_slug?: string;
  permissions?: Array<PermissionSlug | string>;
};

export type AbilityCan = AbilityBuilder<AppAbility>['can'];

const grantOwnerAbilities = (can: AbilityCan): void => {
  // Owner tiene acceso total sobre el sistema.
  // En CASL, esto se representa con manage + all.
  can('manage', 'all');
};

const grantAdminAbilities = (can: AbilityCan): void => {
  can('read', 'Publication');
  can('create', 'Publication');
  can('update', 'Publication');
  can('delete', 'Publication');
  can('approve', 'ApprovalRequest');
  can('reject', 'ApprovalRequest');
  can('publish', 'Publication');
  can('submit_for_approval', 'Publication');
  can('manage', 'Campaign');
  can('manage', 'MediaFile');
};

const grantPermissionRules = (can: AbilityCan, permissions: PermissionSlug[], user: AuthUser): void => {
  if (permissions.includes(PERMISSION_SLUGS.manageContent)) {
    can('read', 'Publication');
    can('create', 'Publication');

    if (user.id !== undefined) {
      const canWithConditions = can as unknown as (
        action: Actions,
        subject: Subjects,
        conditions?: Record<string, any>,
      ) => void;

      canWithConditions('update', 'Publication', {
        user_id: { $eq: user.id },
      });
    }

    can('submit_for_approval', 'Publication');
    can('read', 'Campaign');
    can('read', 'MediaFile');
  }

  if (permissions.includes(PERMISSION_SLUGS.approve)) {
    can('approve', 'ApprovalRequest');
    can('reject', 'ApprovalRequest');
  }

  if (permissions.includes(PERMISSION_SLUGS.publishContent)) {
    can('publish', 'Publication');
    can('submit_for_approval', 'Publication');
  }

  if (permissions.includes(PERMISSION_SLUGS.submitForApproval)) {
    can('submit_for_approval', 'Publication');
  }

  if (permissions.includes(PERMISSION_SLUGS.viewContent)) {
    can('read', 'Publication');
    can('read', 'Campaign');
    can('read', 'MediaFile');
  }
};

/**
 * Define abilities for a user based on their role and permissions.
 *
 * `can('manage', 'all')` se usa solo cuando el usuario debe tener acceso total.
 * Para permisos específicos, se deben mapear a acciones y sujetos concretos.
 */
export function defineAbilityFor(user: AuthUser, workspace: AuthWorkspace): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const userRole = workspace.user_role_slug;
  const permissions: PermissionSlug[] = Array.isArray(workspace.permissions)
    ? workspace.permissions.filter((permission): permission is PermissionSlug => typeof permission === 'string')
    : [];

  if (userRole === 'owner') {
    grantOwnerAbilities(can);
    return build();
  }

  if (userRole === 'admin') {
    grantAdminAbilities(can);
  }

  grantPermissionRules(can, permissions, user);

  return build();
}

/**
 * Check if user can perform an action on a subject.
 */
export function checkAbility(
  ability: AppAbility,
  action: Actions,
  subject: Subjects,
  field?: string,
): boolean {
  return ability.can(action, subject, field);
}
