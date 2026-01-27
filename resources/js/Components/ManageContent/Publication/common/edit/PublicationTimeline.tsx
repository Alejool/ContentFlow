import { getDateFnsLocale } from "@/Utils/dateLocales";
import { format } from "date-fns";
import {
  Activity,
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  Lock,
  PlusCircle,
  ServerCrash,
  Shield,
  Unlock,
  User,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface PublicationActivity {
  id: number;
  type: string;
  details: any;
  created_at: string;
  user?: {
    id: number;
    name: string;
    photo_url?: string;
  };
}

interface PublicationTimelineProps {
  activities: PublicationActivity[];
}

export default function PublicationTimeline({
  activities,
}: PublicationTimelineProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

  if (!activities || activities.length === 0) {
    return null;
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return <PlusCircle className="w-5 h-5 text-blue-500" />;
      case "updated":
        return <Edit className="w-5 h-5 text-indigo-500" />;
      case "status_changed":
        return <Activity className="w-5 h-5 text-amber-500" />;
      case "requested_approval":
        return <Shield className="w-5 h-5 text-purple-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case "published":
        return <CheckCircle className="w-5 h-5 text-teal-500" />;
      case "publishing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "published_on_platform":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed_on_platform":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "locked":
        return <Lock className="w-5 h-5 text-gray-500" />;
      case "unlocked":
        return <Unlock className="w-5 h-5 text-gray-500" />;
      case "publication_failed":
        return <ServerCrash className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "created":
        return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20";
      case "updated":
        return "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20";
      case "requested_approval":
        return "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20";
      case "approved":
        return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20";
      case "rejected":
        return "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20";
      case "published":
        return "bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/20";
      case "publishing":
        return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20";
      case "published_on_platform":
        return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20";
      case "failed_on_platform":
        return "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20";
      case "publication_failed":
        return "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20";
      default:
        return "bg-gray-50 dark:bg-neutral-800/50 border-gray-100 dark:border-neutral-700";
    }
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case "created":
        return t("activity.timeline.status.created") || "Creado";
      case "updated":
        return t("activity.timeline.status.updated") || "Actualizado";
      case "requested_approval":
        return (
          t("activity.timeline.requested_approval") || "Solicitó aprobación"
        );
      case "approved":
        return t("activity.timeline.status.approved") || "Aprobado";
      case "rejected":
        return t("activity.timeline.status.rejected") || "Rechazado";
      case "published":
        return t("activity.timeline.status.published") || "Publicado";
      case "publishing":
        return t("activity.timeline.status.publishing") || "Publicando...";
      case "failed_on_platform":
        return (
          t("activity.timeline.status.failed_on_platform") ||
          "Falló en plataforma"
        );
      case "published_on_platform":
        return (
          t("activity.timeline.status.published_on_platform") ||
          "Publicado en plataforma"
        );
      case "publication_failed":
        return (
          t("activity.timeline.publication_failed") || "Fallo en la publicación"
        );
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary-500" />
        {t("activity.timeline.title") || "Timeline"}
      </h3>

      <div className="relative pl-8 border-l-2 border-gray-200 dark:border-neutral-700 space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="relative group">
            <div className="absolute -left-[39px] top-1.5 flex items-center justify-center w-8 h-8 bg-white dark:bg-neutral-800 rounded-full border border-gray-200 dark:border-neutral-600 shadow-sm z-10">
              {getActivityIcon(activity.type)}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {formatActivityType(activity.type)}
                </span>
                <time className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {format(new Date(activity.created_at), "PPp", { locale })}
                </time>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                <div className="flex items-center gap-1.5 opacity-80">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {activity.user?.name || t("activity.timeline.system")}
                  </span>
                </div>

                {/* {activity.details && (
                  <div className="bg-gray-50 dark:bg-neutral-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-neutral-700/50">
                    {activity.type === "updated" && activity.details.changes ? (
                      <p>
                        <span className="font-medium">{t("activity.timeline.status.updated")}:</span>{" "}
                        {Array.isArray(activity.details.changes)
                          ? activity.details.changes.join(", ")
                          : JSON.stringify(activity.details.changes)}
                      </p>
                    ) : activity.type === "rejected" &&
                      activity.details.reason ? (
                       <p className="text-rose-600">
                        {t("activity.timeline.status.rejected")}:{" "}{activity.details.reason}
                      </p>
                    ) : activity.type === "published" &&
                      activity.details.platforms ? (
                      <p>
                        {t("activity.timeline.status.published")}:{" "}
                        {Array.isArray(activity.details.platforms)
                          ? activity.details.platforms.join(", ")
                          : JSON.stringify(activity.details.platforms)}
                      </p>
                    ) : (
                      <pre className="whitespace-pre-wrap overflow-hidden text-[10px] opacity-70 font-mono">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )} */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
