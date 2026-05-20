import Button from '@/Components/common/Modern/Button';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import {
  canDeleteRole,
  canEditRole,
  getMemberCount,
  isProtectedRole,
} from '@/Components/Workspace/rolesManagement.helpers';
import type {
  Permission,
  Role,
  RolesManagementTabProps,
} from '@/Components/Workspace/rolesManagement.types';
import { getRoleConfig } from '@/Utils/Roles/roleHelpers';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, Edit2, Info, Shield, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function RolesManagementTab({
  roles,
  permissions,
  workspace,
  userRole,
  canManageWorkspace,
}: RolesManagementTabProps) {
  const { t } = useTranslation();

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────
  const handleEditRole = (role: Role) => {
    if (!canEditRole(role)) {
      toast.error(t('roles.errors.cannot_edit_protected'));
      return;
    }
    setEditingRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.id) ?? []);
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (!canDeleteRole(role)) {
      toast.error(t('roles.errors.cannot_delete_protected'));
      return;
    }
    if (getMemberCount(workspace, role.id) > 0) {
      toast.error(t('roles.errors.role_has_users'));
      return;
    }
    setDeletingRole(role);
    setIsDeleteModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRole(null);
    setSelectedPermissions([]);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingRole(null);
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    setIsLoading(true);
    try {
      const url = route('api.v1.workspaces.roles.update', {
        idOrSlug: workspace.id,
        role: editingRole.id,
      });
      await axios.put(url, { permission_ids: selectedPermissions });
      toast.success(t('roles.success.updated'));
      router.reload({ only: ['roles'] });
      closeEditModal();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      toast.error(message ?? t('roles.errors.update_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteRole = async () => {
    if (!deletingRole) return;
    setIsLoading(true);
    try {
      const url = route('api.v1.workspaces.roles.destroy', {
        idOrSlug: workspace.id,
        role: deletingRole.id,
      });
      await axios.delete(url);
      toast.success(t('roles.success.deleted'));
      router.reload({ only: ['roles'] });
      closeDeleteModal();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      toast.error(message ?? t('roles.errors.delete_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (permissionId: number, checked: boolean) => {
    setSelectedPermissions((prev) =>
      checked ? [...prev, permissionId] : prev.filter((id) => id !== permissionId),
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('workspace.roles_management.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-500">
            {t('workspace.roles_management.description')}
          </p>
        </div>

        {/* Roles grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const isCurrentRole = userRole === role.slug;
            const memberCount = getMemberCount(workspace, role.id);
            const config = getRoleConfig(role.slug);
            const RoleIcon = config.icon;

            return (
              <div
                key={role.id}
                className={`rounded-lg border p-5 transition-all duration-300 hover:shadow-lg ${
                  isCurrentRole
                    ? 'border-primary-300 from-primary-50 dark:border-primary-700 dark:from-primary-900/10 bg-gradient-to-br to-white dark:to-neutral-950'
                    : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950'
                }`}
              >
                {/* Role header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient} `}
                    >
                      <RoleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                        {role.name}
                        {isCurrentRole && (
                          <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full px-2 py-0.5 text-xs font-bold">
                            {t('workspace.your_role')}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-neutral-500">
                        {t('workspace.members_count', { count: memberCount })}
                      </p>
                    </div>
                  </div>

                  {/* Badges + actions */}
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-theme-bg-secondary dark:text-neutral-400">
                      {role.slug}
                    </span>
                    {isProtectedRole(role) && (
                      <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Shield className="h-3 w-3" />
                        {t('roles.protected')}
                      </span>
                    )}
                    {canManageWorkspace && (
                      <div className="flex items-center gap-1">
                        {canEditRole(role) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            buttonStyle="icon"
                            onClick={() => handleEditRole(role)}
                            icon={Edit2}
                            title={t('common.edit')}
                          >
                            {''}
                          </Button>
                        )}
                        {canDeleteRole(role) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            buttonStyle="icon"
                            onClick={() => handleDeleteRole(role)}
                            icon={Trash2}
                            title={t('common.delete')}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                          >
                            {''}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description + role-specific info */}
                <p className="mb-4 text-sm text-gray-600 dark:text-neutral-400">
                  {role.description ?? t('workspace.no_description')}

                  {role.slug === 'editor' && (
                    <span className="text-primary-600 dark:text-primary-400 mt-2 flex items-start gap-2 text-xs font-medium">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t('roles.editor_publish_info')}</span>
                    </span>
                  )}
                  {role.slug === 'admin' && (
                    <span className="mt-2 flex items-start gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t('roles.admin_publish_info')}</span>
                    </span>
                  )}
                  {role.slug === 'owner' && (
                    <span className="mt-2 flex items-start gap-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t('roles.owner_info')}</span>
                    </span>
                  )}
                </p>

                {/* Permissions preview */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                    {t('workspace.key_permissions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.slice(0, 4).map((permission) => (
                      <div
                        key={permission.id}
                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm dark:border-neutral-700 dark:bg-theme-bg-secondary dark:text-gray-300"
                        title={permission.description ?? undefined}
                      >
                        {permission.name}
                      </div>
                    ))}
                    {(role.permissions?.length ?? 0) > 4 && (
                      <div className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-theme-bg-secondary dark:text-neutral-400">
                        +{(role.permissions?.length ?? 0) - 4} {t('workspace.more')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No-permission notice */}
        {!canManageWorkspace && (
          <div className="border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 mt-6 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-primary-500 mt-0.5 h-5 w-5" />
              <div>
                <p className="text-primary-800 dark:text-primary-400 text-sm font-medium">
                  {t('workspace.permissions_required')}
                </p>
                <p className="text-primary-700 dark:text-primary-300 mt-1 text-sm">
                  {t('workspace.owner_admin_required')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Role Modal ───────────────────────────────────── */}
      <DynamicModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={editingRole ? `${t('roles.edit_role')} — ${editingRole.name}` : ''}
        size="2xl"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('roles.edit_role_subtitle')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('roles.select_permissions')}
          </p>

          <div className="grid max-h-[50vh] grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
            {permissions.map((permission: Permission) => (
              <label
                key={permission.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={(e) => togglePermission(permission.id, e.target.checked)}
                  className="text-primary-600 focus:ring-primary-500 mt-0.5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {permission.display_name ?? permission.name}
                  </p>
                  {permission.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {permission.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-neutral-800">
            <Button
              variant="ghost"
              buttonStyle="outline"
              size="md"
              onClick={closeEditModal}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              buttonStyle="solid"
              size="md"
              onClick={handleSaveRole}
              disabled={isLoading || selectedPermissions.length === 0}
              icon={Shield}
            >
              {isLoading ? t('common.saving') : t('common.save_changes')}
            </Button>
          </div>
        </div>
      </DynamicModal>

      {/* ── Delete Role Modal ─────────────────────────────────── */}
      <DynamicModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title={t('roles.delete_role')}
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h4 className="mb-1 text-sm font-bold text-red-900 dark:text-red-200">
                {t('roles.delete_confirmation_title')}
              </h4>
              <p className="text-sm text-red-800 dark:text-red-300">
                {t('roles.delete_confirmation_message')}{' '}
                <span className="font-bold">{deletingRole?.name}</span> {t('roles.will_be_deleted')}
                .
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-neutral-800">
            <Button
              variant="ghost"
              buttonStyle="outline"
              size="md"
              onClick={closeDeleteModal}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              buttonStyle="solid"
              size="md"
              onClick={confirmDeleteRole}
              disabled={isLoading}
              icon={Trash2}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? t('common.deleting') : t('common.delete')}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </div>
  );
}
