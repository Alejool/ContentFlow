import { getDateFnsLocale } from "@/Utils/dateLocales";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Send,
  User,
  MessageSquare,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ApprovalAction {
  id: number;
  user: {
    id: number;
    name: string;
    photo_url?: string;
  };
  action_type: "submitted" | "approved" | "rejected";
  approval_level: number | null;
  comment?: string;
  created_at: string;
}

interface ApprovalHistoryTimelineProps {
  contentId: number;
  actions?: ApprovalAction[];
}

export default function ApprovalHistoryTimeline({
  contentId,
  actions: initialActions,
}: ApprovalHistoryTimelineProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [actions, setActions] = useState<ApprovalAction[]>(
    initialActions || [],
  );
  const [isLoading, setIsLoading] = useState(!initialActions);

  useEffect(() => {
    if (!initialActions) {
      fetchHistory();
    }
  }, [contentId]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        route("api.content.approval-history", contentId),
      );
      setActions(response.data.data || []);
    } catch (error: any) {
      toast.error(t("approval.errors.fetch_history_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "submitted":
        return Send;
      case "approved":
        return CheckCircle;
      case "rejected":
        return XCircle;
      default:
        return Clock;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "submitted":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case "submitted":
        return t("approval.action.submitted");
      case "approved":
        return t("approval.action.approved");
      case "rejected":
        return t("approval.action.rejected");
      default:
        return actionType;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-8 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          {t("approval.no_history")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
      <h4 className="font-bold text-gray-900 dark:text-white mb-6">
        {t("approval.history_title")}
      </h4>

      <div className="space-y-6">
        {actions.map((action, index) => {
          const Icon = getActionIcon(action.action_type);
          const isLast = index === actions.length - 1;

          return (
            <div key={action.id} className="relative">
              {/* Timeline Line */}
              {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-neutral-700" />
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(action.action_type)}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {action.user.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${getActionColor(action.action_type)}`}
                        >
                          {getActionLabel(action.action_type)}
                        </span>
                        {action.approval_level && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                            {t("approval.level")} {action.approval_level}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(action.created_at), "PPp", { locale })}
                      </p>
                    </div>

                    {/* User Avatar */}
                    {action.user.photo_url ? (
                      <img
                        src={action.user.photo_url}
                        alt={action.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  {action.comment && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {action.comment}
                        </p>
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
