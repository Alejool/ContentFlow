import axios from "axios";
import { CheckCircle, Clock, Timer, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ApprovalStats {
  pending_requests: number;
  approved_today: number;
  rejected_today: number;
  avg_approval_time_hours: number;
}

interface ApprovalStatsProps {
  refreshTrigger?: number;
}

export default function ApprovalStats({ refreshTrigger }: ApprovalStatsProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/v1/approvals/stats");
      const json = response.data;
      if (json.success) {
        const stats =
          json.pending_requests !== undefined ? json : json.data || {};
        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching approval stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-700/50 shadow-sm animate-pulse h-[88px]"
          >
            <div className="flex items-center gap-4 h-full">
              <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-700 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-100 dark:bg-neutral-700 rounded w-8"></div>
                <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: t("approvals.stats.pendingRequests"),
      value: stats.pending_requests,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-100 dark:border-amber-900/30",
    },
    {
      label: t("approvals.stats.approvedToday"),
      value: stats.approved_today,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-100 dark:border-emerald-900/30",
    },
    {
      label: t("approvals.stats.rejectedToday"),
      value: stats.rejected_today,
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
      borderColor: "border-rose-100 dark:border-rose-900/30",
    },
    {
      label: t("approvals.stats.avgApprovalTime"),
      value: `${stats.avg_approval_time_hours}h`,
      icon: Timer,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100 dark:border-blue-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`bg-white dark:bg-neutral-800 rounded-lg p-4 border ${stat.borderColor} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full shrink-0 ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
