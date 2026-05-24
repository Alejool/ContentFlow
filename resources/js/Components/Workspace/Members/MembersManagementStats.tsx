import type { MembersStats } from '@/types/Workspace/MembersManagement';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MembersManagementStatsProps {
  stats: MembersStats;
}

export default function MembersManagementStats({ stats }: MembersManagementStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total members */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-theme-bg-secondary">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {t('workspace.stats.total_members', { defaultValue: 'Total members' })}
          </p>
        </div>
      </div>

      {/* Owners */}
      {stats.byRole['owner'] !== undefined && (
        <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm dark:border-purple-900/40 dark:bg-purple-900/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {stats.byRole['owner']}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              {t('workspace.roles.owners', { defaultValue: 'Owners' })}
            </p>
          </div>
        </div>
      )}

      {/* Admins */}
      {stats.byRole['admin'] !== undefined && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {stats.byRole['admin']}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {t('workspace.roles.admins', { defaultValue: 'Admins' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
