import { Menu, MenuButton, MenuItems } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Plus, Settings, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WorkspaceLogo } from './WorkspaceLogo';

interface WorkspaceDropdownProps {
  workspaces: any[];
  current_workspace: any;
  isSidebarOpen: boolean;
  onSwitch: (slug: string) => void;
  hasCurrentWorkspace: boolean;
  /** Role label shown in the trigger button */
  roleLabel?: string;
}

export default function WorkspaceDropdown({
  workspaces,
  current_workspace,
  isSidebarOpen,
  onSwitch,
  hasCurrentWorkspace,
  roleLabel,
}: WorkspaceDropdownProps) {
  const { t } = useTranslation();

  return (
    <Menu as="div" className="z-5 relative px-4 py-2">
      {({ open }) => (
        <>
          {/* Trigger button */}
          <MenuButton
            className={`group flex w-full items-center justify-center gap-3 rounded-lg p-3 transition-all duration-300 focus:outline-none ${open ? 'scale-[1.02] bg-primary-600 shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-neutral-800/50'} `}
          >
            <div
              className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg text-lg font-bold transition-all duration-300 ${open ? 'bg-white text-primary-600' : 'bg-primary-600 text-white shadow-md group-hover:scale-110'} `}
            >
              {current_workspace?.white_label_logo_url ? (
                <WorkspaceLogo
                  src={current_workspace.white_label_logo_url}
                  alt={current_workspace.name}
                  fallback={current_workspace.name}
                />
              ) : (
                current_workspace.name.charAt(0).toUpperCase()
              )}
            </div>

            {isSidebarOpen && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p
                    className={`truncate text-sm font-semibold ${open ? 'text-white' : 'text-gray-700 dark:text-neutral-200'}`}
                  >
                    {current_workspace.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${open ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'}`}
                    >
                      {roleLabel || t('workspace.member')}
                    </p>
                    <span
                      className={`h-1 w-1 rounded-full ${open ? 'bg-primary-200' : 'bg-gray-300 dark:bg-neutral-600'}`}
                    />
                    <p
                      className={`truncate text-[10px] ${open ? 'text-primary-100' : 'text-gray-500 dark:text-neutral-400'}`}
                    >
                      {workspaces.length} {t('workspace.workspaces', { count: workspaces.length })}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180 text-white' : 'text-gray-400 dark:text-neutral-400'}`}
                />
              </>
            )}

            {!isSidebarOpen && (
              <div className="pointer-events-none absolute left-full z-50 ml-3 translate-x-1 whitespace-nowrap rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-neutral-800">
                {current_workspace.name}
                <div className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1 -translate-y-1/2 rotate-45 transform bg-gray-900 dark:bg-neutral-800" />
              </div>
            )}
          </MenuButton>

          {/* Dropdown panel */}
          <AnimatePresence>
            {open && (
              <MenuItems
                static
                as={motion.div}
                variants={{
                  hidden: { opacity: 0, scale: 0.96, y: -6 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { duration: 0.15, ease: 'easeOut' },
                  },
                  exit: {
                    opacity: 0,
                    scale: 0.96,
                    y: -6,
                    transition: { duration: 0.1, ease: 'easeIn' },
                  },
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`absolute z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 ${
                  isSidebarOpen
                    ? 'left-4 right-4 mt-2 origin-top'
                    : 'left-full top-0 ml-3 w-72 origin-top-left'
                }`}
              >
                {/* Workspace list */}
                <div className="border-b border-gray-100 p-2 dark:border-neutral-800">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                    {t('workspace.select_workspace')}
                  </p>
                  <div className="mt-1 space-y-1">
                    {workspaces.map((ws: any) => {
                      const memberCount = ws.users_count || 0;
                      const userRole = ws.user_role || ws.role?.name;

                      return (
                        <button
                          key={ws.id}
                          onClick={() => onSwitch(ws.slug)}
                          className={`flex w-full items-center gap-3 rounded-lg p-2 text-sm transition-colors duration-200 ${
                            ws.id === current_workspace.id
                              ? 'bg-primary-50 text-primary-600 dark:bg-primary-600/10 dark:text-primary-400'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div
                            className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded font-bold ${
                              ws.id === current_workspace.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {ws.white_label_logo_url ? (
                              <WorkspaceLogo src={ws.white_label_logo_url} alt={ws.name} />
                            ) : (
                              ws.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <span className="block truncate font-medium">{ws.name}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {memberCount}
                              </span>
                              {userRole && (
                                <span className="rounded bg-primary-100 px-1.5 py-0.5 capitalize text-primary-600 dark:bg-primary-600/20 dark:text-primary-400">
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

                {/* Footer actions */}
                <div className="bg-gray-50 p-2 dark:bg-neutral-900/50">
                  <Link
                    href={route('workspaces.index')}
                    className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-200 hover:bg-white hover:text-primary-600 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    {t('workspace.manage_workspaces')}
                  </Link>
                  {hasCurrentWorkspace && (
                    <Link
                      href={route('workspaces.settings', current_workspace.id)}
                      className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-neutral-500 dark:hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      {t('workspace.settings')}
                    </Link>
                  )}
                </div>
              </MenuItems>
            )}
          </AnimatePresence>
        </>
      )}
    </Menu>
  );
}
