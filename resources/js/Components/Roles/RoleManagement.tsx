import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import Select from "@/Components/common/Modern/Select";
import { router } from "@inertiajs/react";
import axios from "axios";
import { Edit2, Shield, User, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { route } from "ziggy-js";

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  permissions: Permission[];
  approval_participant: boolean;
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
}

interface WorkspaceUser {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
  pivot?: {
    role_id: number;
  };
}

interface RoleManagementProps {
  workspace: any;
  users: WorkspaceUser[];
  roles: Role[];
  permissions: Permission[];
  canManageRoles: boolean;
}

export default function RoleManagement({
  workspace,
  users,
  roles,
  permissions,
  canManageRoles,
}: RoleManagementProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPermissions, setExpandedPermissions] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const handleRoleAssignment = async (userId: number, roleId: number) => {
    if (!canManageRoles) {
      toast.error(t("roles.errors.insufficient_permissions"));
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(route("api.v1.workspaces.roles.assign", { idOrSlug: workspace.id }), {
        user_id: userId,
        role_id: roleId,
      });

      toast.success(t("roles.success.assigned"));
      router.reload({ only: ["users"] });
    } catch (error: any) {
      const message = error.response?.data?.message || t("roles.errors.assignment_failed");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions.map((p) => p.id));
    setIsEditModalOpen(true);
  };

  const handleSaveRole = async (roleId: number, permissionIds: number[]) => {
    try {
      setIsLoading(true);
      await axios.put(
        route("api.v1.workspaces.roles.update", {
          idOrSlug: workspace.id,
          role: roleId,
        }),
        {
          permission_ids: permissionIds,
        },
      );

      toast.success(t("roles.success.updated"));
      router.reload({ only: ["roles"] });
      setIsEditModalOpen(false);
      setEditingRole(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      const message = error.response?.data?.message || t("roles.errors.update_failed");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleById = (roleId: number) => {
    return roles.find((r) => r.id === roleId);
  };

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      editor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      viewer: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[roleName.toLowerCase()] || colors.viewer;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
            <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("roles.management.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("roles.management.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-bold text-gray-900 dark:text-white">{role.display_name}</h4>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${getRoleBadgeColor(role.name)}`}
                >
                  {users.filter((u) => u.pivot?.role_id === role.id).length}
                </span>
                {canManageRoles && !role.name.toLowerCase().includes("owner") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    buttonStyle="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditRole(role);
                    }}
                    icon={Edit2}
                    title={t("common.edit")}
                  >
                    {""}
                  </Button>
                )}
              </div>
            </div>

            {role.description && (
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
            )}

            <div
              onClick={() =>
                setExpandedPermissions(expandedPermissions === role.id ? null : role.id)
              }
              className="w-full cursor-pointer text-left"
            >
              {expandedPermissions === role.id && (
                <div className="mt-3 border-t border-gray-200 pt-3 dark:border-neutral-700">
                  <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("roles.permissions")}:
                  </p>
                  <div className="space-y-1">
                    {role.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <UserCheck className="h-3 w-3" />
                        {permission.display_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Users List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-gray-200 p-6 dark:border-neutral-800">
          <h4 className="font-bold text-gray-900 dark:text-white">{t("roles.users_list")}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("roles.users_list_subtitle")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("roles.table.user")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("roles.table.current_role")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("roles.table.permissions")}
                </th>
                {canManageRoles && (
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("roles.table.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {users.map((user) => {
                const userRole = getRoleById(user.pivot?.role_id || 0);
                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.photo_url ? (
                          <img
                            src={user.photo_url}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                            <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {userRole && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getRoleBadgeColor(userRole.name)}`}
                        >
                          {userRole.display_name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {userRole?.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission.id}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
                            title={permission.description}
                          >
                            {permission.display_name}
                          </span>
                        ))}
                        {userRole && userRole.permissions.length > 3 && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
                            +{userRole.permissions.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    {canManageRoles && (
                      <td className="px-6 py-4 text-right">
                        <Select
                          id={`role-select-${user.id}`}
                          options={roles.map((r) => ({
                            value: r.id.toString(),
                            label: r.display_name,
                          }))}
                          value={user.pivot?.role_id?.toString() || ""}
                          onChange={(value) => handleRoleAssignment(user.id, parseInt(value))}
                          size="sm"
                          containerClassName="inline-block w-40"
                          disabled={isLoading}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!canManageRoles && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <UserX className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                {t("roles.insufficient_permissions_title")}
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {t("roles.insufficient_permissions_message")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      <DynamicModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRole(null);
          setSelectedPermissions([]);
        }}
        title={editingRole ? `${t("roles.edit_role")} - ${editingRole.display_name}` : ""}
        size="2xl"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("roles.edit_role_subtitle")}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("roles.select_permissions")}
          </p>

          <div className="grid max-h-[50vh] grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
            {permissions.map((permission) => (
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
                    {permission.display_name}
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
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              buttonStyle="solid"
              size="md"
              onClick={() => editingRole && handleSaveRole(editingRole.id, selectedPermissions)}
              disabled={isLoading || selectedPermissions.length === 0}
              icon={Shield}
            >
              {isLoading ? t("common.saving") : t("common.save_changes")}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </div>
  );
}
