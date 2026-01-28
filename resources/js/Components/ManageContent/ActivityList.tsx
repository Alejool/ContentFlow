import { getDateFnsLocale } from "@/Utils/dateLocales";
import { format } from "date-fns";
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
  user?: {
    id: number;
    name: string;
    photo_url?: string;
  };
}

interface ActivityListProps {
  activities: ActivityItem[];
}

export default function ActivityList({ activities }: ActivityListProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "updated":
        return <Edit className="w-4 h-4 text-blue-500" />;
      case "deleted":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "published":
        return <Send className="w-4 h-4 text-purple-500" />;
      case "status_updated":
      case "status_changed":
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case "locked":
        return <Lock className="w-4 h-4 text-orange-500" />;
      case "unlocked":
        return <Lock className="w-4 h-4 text-gray-400" />;
      case "commented":
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "review_requested":
      case "requested_approval":
        return <Clock className="w-4 h-4 text-orange-400" />;
      case "publication_failed":
        return <ServerCrash className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatActivityText = (activity: ActivityItem) => {
    if (activity.type === "created")
      return t("activity.timeline.status.created");
    if (activity.type === "published")
      return t("activity.timeline.status.published");
    if (activity.type === "unpublished")
      return t("activity.timeline.status.unpublished");
    if (activity.type === "locked") return t("activity.timeline.status.locked");
    if (activity.type === "unlocked")
      return t("activity.timeline.status.unlocked");
    if (
      activity.type === "review_requested" ||
      activity.type === "requested_approval"
    )
      return t("activity.timeline.requested_approval");
    if (activity.type === "approved")
      return t("activity.timeline.status.approved");
    if (activity.type === "rejected")
      return t("activity.timeline.status.rejected");
    if (activity.type === "publication_failed")
      return t("activity.timeline.publication_failed");

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
          const oldStatusText = t(
            `publications.status.${oldStatus}`,
            oldStatus,
          );
          const newStatusText = t(
            `publications.status.${newStatus}`,
            newStatus,
          );
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
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>{t("activity.timeline.noActivity", "No activity recorded yet.")}</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-neutral-700"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div className="relative">
                  {activity.user?.photo_url ? (
                    <img
                      src={activity.user.photo_url}
                      className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white dark:ring-neutral-800"
                      alt=""
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center ring-8 ring-white dark:ring-neutral-800">
                      {getActivityIcon(activity.type)}
                    </div>
                  )}

                  {activity.user?.photo_url && (
                    <span className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full p-0.5">
                      {getActivityIcon(activity.type)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {activity.type === "publication_failed"
                          ? t("activity.timeline.system", "Sistema")
                          : activity.user?.name ||
                            t("activity.timeline.system", "Sistema")}
                      </span>{" "}
                      {formatActivityText(activity)}
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    <time dateTime={activity.created_at}>
                      {format(new Date(activity.created_at), "PPp", { locale })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
