// Roles Management Tab - Updated with delete functionality
import Button from '@/Components/common/Modern/Button';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
  AlertCircle,
  Edit2,
  Eye,
  Info,
  PencilLine,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserStar,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface RolesManagementTabProps {
  roles: any[];
  permissions: any[];
  workspace: any;
  userRole: string;
  canManageWorkspace: boolean;
}

export default function RolesManagementTab({
  roles,
  permissions,
  workspace,
  userRole,
  canManageWorkspace,
}: RolesManagementTabProps) {
  const { t } = useTranslation();
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingRole, setDeletingRole] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Verificar si un rol se puede editar
  const canEditRole = (role: any) => {
    // Los roles protegidos específicos NO se pueden editar
    const PROTECTED_EDIT_SLUGS = ['owner', 'admin', 'editor'];
    return !PROTECTED_EDIT_SLUGS.includes(role.slug);
  };

  // Verificar si un rol se puede eliminar
  const canDeleteRole = (role: any) => {
    // Los roles del sistema NO se pueden eliminar
    if (role.is_system_role) {
      return false;
    }

    // Los roles protegidos específicos NO se pueden eliminar
    const PROTECTED_DELETE_SLUGS = ['owner', 'admin', 'editor'];
    return !PROTECTED_DELETE_SLUGS.includes(role.slug);
  };

  // Verificar si un rol debe mostrar el badge de protegido
  const isProtectedRole = (role: any) => {
    // Mostrar badge para roles del sistema o roles específicos protegidos
    if (role.is_system_role) {
      return true;
    }

    const PROTECTED_ROLE_SLUGS = ['owner', 'admin', 'editor'];
    return PROTECTED_ROLE_SLUGS.includes(role.slug);
  };

  const handleEditRole = (role: any) => {
    // Prevenir edición de roles protegidos
    if (!canEditRole(role)) {
      toast.error(
        t('roles.errors.cannot_edit_protected') || 'No se puede editar este rol protegido',
      );
      return;
    }

    setEditingRole(role);
    setSelectedPermissions(role.permissions?.map((p: any) => p.id) || []);
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = (role: any) => {
    // Prevenir eliminación de roles que no se pueden eliminar
    if (!canDeleteRole(role)) {
      toast.error(
        t('roles.errors.cannot_delete_protected') || 'No se puede eliminar este rol protegido',
      );
      return;
    }

    // Verificar si hay usuarios con este rol
    const memberCount =
      workspace.users?.filter((u: any) => u.pivot?.role_id === role.id).length || 0;
    if (memberCount > 0) {
      toast.error(
        t('roles.errors.role_has_users') ||
          'No se puede eliminar un rol que tiene usuarios asignados',
      );
      return;
    }

    setDeletingRole(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      setIsLoading(true);
      const url = route('api.v1.workspaces.roles.destroy', {
        idOrSlug: workspace.id,
        role: deletingRole.id,
      });
      await axios.delete(url);

      toast.success(t('roles.success.deleted') || 'Rol eliminado exitosamente');
      router.reload({ only: ['roles'] });
      setIsDeleteModalOpen(false);
      setDeletingRole(null);
    } catch (error: any) {
      console.error('Error deleting role:', error);
      const message =
        error.response?.data?.message ||
        t('roles.errors.delete_failed') ||
        'Error al eliminar el rol';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!editingRole) {
      return;
    }

    try {
      setIsLoading(true);
      const url = route('api.v1.workspaces.roles.update', {
        idOrSlug: workspace.id,
        role: editingRole.id,
      });
      const response = await axios.put(url, {
        permission_ids: selectedPermissions,
      });

      toast.success(t('roles.success.updated') || 'Role updated successfully');
      router.reload({ only: ['roles'] });
      setIsEditModalOpen(false);
      setEditingRole(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      console.error('Error updating role:', error);
      console.error('Error response:', error.response);
      const message =
        error.response?.data?.message || t('roles.errors.update_failed') || 'Failed to update role';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="mb-6 flex items-center gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('workspace.roles_management.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {t('workspace.roles_management.description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const isCurrentRole = userRole === role.slug;
            const memberCount =
              workspace.users?.filter((u: any) => u.pivot?.role_id === role.id).length || 0;

            return (
              <div
                key={role.id}
                className={`rounded-lg border p-5 transition-all duration-300 hover:shadow-lg ${
                  isCurrentRole
                    ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-white dark:border-primary-700 dark:from-primary-900/10 dark:to-neutral-950'
                    : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950'
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        role.slug === 'owner'
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                          : role.slug === 'admin'
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                            : role.slug === 'editor'
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                              : role.slug === 'member'
                                ? 'bg-gradient-to-br from-emerald-500 to-green-500'
                                : 'bg-gradient-to-br from-slate-500 to-gray-500'
                      }`}
                    >
                      {role.slug === 'owner' ? (
                        <UserStar className="h-5 w-5 text-white" />
                      ) : role.slug === 'admin' ? (
                        <Shield className="h-5 w-5 text-white" />
                      ) : role.slug === 'editor' ? (
                        <PencilLine className="h-5 w-5 text-white" />
                      ) : role.slug === 'viewer' ? (
                        <Eye className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                        {role.name}
                        {isCurrentRole && (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {t('workspace.your_role')}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-neutral-500">
                        {t('workspace.members_count', { count: memberCount })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {role.slug}
                    </span>
                    {isProtectedRole(role) && (
                      <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Shield className="h-3 w-3" />
                        {t('roles.protected') || 'Protegido'}
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

                <p className="mb-4 text-sm text-gray-600 dark:text-neutral-400">
                  {role.description || t('workspace.no_description')}

                  {/* Información adicional para roles específicos */}
                  {role.slug === 'editor' && (
                    <span className="mt-2 flex items-start gap-2 text-xs font-medium text-primary-600 dark:text-primary-400">
                      <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        {t('roles.editor_publish_info') ||
                          'Al publicar, el contenido se enviará a revisión si no eres Admin. En workspaces con flujo multinivel, debe pasar por todas las etapas de aprobación configuradas.'}
                      </span>
                    </span>
                  )}
                  {role.slug === 'admin' && (
                    <span className="mt-2 flex items-start gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        {t('roles.admin_publish_info') ||
                          'Puede publicar directamente sin revisión y aprobar contenido de otros usuarios.'}
                      </span>
                    </span>
                  )}
                  {role.slug === 'owner' && (
                    <span className="mt-2 flex items-start gap-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        {t('roles.owner_info') ||
                          'Control total del workspace. Este rol no puede ser editado ni eliminado.'}
                      </span>
                    </span>
                  )}
                </p>

                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                    {t('workspace.key_permissions')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.slice(0, 4).map((permission: any) => (
                      <div
                        key={permission.id}
                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300"
                        title={permission.description}
                      >
                        {permission.name}
                      </div>
                    ))}
                    {role.permissions && role.permissions.length > 4 && (
                      <div className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
                        +{role.permissions.length - 4} {t('workspace.more')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!canManageWorkspace && (
          <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-400">
                  {t('workspace.permissions_required')}
                </p>
                <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">
                  {t('workspace.owner_admin_required')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      <DynamicModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRole(null);
          setSelectedPermissions([]);
        }}
        title={editingRole ? `${t('roles.edit_role')} - ${editingRole.name}` : ''}
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
            {permissions.map((permission: any) => (
              <label
                key={permission.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPermissions([...selectedPermissions, permission.id]);
                    } else {
                      setSelectedPermissions(
                        selectedPermissions.filter((id) => id !== permission.id),
                      );
                    }
                  }}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {permission.display_name || permission.name}
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
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingRole(null);
                setSelectedPermissions([]);
              }}
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

      {/* Delete Role Modal */}
      <DynamicModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRole(null);
        }}
        title={t('roles.delete_role') || 'Eliminar Rol'}
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h4 className="mb-1 text-sm font-bold text-red-900 dark:text-red-200">
                {t('roles.delete_confirmation_title') || '¿Estás seguro?'}
              </h4>
              <p className="text-sm text-red-800 dark:text-red-300">
                {t('roles.delete_confirmation_message') ||
                  'Esta acción no se puede deshacer. El rol'}{' '}
                <span className="font-bold">{deletingRole?.name}</span>{' '}
                {t('roles.will_be_deleted') || 'será eliminado permanentemente'}.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-neutral-800">
            <Button
              variant="ghost"
              buttonStyle="outline"
              size="md"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingRole(null);
              }}
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
