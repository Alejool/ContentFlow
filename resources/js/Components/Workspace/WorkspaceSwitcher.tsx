import { usePage, useForm, Link } from "@inertiajs/react";
import { ChevronDown, Plus, Settings, Users, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function WorkspaceSwitcher({ isSidebarOpen }: { isSidebarOpen: boolean }) {
    const { t } = useTranslation();
    const { auth, workspaces, current_workspace } = usePage().props as any;
    const [isOpen, setIsOpen] = useState(false);
    const { post } = useForm();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSwitch = (workspaceId: number) => {
        post(route('workspaces.switch', workspaceId), {
            onSuccess: () => setIsOpen(false),
        });
    };

    if (!current_workspace) return null;

    return (
        <div className="relative px-4 mb-4" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center gap-3 p-3 rounded-xl
                    transition-all duration-300 group
                    ${isOpen ? 'bg-primary-600 shadow-lg scale-[1.02]' : 'hover:bg-gray-100 dark:hover:bg-neutral-800/50'}
                `}
            >
                <div className={`
                    h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg
                    transition-all duration-300
                    ${isOpen ? 'bg-white text-primary-600' : 'bg-primary-600 text-white shadow-md group-hover:scale-110'}
                `}>
                    {current_workspace.name.charAt(0).toUpperCase()}
                </div>

                {isSidebarOpen && (
                    <>
                        <div className="flex-1 text-left min-w-0">
                            <p className={`text-sm font-semibold truncate ${isOpen ? 'text-white' : 'text-gray-700 dark:text-neutral-200'}`}>
                                {current_workspace.name}
                            </p>
                            <p className={`text-xs truncate ${isOpen ? 'text-primary-100' : 'text-gray-500 dark:text-neutral-400'}`}>
                                {workspaces.length} {t('workspace.workspaces', { count: workspaces.length })}
                            </p>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-gray-400 dark:text-neutral-400'}`} />
                    </>
                )}

                {!isSidebarOpen && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 translate-x-1 group-hover:translate-x-0">
                        {current_workspace.name}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-neutral-800 rotate-45" />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className={`
                    absolute left-4 right-4 mt-2 z-50
                    bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl
                    overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200
                `}>
                    <div className="p-2 border-b border-gray-100 dark:border-neutral-800">
                        <p className="px-3 py-1 text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
                            {t('workspace.select_workspace')}
                        </p>
                        <div className="space-y-1 mt-1">
                            {workspaces.map((ws: any) => {
                                const memberCount = ws.users_count || ws.users?.length || 0;
                                const currentUserInWs = ws.users?.find((u: any) => u.id === auth.user.id);
                                const userRole = currentUserInWs?.pivot?.role?.name || currentUserInWs?.role?.name;

                                return (
                                    <button
                                        key={ws.id}
                                        onClick={() => handleSwitch(ws.id)}
                                        className={`
                                            w-full flex items-center gap-3 p-2 rounded-lg text-sm
                                            transition-colors duration-200
                                            ${ws.id === current_workspace.id
                                                ? 'bg-primary-50 dark:bg-primary-600/10 text-primary-600 dark:text-primary-400'
                                                : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            h-8 w-8 rounded flex items-center justify-center font-bold
                                            ${ws.id === current_workspace.id ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'}
                                        `}>
                                            {ws.name.charAt(0).toUpperCase()}
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
                                        {ws.id === current_workspace.id && <Check className="h-4 w-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-2 bg-gray-50 dark:bg-neutral-900/50">
                        <Link
                            href={route('workspaces.index')}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-white transition-all duration-200 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
                        >
                            <Plus className="h-4 w-4" />
                            {t('workspace.manage_workspaces')}
                        </Link>
                        {auth.user.current_workspace_id && (
                            <Link
                                href={route('workspaces.settings', current_workspace.id)}
                                className="mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <Settings className="h-4 w-4" />
                                {t('workspace.settings')}
                            </Link>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
}
