import { getDateFnsLocale } from "@/Utils/dateLocales";
import { format } from "date-fns";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Lock,
  MessageSquare,
  Send,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActivityItem {
  id: number;
  description: string;
  properties?: any;
  created_at: string;
  event: string;
  causer_id?: number;
  causer_type?: string;
  subject_id?: number;
  subject_type?: string;
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

  const getActivityIcon = (event: string) => {
    switch (event) {
      case "created":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "updated":
        return <Edit className="w-4 h-4 text-blue-500" />;
      case "deleted":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "published":
        return <Send className="w-4 h-4 text-purple-500" />;
      case "status_updated":
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
        return <Clock className="w-4 h-4 text-orange-400" />;
      case "publication_failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatActivityText = (activity: ActivityItem) => {
    // Check specific event types first
    if (activity.event === "created") return t("activity.created");
    if (activity.event === "published") return t("activity.published");
    if (activity.event === "unpublished") return t("activity.unpublished");
    if (activity.event === "locked") return t("activity.locked");
    if (activity.event === "unlocked") return t("activity.unlocked");
    if (activity.event === "review_requested")
      return t("activity.review_requested");
    if (activity.event === "approved") return t("activity.approved");
    if (activity.event === "rejected") return t("activity.rejected");
    if (activity.event === "publication_failed")
      return t("activity.publication_failed");

    // Handle updates and status changes
    if (activity.event === "updated") {
      if (activity.properties?.attributes?.status) {
        const oldStatus = activity.properties?.old?.status;
        const newStatus = activity.properties?.attributes?.status;
        if (oldStatus !== newStatus) {
          const oldStatusText = t(
            `publications.status.${oldStatus}`,
            oldStatus,
          );
          const newStatusText = t(
            `publications.status.${newStatus}`,
            newStatus,
          );
          return `${t("activity.statusChanged")} (${oldStatusText} → ${newStatusText})`;
        }
      }
      return t("activity.updated");
    }

    // Fallback to description or unknown
    return activity.description || t("activity.timeline.status.system");
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>{t("activity.noActivity", "No activity recorded yet.")}</p>
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
                      {getActivityIcon(activity.event)}
                    </div>
                  )}

                  {activity.user?.photo_url && (
                    <span className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full p-0.5">
                      {getActivityIcon(activity.event)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {activity.user?.name || t("activity.system", "Sistema")}
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
