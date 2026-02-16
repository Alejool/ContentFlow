import StatCard from "@/Components/Workspace/StatCard";
import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import FilterSection from "@/Components/Content/common/FilterSection";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import { router } from "@inertiajs/react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Key,
  RefreshCw,
  Server,
  Share2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ActivityLogSkeleton from "./ActivityLogSkeleton";

interface IntegrationsSettingsTabProps {
  workspace: any;
  isOwner: boolean;
  canManageWorkspace: boolean;
}

export default function IntegrationsSettingsTab({
  workspace,
  isOwner,
  canManageWorkspace,
}: IntegrationsSettingsTabProps) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<"config" | "activity">(
    "config",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<any>({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 5,
  });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const { register, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      slack_webhook_url: workspace.slack_webhook_url || "",
      discord_webhook_url: workspace.discord_webhook_url || "",
      webhook_secret: workspace.webhook_secret || "",
    },
  });

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setValue("webhook_secret", secret);
    toast.success(t("workspace.secret_generated"));
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === "channel") {
      setChannelFilter(value);
      fetchActivity(1, activityData?.per_page || 5, value, statusFilter);
    } else if (key === "status") {
      setStatusFilter(value);
      fetchActivity(1, activityData?.per_page || 5, channelFilter, value);
    } else if (key === "search") {
      setSearchFilter(value);
    }
  };
  const fetchActivity = useCallback(
    async (
      page = 1,
      perPage = 5,
      channelOverride?: string,
      statusOverride?: string,
    ) => {
      try {
        setLoadingActivity(true);
        // Use current state if no override provided
        const channel =
          channelOverride !== undefined ? channelOverride : channelFilter;
        const status =
          statusOverride !== undefined ? statusOverride : statusFilter;

        const response = await axios.get(
          route("api.v1.workspaces.activity", workspace.id),
          {
            params: {
              page,
              per_page: perPage,
              channel: channel || undefined,
              status: status || undefined,
            },
          },
        );

        const payload = response.data;
        // ApiResponse merges the paginator if toArray() was called in backend
        // So payload will have current_page, total, and data (the items)
        setActivityData({
          data: payload.data || [],
          current_page: payload.current_page || 1,
          last_page: payload.last_page || 1,
          total: payload.total || 0,
          per_page: payload.per_page || perPage,
        });
      } catch (error) {
        console.error("Failed to fetch activity", error);
      } finally {
        setLoadingActivity(false);
      }
    },
    [workspace.id, channelFilter, statusFilter],
  );

  const onSubmit = (data: any) => {
    if (!canManageWorkspace) {
      toast.error(t("workspace.permissions_required"));
      return;
    }

    setIsSaving(true);
    router.put(route("workspaces.update", workspace.id), data, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(t("workspace.integrations.messages.success"));
        setIsSaving(false);
      },
      onError: () => setIsSaving(false),
    });
  };

  const testConnection = async (type: "slack" | "discord") => {
    if (!canManageWorkspace) {
      toast.error(t("workspace.permissions_required"));
      return;
    }

    const currentUrl = getValues(
      type === "slack" ? "slack_webhook_url" : "discord_webhook_url",
    );
    if (!currentUrl) {
      toast.error(
        t("workspace.integrations.messages.enter_url", { type: type }),
      );
      return;
    }

    setTesting(type);
    try {
      await axios.post(
        route("api.v1.workspaces.webhooks.test", {
          workspace: workspace.id,
        }),
        {
          type,
          url: currentUrl,
        },
      );
      toast.success(t("workspace.integrations.messages.test_success"));
      router.reload({
        only: ["workspace"],
      } as any);
      fetchActivity(1, activityData.per_page);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        t("workspace.integrations.messages.test_error");
      toast.error(message, { duration: 6000 });
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    if (activeSubTab === "activity") {
      fetchActivity(
        1,
        activityData?.per_page || 5,
        channelFilter,
        statusFilter,
      );
    }
  }, [activeSubTab, channelFilter, statusFilter, fetchActivity]);

  useEffect(() => {
    // Also load initial stats/count
    fetchActivity(1, 5);
  }, [workspace.id, fetchActivity]);

  const IntegrationCard = ({
    title,
    description,
    icon: Icon,
    type,
    color,
  }: any) => {
    const currentUrl = getValues(
      type === "slack" ? "slack_webhook_url" : "discord_webhook_url",
    );
    const isConnected = !!currentUrl;
    const isDiscord = type === "discord";

    return (
      <div
        className={`bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border ${
          isConnected
            ? "border-emerald-200 dark:border-emerald-800/50"
            : "border-gray-200 dark:border-neutral-800"
        } rounded-lg p-6 transition-all duration-300 hover:shadow-lg`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                {title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-neutral-500">
                {description}
              </p>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
              <CheckCircle className="h-3 w-3" />
              {t("common.connected")}
            </div>
          )}
        </div>

        {isDiscord && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-1">
                  {t("workspace.integrations.discord_webhook_help") ||
                    "Usa Webhook URL, no link de invitación"}
                </p>
                <p className="mb-2">
                  ❌ NO: <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">discord.gg/...</code>
                </p>
                <p>
                  ✅ SÍ: <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">discord.com/api/webhooks/...</code>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Input
            id={type === "slack" ? "slack_webhook_url" : "discord_webhook_url"}
            label={t("workspace.integrations.webhook_url")}
            register={register}
            disabled={!canManageWorkspace}
            placeholder={
              type === "slack"
                ? t("workspace.integrations.slack_placeholder")
                : "https://discord.com/api/webhooks/..."
            }
            className="bg-white dark:bg-neutral-900"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              buttonStyle="outline"
              onClick={() => testConnection(type)}
              loading={testing === type}
              disabled={!canManageWorkspace}
              className="gap-2"
            >
              {isConnected
                ? t("workspace.integrations.test_connection")
                : t("common.connect")}
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!workspace) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={Bell}
          label={t("workspace.active_integrations")}
          value={
            [
              workspace?.slack_webhook_url,
              workspace?.discord_webhook_url,
            ].filter(Boolean).length
          }
          color="purple"
        />
        <StatCard
          icon={Activity}
          label={t("workspace.total_notifications")}
          value={activityData?.total || 0}
          color="blue"
        />
      </div>

      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-neutral-800/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab("config")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeSubTab === "config"
              ? "bg-white dark:bg-neutral-900 text-primary-500 shadow-sm"
              : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
          }`}
        >
          {t("workspace.integrations.title")}
        </button>
        <button
          onClick={() => setActiveSubTab("activity")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeSubTab === "activity"
              ? "bg-white dark:bg-neutral-900 text-primary-500 shadow-sm"
              : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
          }`}
        >
          {t("workspace.activity_log")}
        </button>
      </div>

      {activeSubTab === "config" ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("workspace.integrations.communication")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-500">
                  {t("workspace.integrations.communication_description")}
                </p>
              </div>
              {canManageWorkspace && (
                <Button
                  variant="secondary"
                  buttonStyle="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="gap-2"
                >
                  {showAdvanced
                    ? t("common.hide_advanced")
                    : t("common.show_advanced")}
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      showAdvanced ? "rotate-90" : ""
                    }`}
                  />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IntegrationCard
                title="Slack"
                description={t("workspace.integrations.slack_description")}
                icon={Share2}
                type="slack"
                color="from-purple-500 to-pink-500"
              />
              <IntegrationCard
                title="Discord"
                description={t("workspace.integrations.discord_description")}
                icon={Server}
                type="discord"
                color="from-blue-500 to-indigo-500"
              />
            </div>
          </div>

          {showAdvanced && canManageWorkspace && (
            <div className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {t("workspace.integrations.webhook_security")}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-neutral-500">
                    {t("workspace.integrations.webhook_security_description")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("workspace.integrations.webhook_secret")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      {...register("webhook_secret")}
                      disabled={!canManageWorkspace}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white px-4 py-2 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t(
                        "workspace.integrations.secret_placeholder",
                      )}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      buttonStyle="outline"
                      onClick={generateSecret}
                      disabled={!canManageWorkspace}
                      className="gap-2"
                    >
                      <Key className="h-4 w-4" />
                      {t("common.generate")}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-500 mt-2">
                    {t("workspace.integrations.secret_description")}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    loading={isSaving}
                    disabled={!canManageWorkspace}
                  >
                    {t("common.save_changes")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("workspace.activity_log")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-500">
                  {t("workspace.recent_webhook_activity")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="secondary"
                buttonStyle="outline"
                size="lg"
                onClick={() =>
                  fetchActivity(
                    activityData?.current_page || 1,
                    activityData?.per_page || 5,
                  )
                }
                loading={loadingActivity}
                icon={RefreshCw}
                className="gap-2"
              >
                {t("common.refresh")}
              </Button>
            </div>

            <FilterSection
              mode="integrations"
              t={t}
              search={searchFilter}
              setSearch={(value) => handleFilterChange("search", value)}
              statusFilter={statusFilter}
              platformFilter={channelFilter}
              handleFilterChange={handleFilterChange}
            />
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
                {loadingActivity ? (
                  <ActivityLogSkeleton rows={activityData?.per_page || 5} />
                ) : (activityData?.data || []).length > 0 ? (
                  activityData.data.map((log: any) => (
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
                          {log.event_type}
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
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
                  ))
                ) : (
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
            currentPage={activityData?.current_page || 1}
            lastPage={activityData?.last_page || 1}
            total={activityData?.total || 0}
            perPage={activityData?.per_page || 5}
            onPageChange={(page) =>
              fetchActivity(page, activityData?.per_page || 5)
            }
            onPerPageChange={(perPage) => fetchActivity(1, perPage)}
            t={t}
            isLoading={loadingActivity}
          />
        </div>
      )}
    </div>
  );
}
