import { usePublicationApprovalHistory } from '@/Hooks/approval/useApprovalHistory';
import { getDateFnsLocale } from '@/Utils/dateLocales';
import type { ApprovalRequest } from '@/types/ApprovalTypes';
import { format } from 'date-fns';
import { CheckCircle, Clock, MessageSquare, Send, User, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApprovalHistoryTimelineProps {
  contentId: number;
  actions?: ApprovalRequest[];
}

const ACTION_CONFIG = {
  submitted: {
    Icon: Send,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  approved: {
    Icon: CheckCircle,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  rejected: {
    Icon: XCircle,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
} as const;

export default function ApprovalHistoryTimeline({
  contentId,
  actions: initialActions,
}: ApprovalHistoryTimelineProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

  const { data: fetched = [], isLoading } = usePublicationApprovalHistory(
    initialActions ? undefined : contentId,
  );

  // Flatten logs from all requests into a unified timeline
  const timelineEntries = (initialActions ?? fetched).flatMap((req) =>
    (req.logs ?? []).map((log) => ({
      id: log.id,
      user: log.user ?? req.submitter,
      action_type: log.action as 'submitted' | 'approved' | 'rejected',
      approval_level: log.level_number,
      comment: log.comment ?? undefined,
      created_at: log.created_at,
    })),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (timelineEntries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <Clock className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">{t('approval.no_history')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h4 className="mb-6 font-bold text-gray-900 dark:text-white">
        {t('approval.history_title')}
      </h4>

      <div className="space-y-6">
        {timelineEntries.map((entry, index) => {
          const cfg = ACTION_CONFIG[entry.action_type] ?? {
            Icon: Clock,
            color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
          };
          const { Icon, color } = cfg;
          const isLast = index === timelineEntries.length - 1;

          const label =
            {
              submitted: t('approval.action.submitted'),
              approved: t('approval.action.approved'),
              rejected: t('approval.action.rejected'),
            }[entry.action_type] ?? entry.action_type;

          return (
            <div key={entry.id} className="relative">
              {!isLast && (
                <div className="absolute bottom-0 left-5 top-12 w-0.5 bg-gray-200 dark:bg-neutral-700" />
              )}
              <div className="flex gap-4">
                <div
                  className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 pb-6">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {entry.user?.name ?? '—'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
                          {label}
                        </span>
                        {entry.approval_level && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
                            {t('approval.level')} {entry.approval_level}
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entry.created_at), 'PPp', { locale })}
                      </p>
                    </div>
                    {entry.user?.photo_url ? (
                      <img
                        src={entry.user.photo_url}
                        alt={entry.user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-700">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  {entry.comment && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">{entry.comment}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
