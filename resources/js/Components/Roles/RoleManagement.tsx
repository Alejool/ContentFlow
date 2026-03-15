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
  const [expandedPermissions, setExpandedPermissions] = useState<number | null>(
    null,
  );
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
      await axios.post(
        route("api.v1.workspaces.roles.assign", { idOrSlug: workspace.id }),
        {
          user_id: userId,
          role_id: roleId,
        },
      );

      toast.success(t("roles.success.assigned"));
      router.reload({ only: ["users"] });
    } catch (error: any) {
      const message =
        error.response?.data?.message || t("roles.errors.assignment_failed");
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
      const message =
        error.response?.data?.message || t("roles.errors.update_failed");
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
      owner:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      editor:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      viewer:
        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[roleName.toLowerCase()] || colors.viewer;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900 dark:text-white">
                {role.display_name}
              </h4>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(role.name)}`}
                >
                  {users.filter((u) => u.pivot?.role_id === role.id).length}
                </span>
                {canManageRoles &&
                  !role.name.toLowerCase().includes("owner") && (
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {role.description}
              </p>
            )}

            <div
              onClick={() =>
                setExpandedPermissions(
                  expandedPermissions === role.id ? null : role.id,
                )
              }
              className="w-full text-left cursor-pointer"
            >
              {expandedPermissions === role.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-700">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("roles.permissions")}:
                  </p>
                  <div className="space-y-1">
                    {role.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
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
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
          <h4 className="font-bold text-gray-900 dark:text-white">
            {t("roles.users_list")}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("roles.users_list_subtitle")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-800/50 border-b border-gray-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("roles.table.user")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("roles.table.current_role")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("roles.table.permissions")}
                </th>
                {canManageRoles && (
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                    className="hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.photo_url ? (
                          <img
                            src={user.photo_url}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {userRole && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(userRole.name)}`}
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
                            className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                            title={permission.description}
                          >
                            {permission.display_name}
                          </span>
                        ))}
                        {userRole && userRole.permissions.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs rounded">
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
                          onChange={(value) =>
                            handleRoleAssignment(user.id, parseInt(value))
                          }
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <UserX className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                {t("roles.insufficient_permissions_title")}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
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
        title={
          editingRole
            ? `${t("roles.edit_role")} - ${editingRole.display_name}`
            : ""
        }
        size="2xl"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("roles.edit_role_subtitle")}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("roles.select_permissions")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-start gap-3 p-3 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPermissions([
                        ...selectedPermissions,
                        permission.id,
                      ]);
                    } else {
                      setSelectedPermissions(
                        selectedPermissions.filter(
                          (id) => id !== permission.id,
                        ),
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {permission.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
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
              onClick={() =>
                editingRole &&
                handleSaveRole(editingRole.id, selectedPermissions)
              }
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
