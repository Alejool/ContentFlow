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
  canManageMembers: boolean;
  onRoleChange: (userId: number, roleId: number) => void;
  onRemoveMember: (userId: number) => void;
}

export default function MemberRow({
  member,
  roleOptions,
  authUserId,
  canManageMembers,
  onRoleChange,
  onRemoveMember,
}: MemberRowProps) {
  const { t } = useTranslation();

  const currentRoleId = member.pivot?.role_id;
  const currentRoleSlug = member.pivot?.role?.slug ?? member.role?.slug ?? '';
  const currentRoleName = member.pivot?.role?.name ?? member.role?.name ?? '';
  const isSelf = member.id === authUserId;
  const isOwner = currentRoleSlug === 'owner';

  // Build options for the system Select — each option gets an icon from roleHelpers
  const selectOptions = roleOptions
    .filter((opt) => opt.slug !== 'owner') // owners cannot be re-assigned via dropdown
    .map((opt) => {
      const config = getRoleConfig(opt.slug);
      const Icon = config.icon;
      return {
        value: opt.roleId,
        label: opt.label,
        icon: <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />,
      };
    });

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
        {/* Owner: always show a rich badge — no selector, no remove */}
        {isOwner ? (
          <RoleBadge
            role={{ slug: currentRoleSlug, name: currentRoleName || 'Owner' }}
            showIcon
            size="md"
          />
        ) : canManageMembers && !isSelf ? (
          <>
            <Select
              id={`role-select-${member.id}`}
              size="sm"
              value={currentRoleId ?? ''}
              onChange={(val) => onRoleChange(member.id, Number(val))}
              options={selectOptions}
              usePortal={false}
            />
            <Button
              variant="danger"
              buttonStyle="icon"
              onClick={() => onRemoveMember(member.id)}
              title={t('workspace.remove_member', { defaultValue: 'Remove member' })}
              icon={X}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          /* Non-owner viewing their own row or no manage permission */
          <RoleBadge
            role={{ slug: currentRoleSlug, name: currentRoleName }}
            showIcon
            size="md"
          />
        )}
      </div>
    </div>
  );
}
