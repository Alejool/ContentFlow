import Button from '@/Components/common/Modern/Button';
import BarChart from '@/Components/Statistics/BarChart';
import PieChart from '@/Components/Statistics/PieChart';
import { useTheme } from '@/Hooks/useTheme';
import axios from 'axios';
import { AlertCircle, BarChart3, Clock, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface AnalyticsData {
  average_approval_times: Record<number, number>;
  approval_rates_by_role: Array<{
    role: string;
    approval_rate: number;
    rejection_rate: number;
    total_actions: number;
  }>;
  pending_content_by_level: Record<number, number>;
  stale_pending_content: Array<{
    id: number;
    title: string;
    submitted_at: string;
    days_pending: number;
    current_level: number;
  }>;
  approver_workload: Array<{
    user_id: number;
    user_name: string;
    role: string;
    pending_count: number;
  }>;
  average_publication_time: number;
}

interface ApprovalAnalyticsDashboardProps {
  workspace: { id: number | string };
  canViewAnalytics: boolean;
}

export default function ApprovalAnalyticsDashboard({
  workspace,
  canViewAnalytics,
}: ApprovalAnalyticsDashboardProps) {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (canViewAnalytics) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id, canViewAnalytics]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        route('api.v1.workspaces.approval-analytics.index', {
          idOrSlug: workspace.id,
        }),
      );
      setAnalytics(response.data.data);
    } catch {
      toast.error(t('approval.analytics.errors.fetch_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);
      const response = await axios.get(
        route('api.v1.workspaces.approval-analytics.export', {
          idOrSlug: workspace.id,
        }),
        {
          params: { format },
          responseType: 'blob',
        },
      );

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `approval-analytics-${workspace.id}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('approval.analytics.success.exported'));
    } catch {
      toast.error(t('approval.analytics.errors.export_failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (isLoading || !analytics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Prepare chart data
  const approvalTimeData = Object.entries(analytics.average_approval_times || {}).map(
    ([level, time]) => ({
      name: `${t('approval.analytics.level')} ${level}`,
      time: Math.round((time as number) / 60), // Convert to minutes
    }),
  );

  const approvalRatesData = analytics.approval_rates_by_role.map((item) => ({
    name: item.role,
    approvals: item.approval_rate * item.total_actions || 0,
    rejections: item.rejection_rate * item.total_actions || 0,
  }));

  const approvalRatesPieData = analytics.approval_rates_by_role.map((item) => ({
    name: item.role,
    value: Math.round(item.approval_rate * 100),
  }));

  const pendingByLevelData = Object.entries(analytics.pending_content_by_level || {}).map(
    ([level, count]) => ({
      name: `${t('approval.analytics.level')} ${level}`,
      count: count,
    }),
  );

  const workloadData = analytics.approver_workload.slice(0, 10).map((item) => ({
    name: item.user_name,
    pending: item.pending_count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
              <BarChart3 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('approval.analytics.title')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('approval.analytics.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              buttonStyle="outline"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              icon={Download}
              size="sm"
            >
              {t('approval.analytics.export_csv')}
            </Button>
            <Button
              variant="ghost"
              buttonStyle="outline"
              onClick={() => handleExport('json')}
              disabled={isExporting}
              icon={FileText}
              size="sm"
            >
              {t('approval.analytics.export_json')}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Average Publication Time */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t('approval.analytics.avg_publication_time')}
            </h4>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatTime(analytics.average_publication_time)}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('approval.analytics.from_submission_to_publish')}
          </p>
        </div>

        {/* Total Pending Content */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/20">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t('approval.analytics.total_pending')}
            </h4>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {Object.values(analytics.pending_content_by_level || {}).reduce(
              (sum, count) => sum + count,
              0,
            )}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('approval.analytics.across_all_levels')}
          </p>
        </div>

        {/* Stale Content */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t('approval.analytics.stale_content')}
            </h4>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.stale_pending_content.length}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('approval.analytics.pending_over_7_days')}
          </p>
        </div>
      </div>

      {/* Charts Row 1: Average Approval Time & Approval Rates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Average Approval Time by Level */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('approval.analytics.avg_time_per_level')}
            </h4>
          </div>
          {approvalTimeData.length > 0 ? (
            <BarChart
              data={approvalTimeData}
              bars={[
                {
                  dataKey: 'time',
                  name: t('approval.analytics.minutes'),
                  color: '#3b82f6',
                },
              ]}
              xAxisKey="name"
              height={300}
              theme={actualTheme}
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
              {t('approval.analytics.no_data_available')}
            </div>
          )}
        </div>

        {/* Approval/Rejection Rates by Role */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('approval.analytics.approval_rejection_rates')}
            </h4>
          </div>
          {approvalRatesData.length > 0 ? (
            <BarChart
              data={approvalRatesData}
              bars={[
                {
                  dataKey: 'approvals',
                  name: t('approval.analytics.approvals'),
                  color: '#10b981',
                },
                {
                  dataKey: 'rejections',
                  name: t('approval.analytics.rejections'),
                  color: '#ef4444',
                },
              ]}
              xAxisKey="name"
              height={300}
              theme={actualTheme}
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
              {t('approval.analytics.no_data_available')}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Pending by Level & Approval Rate Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Content by Level */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('approval.analytics.pending_by_level')}
            </h4>
          </div>
          {pendingByLevelData.length > 0 ? (
            <BarChart
              data={pendingByLevelData}
              bars={[
                {
                  dataKey: 'count',
                  name: t('approval.analytics.pending_count'),
                  color: '#f59e0b',
                },
              ]}
              xAxisKey="name"
              height={300}
              theme={actualTheme}
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
              {t('approval.analytics.no_data_available')}
            </div>
          )}
        </div>

        {/* Approval Rate Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('approval.analytics.approval_rate_distribution')}
            </h4>
          </div>
          {approvalRatesPieData.length > 0 ? (
            <PieChart data={approvalRatesPieData} height={300} theme={actualTheme} />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
              {t('approval.analytics.no_data_available')}
            </div>
          )}
        </div>
      </div>

      {/* Approver Workload */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h4 className="font-bold text-gray-900 dark:text-white">
            {t('approval.analytics.approver_workload')}
          </h4>
        </div>
        {workloadData.length > 0 ? (
          <BarChart
            data={workloadData}
            bars={[
              {
                dataKey: 'pending',
                name: t('approval.analytics.pending_tasks'),
                color: '#8b5cf6',
              },
            ]}
            xAxisKey="name"
            height={300}
            layout="horizontal"
            theme={actualTheme}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
            {t('approval.analytics.no_data_available')}
          </div>
        )}
      </div>

      {/* Stale Content Table */}
      {analytics.stale_pending_content.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('approval.analytics.stale_content_details')}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-800">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.content_title')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.submitted_at')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.days_pending')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.current_level')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.stale_pending_content.map((content) => (
                  <tr
                    key={content.id}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {content.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(content.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {content.days_pending} {t('approval.analytics.days')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {t('approval.analytics.level')} {content.current_level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Stats Table */}
      {analytics.approval_rates_by_role.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('approval.analytics.detailed_stats')}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-800">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.role')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.total_actions')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.approvals')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.rejections')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {t('approval.analytics.approval_rate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.approval_rates_by_role.map((stat, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {stat.role}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                      {stat.total_actions}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                      {(stat.approval_rate * stat.total_actions).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600 dark:text-red-400">
                      {(stat.rejection_rate * stat.total_actions).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {(stat.approval_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
