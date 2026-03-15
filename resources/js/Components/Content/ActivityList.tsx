import { getDateFnsLocale } from "@/Utils/dateLocales";
import { VirtualList } from "@/Components/common/ui/VirtualList";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Lock,
  MessageSquare,
  Send,
  ServerCrash,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActivityItem {
  id: number;
  details?: any;
  created_at: string;
  type: string;
  description?: string;
  formatted_changes?: {
    has_comparison: boolean;
    before?: any;
    after?: any;
    data?: any;
    added?: any[];
    removed?: any[];
  };
  user?: {
    id: number;
    name: string;
    photo_url?: string;
  };
}

interface ActivityListProps {
  activities: ActivityItem[];
}

// Componente extraído fuera del componente principal
const ActivityTimelineItem = ({
  activity,
  activityIdx,
  activitiesLength,
  t,
  locale,
  getActivityIcon,
  formatActivityText,
}: {
  activity: ActivityItem;
  activityIdx: number;
  activitiesLength: number;
  t: any;
  locale: any;
  getActivityIcon: (type: string) => JSX.Element;
  formatActivityText: (activity: ActivityItem) => string;
}) => (
  <div key={activity.id} className="relative pb-8">
    {activityIdx !== activitiesLength - 1 ? (
      <span
        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-neutral-700"
        aria-hidden="true"
      />
    ) : null}
    <div className="relative flex space-x-3">
      <div className="relative">
        {activity.user?.photo_url ? (
          <img
            src={activity.user.photo_url}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white dark:ring-neutral-800"
            alt=""
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-neutral-700 dark:ring-neutral-800">
            {getActivityIcon(activity.type)}
          </div>
        )}

        {activity.user?.photo_url && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 dark:bg-neutral-800">
            {getActivityIcon(activity.type)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2 pt-1.5">
        <div className="flex justify-between space-x-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {!activity.description && (
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {activity.type === "publication_failed"
                    ? t("activity.timeline.system", "Sistema")
                    : activity.user?.name || t("activity.timeline.system", "Sistema")}{" "}
                </span>
              )}
              {formatActivityText(activity)}
            </p>
          </div>
          <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={activity.created_at}>
              {formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: true,
                locale: locale,
              })}
            </time>
          </div>
        </div>

        {activity.formatted_changes?.has_comparison && (
          <div className="mt-2 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="rounded border border-red-100 bg-red-50 p-2 dark:border-red-900/30 dark:bg-red-900/10">
              <div className="mb-1 font-medium text-red-700 dark:text-red-400">
                {t("activity.timeline.before", "Antes")}:
              </div>
              <div className="break-words font-mono text-[10px] leading-tight text-gray-700 dark:text-gray-300">
                {typeof activity.formatted_changes.before === "object"
                  ? JSON.stringify(activity.formatted_changes.before, null, 2)
                  : activity.formatted_changes.before || "(vacío)"}
              </div>
            </div>
            <div className="rounded border border-green-100 bg-green-50 p-2 dark:border-green-900/30 dark:bg-green-900/10">
              <div className="mb-1 font-medium text-green-700 dark:text-green-400">
                {t("activity.timeline.after", "Después")}:
              </div>
              <div className="break-words font-mono text-[10px] leading-tight text-gray-700 dark:text-gray-300">
                {typeof activity.formatted_changes.after === "object"
                  ? JSON.stringify(activity.formatted_changes.after, null, 2)
                  : activity.formatted_changes.after || "(vacío)"}
              </div>
            </div>
          </div>
        )}

        {((activity.formatted_changes?.added && activity.formatted_changes.added.length > 0) ||
          (activity.formatted_changes?.removed &&
            activity.formatted_changes.removed.length > 0)) && (
          <div className="mt-2 space-y-2 text-xs">
            {activity.formatted_changes?.added && activity.formatted_changes.added.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="mr-1 font-medium text-green-600 dark:text-green-400">
                  Agregado:
                </span>
                {activity.formatted_changes.added.map((item: any, i: number) => (
                  <span
                    key={i}
                    className="rounded-full bg-green-100 px-1.5 py-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    {typeof item === "string" ? item : JSON.stringify(item)}
                  </span>
                ))}
              </div>
            )}

            {activity.formatted_changes?.removed &&
              activity.formatted_changes.removed.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="mr-1 font-medium text-red-600 dark:text-red-400">
                    Eliminado:
                  </span>
                  {activity.formatted_changes.removed.map((item: any, i: number) => (
                    <span
                      key={i}
                      className="rounded-full bg-red-100 px-1.5 py-0.5 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    >
                      {typeof item === "string" ? item : JSON.stringify(item)}
                    </span>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function ActivityList({ activities }: ActivityListProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "updated":
      case "title_changed":
      case "content_changed":
      case "caption_changed":
      case "hashtags_changed":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "deleted":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "published":
        return <Send className="h-4 w-4 text-purple-500" />;
      case "status_updated":
      case "status_changed":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case "locked":
        return <Lock className="h-4 w-4 text-orange-500" />;
      case "unlocked":
        return <Lock className="h-4 w-4 text-gray-400" />;
      case "commented":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "review_requested":
      case "requested_approval":
        return <Clock className="h-4 w-4 text-orange-400" />;
      case "publication_failed":
        return <ServerCrash className="h-4 w-4 text-red-600" />;
      case "image_changed":
      case "media_changed":
        return <FileText className="h-4 w-4 text-purple-400" />;
      case "platforms_changed":
      case "schedule_changed":
      case "scheduled_time_changed":
        return <Clock className="h-4 w-4 text-indigo-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatActivityText = (activity: ActivityItem) => {
    // Priority 1: Server-side description
    if (activity.description) {
      return activity.description;
    }

    // Priority 2: Client-side formatting (Legacy support)
    if (activity.type === "created") return t("activity.timeline.status.created");
    if (activity.type === "published") return t("activity.timeline.status.published");
    if (activity.type === "unpublished") return t("activity.timeline.status.unpublished");
    if (activity.type === "locked") return t("activity.timeline.status.locked");
    if (activity.type === "unlocked") return t("activity.timeline.status.unlocked");
    if (activity.type === "review_requested" || activity.type === "requested_approval")
      return t("activity.timeline.requested_approval");
    if (activity.type === "approved") return t("activity.timeline.status.approved");
    if (activity.type === "rejected") return t("activity.timeline.status.rejected");
    if (activity.type === "publication_failed") return t("activity.timeline.publication_failed");

    // Handle specific change types
    if (activity.type === "title_changed") return t("activity.timeline.status.title_changed");
    if (activity.type === "content_changed") return t("activity.timeline.status.content_changed");
    if (activity.type === "caption_changed") return t("activity.timeline.status.caption_changed");
    if (activity.type === "hashtags_changed") return t("activity.timeline.status.hashtags_changed");
    if (activity.type === "media_changed") return t("activity.timeline.status.media_changed");
    if (activity.type === "platforms_changed")
      return t("activity.timeline.status.platforms_changed");
    if (activity.type === "scheduled_time_changed")
      return t("activity.timeline.status.scheduled_time_changed");
    if (activity.type === "status_changed") return t("activity.timeline.status.status_changed");

    if (activity.type === "published_on_platform") {
      return t("activity.timeline.status.published_on_platform_detail", {
        platform: activity.details?.platform || "Plataforma",
        defaultValue: `Publicado en ${activity.details?.platform || "plataforma"}`,
      });
    }

    if (activity.type === "failed_on_platform") {
      return t("activity.timeline.status.failed_on_platform_detail", {
        platform: activity.details?.platform || "Plataforma",
        error: activity.details?.error || "",
        defaultValue: `Fallo en ${activity.details?.platform || "plataforma"}`,
      });
    }

    if (activity.type === "updated") {
      if (activity.details?.attributes?.status) {
        const oldStatus = activity.details?.old?.status;
        const newStatus = activity.details?.attributes?.status;
        if (oldStatus !== newStatus) {
          const oldStatusText = t(`publications.status.${oldStatus}`, oldStatus);
          const newStatusText = t(`publications.status.${newStatus}`, newStatus);
          return `${t("activity.timeline.status.statusChanged")} (${oldStatusText} → ${newStatusText})`;
        }
      }
      return t("activity.timeline.status.updated");
    }

    // Attempt to translate the type as a fallback if not explicitly handled
    return t(`activity.timeline.${activity.type}`, {
      defaultValue: activity.type,
    });
  };

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        <p>{t("activity.timeline.noActivity", "No activity recorded yet.")}</p>
      </div>
    );
  }

  // Wrapper para renderItem que pasa las props necesarias
  const renderItem = (activity: ActivityItem, activityIdx: number) => (
    <ActivityTimelineItem
      activity={activity}
      activityIdx={activityIdx}
      activitiesLength={activities.length}
      t={t}
      locale={locale}
      getActivityIcon={getActivityIcon}
      formatActivityText={formatActivityText}
    />
  );

  return (
    <div className="flow-root overflow-y-auto" style={{ height: "500px" }}>
      <VirtualList
        items={activities}
        estimatedItemSize={100}
        overscan={3}
        renderItem={renderItem}
      />
    </div>
  );
}
