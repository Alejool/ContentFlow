import Button from '@/Components/common/Modern/Button';
import Select from '@/Components/common/Modern/Select';
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog';
import InviteMemberModal from '@/Components/Workspace/InviteMemberModal';
import { getRoleStyle } from '@/Constants/RoleConstants';
import { getRoleConfig } from '@/Utils/roleHelpers';
import {
  useRemoveWorkspaceMember,
  useUpdateMemberRole,
  useWorkspaceMembers,
} from '@/Hooks/useWorkspaceMembers';
import { queryKeys } from '@/lib/queryKeys';
import { usePage } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface MembersManagementProps {
  roles?: any[];
  workspace: any;
}

export default function MembersManagement({ roles = [], workspace }: MembersManagementProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const current_workspace = workspace;
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useWorkspaceMembers(current_workspace?.id);
  const updateRole = useUpdateMemberRole(current_workspace?.id);
  const removeMember = useRemoveWorkspaceMember(current_workspace?.id);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<number | null>(null);

  const roleDistribution = members.reduce((acc: any, member: any) => {
    const roleId = member.pivot?.role_id;
    acc[roleId] = (acc[roleId] || 0) + 1;
    return acc;
  }, {});

  const currentUser = members.find((u: any) => Number(u.id) === Number(auth.user.id));
  const userRoleSlug = currentUser?.pivot?.role?.slug || currentUser?.role?.slug || '';
  const canManageMembers =
    ['owner', 'admin'].includes(userRoleSlug) ||
    Number(current_workspace.created_by) === Number(auth.user.id);

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    if (!canManageMembers) return;
    updateRole.mutate(
      { userId, roleId: newRoleId },
      {
        onSuccess: () => toast.success(t('workspace.invite_modal.messages.success')),
        onError: () => toast.error(t('workspace.invite_modal.messages.error')),
      },
    );
  };

  const initiateRemoveMember = (userId: number) => {
    setUserToRemove(userId);
    setIsConfirmDialogOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!canManageMembers || !userToRemove) return;
    removeMember.mutate(userToRemove, {
      onSuccess: () =>
        toast.success(
          t('workspace.messages.member_removed', {
            defaultValue: 'Miembro eliminado correctamente',
          }),
        ),
      onError: () =>
        toast.error(
          t('workspace.messages.member_remove_error', {
            defaultValue: 'Error al eliminar el miembro',
          }),
        ),
      onSettled: () => setUserToRemove(null),
    });
  };

  const stats = [
    {
      label: t('workspace.stats.total_members'),
      value: members.length,
      icon: Users,
      color: 'text-primary-600',
    },
    {
      label: t('workspace.owners'),
      value: roleDistribution[roles.find((r) => r.slug === 'owner')?.id] || 0,
      icon: getRoleStyle('owner').icon,
      color: getRoleStyle('owner').color,
    },
    {
      label: t('workspace.admins'),
      value: roleDistribution[roles.find((r) => r.slug === 'admin')?.id] || 0,
      icon: getRoleStyle('admin').icon,
      color: getRoleStyle('admin').color,
    },
    {
      label: t('workspace.members'),
      value: roleDistribution[roles.find((r) => r.slug === 'member')?.id] || 0,
      icon: getRoleStyle('member').icon,
      color: getRoleStyle('member').color,
    },
  ];

  const roleOptions = roles
    .filter((r) => r.slug !== 'owner')
    .map((r) => {
      const config = getRoleConfig(r.slug);
      const Icon = config.icon;
      return {
        value: r.id,
        label: r.name,
        icon: (
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded ${config.badgeClass} bg-opacity-30`}
          >
            <Icon className={`h-3 w-3 ${config.textColor}`} />
          </span>
        ),
      };
    });

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p className="text-gray-500">{t('workspace.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('workspace.workspace_members')}
          </h3>
          {canManageMembers && (
            <Button onClick={() => setIsInviteModalOpen(true)} size="md" icon={UserPlus}>
              <span className="hidden md:inline">{t('workspace.invite_member')}</span>
              <span className="md:hidden">{t('workspace.invite')}</span>
            </Button>
          )}
        </div>

        <div className="divide-y divide-gray-200 dark:divide-neutral-700">
          {members.map((member: any) => {
            const isMe = Number(member.id) === Number(auth.user.id);
            const isCreator = Number(current_workspace.created_by) === Number(member.id);
            const roleId = member.pivot?.role_id;
            const currentRole = roles.find((r) => r.id === roleId) || {
              name: 'Member',
              slug: 'member',
            };

            return (
              <div
                key={member.id}
                className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700/30 md:flex-row md:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 min-w-[2.5rem] shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-200 dark:border-neutral-600 dark:bg-neutral-700">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 font-bold text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-semibold text-gray-900 dark:text-white">
                      {member.name}
                      {isMe && (
                        <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {t('workspace.you')}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="flex w-full items-center justify-end gap-3 pl-14 md:w-auto md:gap-4 md:pl-0">
                  {isCreator || !canManageMembers ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        getRoleStyle(currentRole.slug ?? 'member').badge
                      }`}
                    >
                      {isCreator ? t('workspace.owners') : currentRole.name}
                    </span>
                  ) : (
                    <div className="w-36 md:w-40">
                      {(() => {
                        const selectedConfig = getRoleConfig(currentRole.slug ?? 'member');
                        const SelectedIcon = selectedConfig.icon;
                        return (
                          <Select
                            id={`role-${member.id}`}
                            options={roleOptions}
                            value={roleId}
                            onChange={(val) => handleRoleChange(member.id, Number(val))}
                            size="md"
                            variant="outlined"
                            containerClassName="m-0"
                            icon={
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded ${selectedConfig.badgeClass} bg-opacity-30`}
                              >
                                <SelectedIcon className={`h-3 w-3 ${selectedConfig.textColor}`} />
                              </span>
                            }
                          />
                        );
                      })()}
                    </div>
                  )}

                  {canManageMembers && !isMe && !isCreator && (
                    <Button
                      onClick={() => initiateRemoveMember(member.id)}
                      buttonStyle="icon"
                      size="xs"
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      title={t('workspace.remove_member')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-500">{t('workspace.activity.empty')}</div>
          )}
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: queryKeys.members.list(current_workspace.id) })
        }
        roles={roles}
        workspace={current_workspace}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleRemoveMember}
        title={t('workspace.remove_member')}
        message={t('workspace.remove_confirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
}
