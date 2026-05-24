import Button from '@/Components/common/Modern/Button';
import Select from '@/Components/common/Modern/Select';
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
  const isSelf = member.id === authUserId;
  const isOwner = currentRoleSlug === 'owner';

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
        {canManageMembers && !isOwner && !isSelf ? (
          <Select
            id={`role-select-${member.id}`}
            size="sm"
            value={currentRoleId ?? ''}
            onChange={(val) => onRoleChange(member.id, Number(val))}
            options={roleOptions.map((opt) => ({ value: opt.roleId, label: opt.label }))}
            usePortal={false}
          />
        ) : (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600 dark:bg-neutral-700 dark:text-neutral-300">
            {currentRoleSlug || t('workspace.roles.member', { defaultValue: 'Member' })}
          </span>
        )}

        {canManageMembers && !isOwner && !isSelf && (
          <Button
            variant="danger"
            buttonStyle="icon"
            onClick={() => onRemoveMember(member.id)}
            title={t('workspace.remove_member', { defaultValue: 'Remove member' })}
            icon={X}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
