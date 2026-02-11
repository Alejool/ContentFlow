import {
  Eye,
  PencilLine,
  Shield,
  ShieldAlert,
  User,
  UserStar,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface RolesManagementTabProps {
  roles: any[];
  workspace: any;
  userRole: string;
  canManageWorkspace: boolean;
}

export default function RolesManagementTab({
  roles,
  workspace,
  userRole,
  canManageWorkspace,
}: RolesManagementTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("workspace.roles_management.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {t("workspace.roles_management.description")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {roles.map((role) => {
            const isCurrentRole = userRole === role.slug;
            const memberCount =
              workspace.users?.filter((u: any) => u.pivot?.role_id === role.id)
                .length || 0;

            return (
              <div
                key={role.id}
                className={`border rounded-lg p-5 transition-all duration-300 hover:shadow-lg ${
                  isCurrentRole
                    ? "border-primary-300 dark:border-primary-700 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-neutral-950"
                    : "border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        role.slug === "owner"
                          ? "bg-gradient-to-br from-primary-500 to-primary-600"
                          : role.slug === "admin"
                            ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                            : role.slug === "editor"
                              ? "bg-gradient-to-br from-purple-500 to-pink-500"
                              : role.slug === "member"
                                ? "bg-gradient-to-br from-emerald-500 to-green-500"
                                : "bg-gradient-to-br from-slate-500 to-gray-500"
                      }`}
                    >
                      {role.slug === "owner" ? (
                        <UserStar className="h-5 w-5 text-white" />
                      ) : role.slug === "admin" ? (
                        <Shield className="h-5 w-5 text-white" />
                      ) : role.slug === "editor" ? (
                        <PencilLine className="h-5 w-5 text-white" />
                      ) : role.slug === "viewer" ? (
                        <Eye className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {role.name}
                        {isCurrentRole && (
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold rounded-full">
                            {t("workspace.your_role")}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-neutral-500">
                        {t("workspace.members_count", { count: memberCount })}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 text-xs font-mono rounded">
                    {role.slug}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
                  {role.description || t("workspace.no_description")}
                </p>

                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                    {t("workspace.key_permissions")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.slice(0, 4).map((permission: any) => (
                      <div
                        key={permission.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 shadow-sm"
                        title={permission.description}
                      >
                        {permission.name}
                      </div>
                    ))}
                    {role.permissions && role.permissions.length > 4 && (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400">
                        +{role.permissions.length - 4} {t("workspace.more")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!canManageWorkspace && (
          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-400">
                  {t("workspace.permissions_required")}
                </p>
                <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                  {t("workspace.owner_admin_required")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
