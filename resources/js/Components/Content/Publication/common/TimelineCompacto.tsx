import PublicationTimeline from '@/Components/Content/Publication/common/edit/PublicationTimeline';
import { getStatusBadgeClass } from '@/lib/common/statusMeta';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PublicationActivity } from '@/types/Publications/Publication';

interface TimelineCompactoProps {
  activities: PublicationActivity[];
  isExpanded: boolean;
  onToggle: () => void;
}

const TimelineCompacto = ({ activities, isExpanded, onToggle }: TimelineCompactoProps) => {
  const { t } = useTranslation();
  const getLastSignificantActivity = () => {
    if (!activities || activities.length === 0) return null;

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const relevantActivities = sortedActivities.filter(
      (activity) =>
        activity.status &&
        ['published', 'scheduled', 'draft', 'rejected', 'approved'].includes(activity.status),
    );

    return relevantActivities[0] || sortedActivities[0];
  };

  const lastActivity = getLastSignificantActivity();
  const totalActivities = activities.length;

  // Status badge from the single source of truth (lib/common/statusMeta).
  const getStatusColor = (status: string) => getStatusBadgeClass(status);

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      published: t('activity.timeline.status.published'),
      scheduled: t('activity.timeline.status.scheduled'),
      draft: t('activity.timeline.status.draft'),
      rejected: t('activity.timeline.status.rejected'),
      approved: t('activity.timeline.status.approved'),
      pending: t('activity.timeline.status.pending'),
    };
    return texts[status] || status;
  };

  if (totalActivities === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-600/30"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-neutral-500 dark:bg-neutral-600">
            <History className="h-4 w-4 text-gray-600 dark:text-neutral-300" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {t('activity.timeline.title')}
              </span>
              {lastActivity && (
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getStatusColor(lastActivity.status || 'pending')}`}
                >
                  {getStatusText(lastActivity.status || 'pending')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {totalActivities + ' ' + t('activity.timeline.total')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-neutral-400">
            {isExpanded ? t('common.collapse') : t('common.expand')}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="custom-scrollbar max-h-96 overflow-y-auto border-t border-gray-200 p-4 dark:border-neutral-600">
          <PublicationTimeline activities={activities} />
        </div>
      )}
    </div>
  );
};

export default TimelineCompacto;
