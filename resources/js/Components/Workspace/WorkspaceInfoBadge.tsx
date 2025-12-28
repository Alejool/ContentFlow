import { Link, usePage } from "@inertiajs/react";
import { Users } from "lucide-react";

interface WorkspaceInfoBadgeProps {
    variant?: "compact" | "full";
}

export default function WorkspaceInfoBadge({
    variant = "compact",
}: WorkspaceInfoBadgeProps) {
    const { current_workspace, auth } = usePage().props as any;

    if (!current_workspace) return null;

    const memberCount = current_workspace.users_count || current_workspace.users?.length || 0;
    const currentUser = current_workspace.users?.find(
        (u: any) => u.id === auth.user.id
    );
    const userRole = currentUser?.pivot?.role?.name || currentUser?.role?.name || "Member";

    return (
        <Link
            href={route('workspaces.index')}
            className={`
                group inline-flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300
                bg-white/50 hover:bg-white dark:bg-neutral-800/50 dark:hover:bg-neutral-800 
                border border-gray-200 dark:border-neutral-700
                hover:shadow-lg hover:shadow-primary-600/10 hover:border-primary-500/50
                backdrop-blur-md
            `}
        >
            <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                    {current_workspace.name.charAt(0).toUpperCase()}
                </div>
                {variant === "full" && (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {current_workspace.name}
                    </span>
                )}
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-neutral-700 mx-1" />

            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">{memberCount}</span>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider border border-primary-100 dark:border-primary-800">
                {userRole}
            </span>
        </Link>
    );
}
