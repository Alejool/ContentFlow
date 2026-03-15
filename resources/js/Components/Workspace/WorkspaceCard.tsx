import { Link, router } from '@inertiajs/react';
import {
  ChevronRight,
  ExternalLink,
  Globe,
  Info,
  Lock,
  Settings as SettingsIcon,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import AvatarStack from '@/Components/Workspace/AvatarStack';
import RoleBadge from '@/Components/Workspace/RoleBadge';
import Button from '@/Components/common/Modern/Button';

interface WorkspaceCardProps {
  workspace: any;
  roles: any[];
  currentWorkspaceId: number;
  auth: any;
}

const WorkspaceCard = ({ workspace, roles, currentWorkspaceId, auth }: WorkspaceCardProps) => {
  const { t } = useTranslation();
  const [hoveredWorkspace, setHoveredWorkspace] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const userRole = roles.find((r) => r.id === workspace.pivot.role_id);
  const isActive = currentWorkspaceId === workspace.id;

  const handleSwitch = (workspaceId: number) => {
    if (workspaceId === currentWorkspaceId) return;

    router.post(
      route('workspaces.switch', workspaceId),
      {},
      {
        onSuccess: () => {
          toast.success(t('workspace.switched_successfully'));
        },
      },
    );
  };

  return (
    <div
      className={`group relative rounded-lg border bg-gradient-to-br from-white/90 to-white/95 p-6 transition-all duration-700 ease-in-out hover:-translate-y-1 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-600/10 dark:border-black/70 dark:from-black/90 dark:to-black/95 dark:hover:border-primary-500/30 ${
        openMenuId === workspace.id ? 'z-50 shadow-2xl' : 'z-0'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at top left, var(--tw-gradient-from), var(--tw-gradient-to))`,
        transition:
          'background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out',
      }}
      onMouseEnter={() => setHoveredWorkspace(workspace.id)}
      onMouseLeave={() => setHoveredWorkspace(null)}
    >
      {isActive && (
        <div className="absolute -right-2 -top-2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          {t('workspace.active')}
        </div>
      )}

      <div className="mb-6 flex items-start justify-between">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-2xl font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          {userRole?.slug === 'owner' && (
            <div className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary-500 dark:border-neutral-900">
              <Users className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <RoleBadge role={userRole} />
          {workspace.public ? (
            <div title={t('workspace.tooltips.public')}>
              <Globe className="h-4 w-4 text-gray-400" />
            </div>
          ) : (
            <div title={t('workspace.tooltips.private')}>
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 truncate text-xl font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
          {workspace.name}
        </h3>
        <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500 dark:text-neutral-500">
          {workspace.description || (
            <span className="italic text-gray-400 dark:text-neutral-600">
              {t('workspace.no_description_italic')}
            </span>
          )}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium">
              {t('workspace.members_count', {
                count: workspace.users?.length || 0,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
            </div>
            <span className="font-medium">
              {t('workspace.projects_count', {
                count: workspace.projects_count || 0,
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-6 dark:border-neutral-800">
        <div className="flex-1">
          <AvatarStack users={workspace.users || []} roles={roles} />
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800/50 dark:from-emerald-900/30 dark:to-emerald-900/10 dark:text-emerald-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {t('workspace.status.current')}
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
              <span>{t('workspace.status.switch')}</span>
            </Button>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === workspace.id ? null : workspace.id);
              }}
              className={`rounded-lg p-2.5 transition-all duration-200 ${
                ['owner', 'admin'].includes(userRole?.slug)
                  ? 'text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-600 hover:shadow-sm dark:text-neutral-400 dark:hover:from-primary-900/20 dark:hover:to-primary-900/10 dark:hover:text-primary-400'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-gray-300'
              }`}
              title={
                ['owner', 'admin'].includes(userRole?.slug)
                  ? t('workspace.tooltips.manage')
                  : t('workspace.tooltips.view')
              }
            >
              {['owner', 'admin'].includes(userRole?.slug) ? (
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
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                  <Link
                    href={route('workspaces.show', workspace.id)}
                    className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('workspace.status.open')}</span>
                  </Link>
                  {['owner', 'admin'].includes(userRole?.slug) && (
                    <>
                      <Link
                        href={route('workspaces.settings', workspace.id)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <SettingsIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t('workspace.status.settings')}
                        </span>
                      </Link>
                      <Link
                        href={`${route('workspaces.settings', workspace.id)}?tab=members`}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('workspace.status.invite')}</span>
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
