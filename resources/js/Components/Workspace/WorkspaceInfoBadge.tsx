import { Link, usePage } from "@inertiajs/react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WorkspaceInfoBadgeProps {
  variant?: "compact" | "full";
}

export default function WorkspaceInfoBadge({ variant = "compact" }: WorkspaceInfoBadgeProps) {
  const { t } = useTranslation();
  const { current_workspace, auth } = usePage().props as any;

  // Early return after all hooks
  if (!current_workspace) return null;

  const memberCount = current_workspace.users_count || current_workspace.users?.length || 0;
  const currentUser = current_workspace.users?.find((u: any) => u.id === auth.user.id);
  const userRole = currentUser?.pivot?.role?.name || currentUser?.role?.name || "Member";

  return (
    <Link
      href={route("workspaces.index")}
      className={`group inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-primary-500/60 hover:bg-white hover:shadow-xl hover:shadow-primary-600/15 dark:border-neutral-700/50 dark:bg-neutral-900/95 dark:hover:bg-neutral-900`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110">
          {current_workspace.name.charAt(0).toUpperCase()}
        </div>
        {variant === "full" && (
          <span className="max-w-[100px] truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 sm:max-w-[200px]">
            {current_workspace.name}
          </span>
        )}
      </div>

      <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-neutral-700" />

      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
        <Users className="h-3.5 w-3.5" />
        <span className="whitespace-nowrap font-medium">
          {memberCount}{" "}
          {memberCount === 1
            ? t("workspace.members_one") || "member"
            : t("workspace.members_other") || "members"}
        </span>
      </div>

      <span className="rounded-full border border-primary-200 bg-primary-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/20 dark:text-primary-300">
        {userRole}
      </span>
    </Link>
  );
}
