import { Link } from "@inertiajs/react";
import { Check, Plus, Settings, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WorkspaceDropdownProps {
  workspaces: any[];
  current_workspace: any;
  isSidebarOpen: boolean;
  onSwitch: (slug: string) => void;
  hasCurrentWorkspace: boolean;
}

export default function WorkspaceDropdown({
  workspaces,
  current_workspace,
  isSidebarOpen,
  onSwitch,
  hasCurrentWorkspace,
}: WorkspaceDropdownProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`absolute z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in duration-200 ${
        isSidebarOpen
          ? "left-4 right-4 mt-2 slide-in-from-top-2"
          : "left-full top-0 ml-3 w-72 slide-in-from-left-2 origin-top-left"
      }`}
    >
      <div className="p-2 border-b border-gray-100 dark:border-neutral-800">
        <p className="px-3 py-1 text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
          {t("workspace.select_workspace")}
        </p>
        <div className="space-y-1 mt-1">
          {workspaces.map((ws: any) => {
            const memberCount = ws.users_count || 0;
            const userRole = ws.user_role || ws.role?.name;

            return (
              <button
                key={ws.id}
                onClick={() => onSwitch(ws.slug)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors duration-200 ${
                  ws.id === current_workspace.id
                    ? "bg-primary-50 dark:bg-primary-600/10 text-primary-600 dark:text-primary-400"
                    : "text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded flex items-center justify-center font-bold overflow-hidden ${
                    ws.id === current_workspace.id
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400"
                  }`}
                >
                  {ws.white_label_logo_url ? (
                    <img
                      src={ws.white_label_logo_url}
                      alt={ws.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    ws.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="block truncate font-medium">{ws.name}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {memberCount}
                    </span>
                    {userRole && (
                      <span className="px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 capitalize">
                        {userRole}
                      </span>
                    )}
                  </div>
                </div>
                {ws.id === current_workspace.id && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-2 bg-gray-50 dark:bg-neutral-900/50">
        <Link
          href={route("workspaces.index")}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-white transition-all duration-200 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
        >
          <Plus className="h-4 w-4" />
          {t("workspace.manage_workspaces")}
        </Link>
        {hasCurrentWorkspace && (
          <Link
            href={route("workspaces.settings", current_workspace.id)}
            className="mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            {t("workspace.settings")}
          </Link>
        )}
      </div>
    </div>
  );
}
