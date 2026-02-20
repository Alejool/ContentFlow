import StatCard from "@/Components/Workspace/StatCard";
import Button from "@/Components/common/Modern/Button";
import Select from "@/Components/common/Modern/Select";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import axios from "axios";
import {
  Activity,
  Bell,
  CheckCircle,
  ExternalLink,
  Filter,
  RefreshCw,
  Server,
  Share2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface NotificationsSettingsTabProps {
  workspace: any;
}

export default function NotificationsSettingsTab({
  workspace,
}: NotificationsSettingsTabProps) {
  const { t } = useTranslation();
  const [activityData, setActivityData] = useState<any>({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchActivity = useCallback(
    async (page = 1, perPage = 15, channel = "all", status = "all") => {
      try {
        setLoadingActivity(true);
        const response = await axios.get(
          route("api.v1.workspaces.activity", workspace.id),
          {
            params: {
              page,
              per_page: perPage,
              channel: channel !== "all" ? channel : undefined,
              status: status !== "all" ? status : undefined,
            },
          },
        );
        // Correctly handle the paginated response structure from ApiResponse trait
        const data = response.data;
        setActivityData({
          data: data.data || [],
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          total: data.total || 0,
          per_page: data.per_page || perPage,
        });
      } catch (error) {
        toast.error(t("workspace.failed_to_fetch_activity"));
      } finally {
        setLoadingActivity(false);
      }
    },
    [workspace.id, t],
  );

  useEffect(() => {
    fetchActivity(1, activityData.per_page, channelFilter, statusFilter);
  }, [fetchActivity, channelFilter, statusFilter]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={Bell}
          label={t("workspace.active_integrations")}
          value={activityData.data.filter((a: any) => a.success).length}
          color="purple"
        />
        <StatCard
          icon={Activity}
          label={t("workspace.total_notifications")}
          value={activityData.total}
          color="blue"
        />
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              {t("workspace.activity_log")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
              {t("workspace.recent_webhook_activity")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[140px]">
              <Select
                id="channel-filter"
                options={[
                  { value: "all", label: t("workspace.activity.all_channels") },
                  { value: "slack", label: "Slack" },
                  { value: "discord", label: "Discord" },
                ]}
                value={channelFilter}
                onChange={(val) => setChannelFilter(String(val))}
                size="sm"
                icon={Filter}
                variant="outlined"
              />
            </div>
            <div className="min-w-[140px]">
              <Select
                id="status-filter"
                options={[
                  { value: "all", label: t("workspace.activity.all_statuses") },
                  { value: "sent", label: t("workspace.activity.sent") },
                  { value: "failed", label: t("workspace.activity.failed") },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(String(val))}
                size="sm"
                icon={Filter}
                variant="outlined"
              />
            </div>
            <Button
              variant="secondary"
              buttonStyle="outline"
              size="sm"
              onClick={() =>
                fetchActivity(
                  1,
                  activityData.per_page,
                  channelFilter,
                  statusFilter,
                )
              }
              loading={loadingActivity}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingActivity ? "animate-spin" : ""}`}
              />
              {t("common.refresh")}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-gray-50 dark:bg-neutral-900/50">
              <tr>
                {[
                  t("workspace.activity.time"),
                  t("workspace.activity.channel"),
                  t("workspace.activity.event"),
                  t("workspace.activity.status"),
                  t("workspace.activity.response"),
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {activityData.data.map((log: any) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {new Date(log.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-neutral-500">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          log.channel === "slack"
                            ? "bg-purple-100 dark:bg-purple-900/30"
                            : log.channel === "discord"
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : "bg-gray-100 dark:bg-neutral-800"
                        }`}
                      >
                        {log.channel === "slack" ? (
                          <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        ) : log.channel === "discord" ? (
                          <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {log.channel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {log.event_type === "community_invite"
                        ? t("workspace.integrations.community_invite")
                        : log.event_type}
                    </div>
                    {log.payload?.url && (
                      <a
                        href={log.payload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-1 truncate max-w-[200px]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {log.payload.url}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        log.success
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {log.success ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {log.success ? t("common.sent") : t("common.failed")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm font-mono text-gray-500 dark:text-neutral-500 max-w-[250px] truncate"
                      title={log.response}
                    >
                      {log.status_code ? `[${log.status_code}] ` : ""}
                      {log.response || "—"}
                    </div>
                  </td>
                </tr>
              ))}
              {activityData.data.length === 0 && !loadingActivity && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-neutral-500">
                      <Bell className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-medium">
                        {t("workspace.no_activity")}
                      </p>
                      <p className="text-sm mt-1">
                        {t("workspace.activity_will_appear")}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdvancedPagination
          currentPage={activityData.current_page}
          lastPage={activityData.last_page}
          total={activityData.total}
          perPage={activityData.per_page}
          onPageChange={(page) =>
            fetchActivity(
              page,
              activityData.per_page,
              channelFilter,
              statusFilter,
            )
          }
          onPerPageChange={(perPage) =>
            fetchActivity(1, perPage, channelFilter, statusFilter)
          }
          t={t}
          isLoading={loadingActivity}
        />
      </div>
    </div>
  );
}
