import AdminNavigation from '@/Components/Admin/AdminNavigation';
import AdminMetrics, { type Stats } from '@/Components/Admin/Dashboard/AdminMetrics';
import AdminQuickActions from '@/Components/Admin/Dashboard/AdminQuickActions';
import AdminQuickInfo from '@/Components/Admin/Dashboard/AdminQuickInfo';
import AdminRecentActivity, {
  type RecentActivity,
} from '@/Components/Admin/Dashboard/AdminRecentActivity';
import AdminSubscriptionsByPlan from '@/Components/Admin/Dashboard/AdminSubscriptionsByPlan';
import SystemStatusCard from '@/Components/Admin/SystemStatusCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface SystemStatus {
  plans: Record<string, boolean>;
  addons: Record<string, boolean>;
  features: Record<string, boolean>;
  integrations: Record<string, boolean>;
  general: {
    maintenance_mode: boolean;
    new_registrations: boolean;
  };
}

interface Props {
  systemStatus: SystemStatus;
  stats?: Stats;
  recentActivity?: RecentActivity[];
}

export default function AdminDashboard({ systemStatus, stats, recentActivity = [] }: Props) {
  const { t } = useTranslation();

  return (
    <AuthenticatedLayout
      header={
        <div className="mt-2 flex items-center justify-center text-3xl text-gray-900 dark:text-neutral-100">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-neutral-100">
              {t('admin.dashboard.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              {t('admin.dashboard.subtitle')}
            </p>
          </div>
        </div>
      }
    >
      <Head title={t('admin.dashboard.title')} />
      <AdminNavigation currentRoute="/admin/dashboard" />

      <div className="min-h-screen bg-gray-50 py-6 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <AdminMetrics stats={stats} />

          <AdminSubscriptionsByPlan subscriptionsByPlan={stats?.subscriptions_by_plan} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <AdminQuickActions />
              <AdminRecentActivity recentActivity={recentActivity} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                {t('admin.dashboard.system_status')}
              </h3>
              <SystemStatusCard status={systemStatus} />
              <AdminQuickInfo />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
