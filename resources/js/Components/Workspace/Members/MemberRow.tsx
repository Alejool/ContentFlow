import Button from '@/Components/common/Modern/Button';
import Select from '@/Components/common/Modern/Select';
import RoleBadge from '@/Components/Workspace/Members/RoleBadge';
import { getRoleConfig } from '@/Utils/Roles/roleHelpers';
import type { MemberRole, RoleOption, WorkspaceMember } from '@/types/Workspace/MembersManagement';
import { UserCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MemberRowProps {
  member: WorkspaceMember;
  roleOptions: RoleOption[];
  roles: MemberRole[];
  currentWorkspace: { id: number | string };
  authUserId: number;
  /** Id of the workspace creator — dual check alongside role slug */
  ownerId?: number | string;
  canManageMembers: boolean;
  onRoleChange: (userId: number, roleId: number) => void;
  onRemoveMember: (userId: number) => void;
}

/**
 * Maps a role slug to its i18n key inside the "workspace" namespace.
 * Falls back to the raw role name from the backend if no mapping is found.
 */
const ROLE_I18N_KEY: Record<string, string> = {
  owner: 'workspace.owners',
  admin: 'workspace.admins',
  editor: 'workspace.editors',
  member: 'workspace.member',
  viewer: 'workspace.viewers',
};

export default function MemberRow({
  member,
  roleOptions,
  authUserId,
  ownerId,
  canManageMembers,
  onRoleChange,
  onRemoveMember,
}: MemberRowProps) {
  const { t } = useTranslation();

  const currentRoleId = member.pivot?.role_id;
  const currentRoleSlug = member.pivot?.role?.slug ?? member.role?.slug ?? '';
  const currentRoleName =
    currentRoleSlug && ROLE_I18N_KEY[currentRoleSlug]
      ? t(ROLE_I18N_KEY[currentRoleSlug], { defaultValue: member.pivot?.role?.name ?? member.role?.name ?? '' })
      : (member.pivot?.role?.name ?? member.role?.name ?? '');

  const isSelf = member.id === authUserId;

  /**
   * A member is the owner if:
   *  1. Their role slug is explicitly 'owner', OR
   *  2. Their id matches workspace.created_by (backend sometimes doesn't
   *     assign an explicit role to the creator)
   */
  const isOwner =
    currentRoleSlug === 'owner' ||
    (ownerId !== undefined && Number(member.id) === Number(ownerId));

  // Owner role object to pass to RoleBadge
  const ownerRoleObj = { slug: 'owner', name: t('workspace.owners', { defaultValue: 'Owner' }) };

  // Build options for the system Select:
  // - Exclude 'owner' slug from the assignable list (cannot downgrade/upgrade via dropdown)
  // - Translate labels via i18n keys
  // - Attach the role icon for each option
  const selectOptions = roleOptions
    .filter((opt) => opt.slug !== 'owner')
    .map((opt) => {
      const config = getRoleConfig(opt.slug);
      const Icon = config.icon;
      const translatedLabel = ROLE_I18N_KEY[opt.slug]
        ? t(ROLE_I18N_KEY[opt.slug], { defaultValue: opt.label })
        : opt.label;
      return {
        value: opt.roleId,
        label: translatedLabel,
        icon: <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />,
      };
    });

  // Determine the icon to show in the Select trigger (the currently selected role icon)
  const selectedRoleConfig = getRoleConfig(currentRoleSlug);
  const SelectedIcon = selectedRoleConfig.icon;
  const triggerIcon = <SelectedIcon className={`h-4 w-4 ${selectedRoleConfig.iconColor}`} />;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      {/* Avatar + name/email */}
      <div className="flex min-w-0 items-center gap-3">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-neutral-700 dark:text-neutral-400">
            <UserCircle className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {member.name}
            {isSelf && (
              <span className="ml-1.5 rounded bg-primary-50 px-1.5 py-0.5 text-xs font-semibold text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                {t('common.you', { defaultValue: 'You' })}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{member.email}</p>
        </div>
      </div>

      {/* Role selector + remove */}
      <div className="flex shrink-0 items-center gap-2">
        {isOwner ? (
          /**
           * Owner: always show the rich badge — no role selector, no remove button.
           * The "You" chip next to the name already communicates it's the current user.
           */
          <RoleBadge role={ownerRoleObj} showIcon size="md" />
        ) : canManageMembers && !isSelf ? (
          <>
            <Select
              id={`role-select-${member.id}`}
              size="sm"
              value={currentRoleId ?? ''}
              onChange={(val) => onRoleChange(member.id, Number(val))}
              options={selectOptions}
              icon={triggerIcon}
              usePortal={true}
              dropdownPosition="auto"
            />
            <Button
              size="md"
              variant="ghost"
              buttonStyle="icon"
              onClick={() => onRemoveMember(member.id)}
              title={t('workspace.remove_member', { defaultValue: 'Remove member' })}
              icon={X}
            >
              {''}
            </Button>
          </>
        ) : (
          /* Non-owner viewing their own row, or user without manage permission */
          <RoleBadge
            role={{
              slug: currentRoleSlug,
              name: currentRoleName,
            }}
            showIcon
            size="md"
          />
        )}
      </div>
    </div>
  );
}
