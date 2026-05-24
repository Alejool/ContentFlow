import InviteMemberModal from '@/Components/Workspace/Members/InviteMemberModal';
import Button from '@/Components/common/Modern/Button';
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog';
import { queryKeys } from '@/lib/common/queryKeys';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import { useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMembersManagement } from '@/Hooks/Workspace/useMembersManagement';
import MemberRow from '@/Components/Workspace/Members/MemberRow';
import MembersManagementStats from '@/Components/Workspace/Members/MembersManagementStats';
import type { MembersManagementProps } from '@/types/Workspace/MembersManagement';

type MembersManagementPageProps = PageProps & {
  auth: {
    user: {
      id: number | string;
    };
  };
};

export default function MembersManagement({ roles = [], workspace, canManageMembers = false }: MembersManagementProps) {
  const { t } = useTranslation();
  const { auth } = usePage<MembersManagementPageProps>().props;
  const queryClient = useQueryClient();

  const {
    members,
    isLoading,
    roleOptions,
    stats,
    handleRoleChange,
    currentWorkspace,
    removeMemberMutation,
  } = useMembersManagement(workspace, roles, canManageMembers);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<number | null>(null);

  const initiateRemoveMember = (userId: number) => {
    setUserToRemove(userId);
    setIsConfirmDialogOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!canManageMembers || !userToRemove) {
      return;
    }

    removeMemberMutation.mutate(userToRemove, {
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

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="border-primary-600 mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-gray-500">{t('workspace.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MembersManagementStats stats={stats} />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-theme-bg-secondary">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 p-4 dark:border-neutral-700 dark:bg-theme-bg-secondary">
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
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              roleOptions={roleOptions}
              roles={roles}
              currentWorkspace={currentWorkspace}
              authUserId={Number(auth.user.id)}
              canManageMembers={canManageMembers}
              onRoleChange={handleRoleChange}
              onRemoveMember={initiateRemoveMember}
            />
          ))}

          {members.length === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-500">{t('workspace.activity.empty')}</div>
          )}
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: queryKeys.members.list(currentWorkspace.id) })
        }
        roles={roles}
        workspace={currentWorkspace}
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
