import PublicationTimeline from "@/Components/ManageContent/Publication/common/edit/PublicationTimeline";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";

interface TimelineCompactoProps {
  activities: any[];
  isExpanded: boolean;
  onToggle: () => void;
}

const TimelineCompacto = ({
  activities,
  isExpanded,
  onToggle,
}: TimelineCompactoProps) => {
  const { t } = useTranslation();
  const getLastSignificantActivity = () => {
    if (!activities || activities.length === 0) return null;

    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const relevantActivities = sortedActivities.filter(
      (activity) =>
        activity.status &&
        ["published", "scheduled", "draft", "rejected", "approved"].includes(
          activity.status,
        ),
    );

    return relevantActivities[0] || sortedActivities[0];
  };

  const lastActivity = getLastSignificantActivity();
  const totalActivities = activities.length;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      scheduled:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      approved:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    );
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      published: t("activity.timeline.status.published"),
      scheduled: t("activity.timeline.status.scheduled"),
      draft: t("activity.timeline.status.draft"),
      rejected: t("activity.timeline.status.rejected"),
      approved: t("activity.timeline.status.approved"),
      pending: t("activity.timeline.status.pending"),
    };
    return texts[status] || status;
  };

  if (totalActivities === 0) return null;

  return (
    <div className="bg-gray-50 dark:bg-neutral-700/30 rounded-lg border border-gray-200 dark:border-neutral-600 overflow-hidden">
      <Button
        type="button"
        onClick={onToggle}
        buttonStyle="ghost"
        variant="ghost"
        fullWidth
        className="p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-neutral-600/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-neutral-600 rounded-lg border border-gray-200 dark:border-neutral-500">
            <History className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {t("activity.timeline.title")}
              </span>
              {lastActivity && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lastActivity.status)}`}
                >
                  {getStatusText(lastActivity.status)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalActivities + " " + t("activity.timeline.total")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? t("common.collapse") : t("common.expand")}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </Button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-neutral-600 p-4 max-h-96 overflow-y-auto custom-scrollbar">
          <PublicationTimeline activities={activities} />
        </div>
      )}
    </div>
  );
};

export default TimelineCompacto;
