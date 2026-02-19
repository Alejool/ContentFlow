import { Link, router } from "@inertiajs/react";
import {
  ChevronRight,
  ExternalLink,
  Globe,
  Info,
  Lock,
  Settings as SettingsIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import AvatarStack from "@/Components/Workspace/AvatarStack";
import RoleBadge from "@/Components/Workspace/RoleBadge";
import Button from "@/Components/common/Modern/Button";

interface WorkspaceCardProps {
  workspace: any;
  roles: any[];
  currentWorkspaceId: number;
  auth: any;
}

const WorkspaceCard = ({
  workspace,
  roles,
  currentWorkspaceId,
  auth,
}: WorkspaceCardProps) => {
  const { t } = useTranslation();
  const [hoveredWorkspace, setHoveredWorkspace] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const userRole = roles.find((r) => r.id === workspace.pivot.role_id);
  const isActive = currentWorkspaceId === workspace.id;

  const handleSwitch = (workspaceId: number) => {
    if (workspaceId === currentWorkspaceId) return;

    router.post(
      route("workspaces.switch", workspaceId),
      {},
      {
        onSuccess: () => {
          toast.success(t("workspace.switched_successfully"));
        },
      },
    );
  };

  return (
    <div
      className={`group relative bg-gradient-to-br from-white/90 to-white/95 dark:from-black/90 dark:to-black/95 border border-white/70 dark:border-black/70 rounded-lg p-6 transition-all duration-700 ease-in-out hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-600/10 hover:-translate-y-1 ${
        openMenuId === workspace.id ? "z-50 shadow-2xl" : "z-0"
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at top left, var(--tw-gradient-from), var(--tw-gradient-to))`,
        transition: 'background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out',
      }}
      onMouseEnter={() => setHoveredWorkspace(workspace.id)}
      onMouseLeave={() => setHoveredWorkspace(null)}
    >
      {isActive && (
        <div className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {t("workspace.active")}
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div className="relative">
          <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          {userRole?.slug === "owner" && (
            <div className="absolute -top-1 -left-1 h-6 w-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
              <Users className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <RoleBadge role={userRole} />
          {workspace.public ? (
            <div title={t("workspace.tooltips.public")}>
              <Globe className="h-4 w-4 text-gray-400" />
            </div>
          ) : (
            <div title={t("workspace.tooltips.private")}>
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {workspace.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mb-4 line-clamp-2 min-h-[2.5rem]">
          {workspace.description || (
            <span className="italic text-gray-400 dark:text-neutral-600">
              {t("workspace.no_description_italic")}
            </span>
          )}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium">
              {t("workspace.members_count", {
                count: workspace.users?.length || 0,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
            </div>
            <span className="font-medium">
              {t("workspace.projects_count", {
                count: workspace.projects_count || 0,
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-neutral-800">
        <div className="flex-1">
          <AvatarStack users={workspace.users || []} roles={roles} />
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t("workspace.status.current")}
            </div>
          ) : (
            <Button
              onClick={() => handleSwitch(workspace.id)}
              variant="ghost"
              size="sm"
              buttonStyle="outline"
              icon={ChevronRight}
              className="flex items-center gap-2"
            >
              <span>{t("workspace.status.switch")}</span>
            </Button>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(
                  openMenuId === workspace.id ? null : workspace.id,
                );
              }}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                ["owner", "admin"].includes(userRole?.slug)
                  ? "text-gray-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/20 dark:hover:to-primary-900/10 hover:shadow-sm"
                  : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
              title={
                ["owner", "admin"].includes(userRole?.slug)
                  ? t("workspace.tooltips.manage")
                  : t("workspace.tooltips.view")
              }
            >
              {["owner", "admin"].includes(userRole?.slug) ? (
                <SettingsIcon className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </button>

            {openMenuId === workspace.id && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setOpenMenuId(null)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-2xl z-50 py-2">
                  <Link
                    href={route("workspaces.show", workspace.id)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {t("workspace.status.open")}
                    </span>
                  </Link>
                  {["owner", "admin"].includes(userRole?.slug) && (
                    <>
                      <Link
                        href={route("workspaces.settings", workspace.id)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
                      >
                        <SettingsIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t("workspace.status.settings")}
                        </span>
                      </Link>
                      <Link
                        href={`${route("workspaces.settings", workspace.id)}?tab=members`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t("workspace.status.invite")}
                        </span>
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCard;
