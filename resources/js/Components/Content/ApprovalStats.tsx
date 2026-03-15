import axios from "axios";
import { CheckCircle, Clock, Timer, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ApprovalStats {
  pending_requests: number;
  pending_for_me: number;
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
        setStats(json);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-neutral-700/50 dark:bg-neutral-800"
          >
            <div className="flex h-full items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100 dark:bg-neutral-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 w-8 rounded bg-gray-100 dark:bg-neutral-700"></div>
                <div className="h-3 w-24 rounded bg-gray-100 dark:bg-neutral-700"></div>
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
      value: stats.pending_for_me ?? stats.pending_requests,
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
      value: stats.avg_approval_time_hours != null ? `${stats.avg_approval_time_hours}h` : "—",
      icon: Timer,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100 dark:border-blue-900/30",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`rounded-lg border bg-white p-4 dark:bg-neutral-800 ${stat.borderColor} shadow-sm transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-center gap-4">
            <div className={`shrink-0 rounded-full p-3 ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} strokeWidth={2} />
            </div>
            <div>
              <div className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
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
