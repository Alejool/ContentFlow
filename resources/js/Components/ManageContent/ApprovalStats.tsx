import axios from "axios";
import { CheckCircle, Clock, TrendingUp, XCircle } from "lucide-react";
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
      const response = await axios.get(route("approvals.stats"));
      const json = response.data;
      if (json.success) {
        const stats = json.pending_requests !== undefined ? json : json.data || {};
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
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded w-1/3"></div>
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
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      label: t("approvals.stats.approvedToday"),
      value: stats.approved_today,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: t("approvals.stats.rejectedToday"),
      value: stats.rejected_today,
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-100 dark:bg-rose-900/30",
    },
    {
      label: t("approvals.stats.avgApprovalTime"),
      value: `${stats.avg_approval_time_hours}h`,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-700/50 shadow-sm hover:shadow transition-all flex items-center gap-3"
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${stat.bgColor}`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {stat.value}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
