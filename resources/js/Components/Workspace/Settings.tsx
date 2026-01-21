import MembersManagement from "@/Components/Workspace/MembersManagement";
import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  Info,
  Key,
  Lock,
  Settings as SettingsIcon,
  Share2,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface WorkspaceSettingsProps {
  roles: any[];
  workspace: any;
}

const getSettingsSchema = (t: any) =>
  z.object({
    name: z
      .string()
      .min(
        1,
        t("workspace.invite_modal.validation.nameRequired") ||
          "Workspace name is required",
      )
      .max(255),
    description: z.string().max(1000).optional().or(z.literal("")),
  });

type SettingsFormData = {
  name: string;
  description?: string;
};

const StatCard = ({ icon: Icon, label, value, trend, color = "blue" }: any) => {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-pink-500",
    green: "from-emerald-500 to-green-500",
    orange: "from-amber-500 to-orange-500",
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:border-gray-300 dark:hover:border-neutral-700">
      <div className="flex items-start justify-between">
        <div>
          <div
            className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-3`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-500 font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function WorkspaceSettings({
  roles = [],
  workspace,
}: WorkspaceSettingsProps) {
  const { t } = useTranslation();
  const { current_workspace: globalWorkspace, auth } = usePage().props as any;
  const current_workspace = workspace || globalWorkspace;

  if (!current_workspace) {
    return (
      <AuthenticatedLayout>
        <Head title={t("workspace.settings")} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
          <div className="h-16 w-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full flex items-center justify-center mb-4">
            <SettingsIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-neutral-300">
            {t("common.loading")}
          </p>
        </div>
      </AuthenticatedLayout>
    );
  }

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab");
  const [activeTab, setActiveTab] = useState<
    "general" | "members" | "roles" | "integrations"
  >((initialTab as any) || "general");

  const currentUser = current_workspace.users
    ? Array.isArray(current_workspace.users)
      ? current_workspace.users.find(
          (u: any) => Number(u.id) === Number(auth.user.id),
        )
      : Object.values(current_workspace.users).find(
          (u: any) => Number(u.id) === Number(auth.user.id),
        )
    : null;

  const userRole = currentUser?.pivot?.role?.slug || currentUser?.role?.slug;
  const isOwner =
    Number(current_workspace.created_by) === Number(auth.user.id) ||
    userRole === "owner";

  const canManageWorkspace = isOwner || userRole === "admin";

  const GeneralSettings = () => {
    const [isSaving, setIsSaving] = useState(false);
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<SettingsFormData>({
      resolver: zodResolver(getSettingsSchema(t)),
      defaultValues: {
        name: current_workspace.name,
        description: current_workspace.description || "",
      },
    });

    const onSubmit = (data: SettingsFormData) => {
      setIsSaving(true);
      router.put(route("workspaces.update", current_workspace.id), data, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(t("workspace.messages.update_success"));
          setIsSaving(false);
        },
        onError: () => setIsSaving(false),
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("workspace.general_settings")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-500">
                {t("workspace.manage_general_settings")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Input
                  id="name"
                  label={t("workspace.name")}
                  register={register}
                  error={errors.name?.message}
                  required
                  className="bg-white dark:bg-neutral-900"
                  placeholder={t("workspace.name_placeholder")}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("workspace.description")}
                  </label>
                  <textarea
                    {...register("description")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors px-4 py-3 min-h-[120px]"
                    rows={4}
                    placeholder={t("workspace.description_placeholder")}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary-500" />
                    {t("workspace.visibility")}
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            current_workspace.public
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {current_workspace.public ? (
                            <Globe className="h-5 w-5" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {current_workspace.public
                              ? t("workspace.public")
                              : t("workspace.private")}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-neutral-500">
                            {current_workspace.public
                              ? t("workspace.public_description")
                              : t("workspace.private_description")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-neutral-950 border border-blue-100 dark:border-blue-800/30 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Info className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {t("workspace.workspace_id")}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-300 truncate">
                      {current_workspace.id}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(current_workspace.id);
                        toast.success(t("workspace.id_copied"));
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      title={t("workspace.copy_id")}
                    >
                      <Copy className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-500 mt-2">
                    {t("workspace.id_description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-neutral-800">
              <Button
                type="submit"
                loading={isSaving}
                disabled={!canManageWorkspace}
                className="px-8"
              >
                {isSaving ? t("workspace.saving") : t("workspace.save_changes")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const IntegrationsSettings = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { register, handleSubmit, setValue, getValues } = useForm({
      defaultValues: {
        slack_webhook_url: current_workspace.slack_webhook_url || "",
        discord_webhook_url: current_workspace.discord_webhook_url || "",
        webhook_secret: current_workspace.webhook_secret || "",
      },
    });

    const generateSecret = () => {
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setValue("webhook_secret", secret);
      toast.success(t("workspace.secret_generated"));
    };

    const fetchActivity = async () => {
      try {
        setLoadingActivity(true);
        const response = await axios.get(
          route("api.workspaces.activity", current_workspace.id),
        );
        setActivity(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch activity", error);
      } finally {
        setLoadingActivity(false);
      }
    };

    const onSubmit = (data: any) => {
      setIsSaving(true);
      router.put(route("workspaces.update", current_workspace.id), data, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(t("workspace.integrations.messages.success"));
          setIsSaving(false);
        },
        onError: () => setIsSaving(false),
      });
    };

    const testConnection = async (type: "slack" | "discord") => {
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
        const response = await axios.post(
          route("api.workspaces.webhooks.test", {
            workspace: current_workspace.id,
          }),
          {
            type,
            url: currentUrl,
          },
        );
        toast.success(t("workspace.integrations.messages.test_success"));
        fetchActivity();
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
      fetchActivity();
    }, []);

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

      return (
        <div
          className={`bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border ${
            isConnected
              ? "border-emerald-200 dark:border-emerald-800/50"
              : "border-gray-200 dark:border-neutral-800"
          } rounded-2xl p-6 transition-all duration-300 hover:shadow-lg`}
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
                {t("workspace.integrations.connected", {
                  defaultValue: "Connected",
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Input
              id={
                type === "slack" ? "slack_webhook_url" : "discord_webhook_url"
              }
              label={t("workspace.integrations.webhook_url", {
                defaultValue: "Webhook URL",
              })}
              register={register}
              placeholder={
                type === "slack"
                  ? "https://hooks.slack.com/services/..."
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
                className="gap-2"
              >
                {isConnected
                  ? t("workspace.integrations.test_connection")
                  : t("workspace.integrations.connect", {
                      defaultValue: "Connect",
                    })}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            icon={Bell}
            label={t("workspace.active_integrations")}
            value={activity.filter((a) => a.success).length}
            color="purple"
          />
          <StatCard
            icon={Activity}
            label={t("workspace.total_notifications")}
            value={activity.length}
            color="blue"
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("workspace.communication")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-500">
                {t("workspace.communication_description")}
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
                  ? t("workspace.hide_advanced", {
                      defaultValue: "Hide Advanced",
                    })
                  : t("workspace.show_advanced", {
                      defaultValue: "Show Advanced",
                    })}
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IntegrationCard
              title="Slack"
              description={t("workspace.slack_description")}
              icon={Share2}
              type="slack"
              color="from-purple-500 to-pink-500"
            />
            <IntegrationCard
              title="Discord"
              description={t("workspace.discord_description")}
              icon={Bell}
              type="discord"
              color="from-blue-500 to-indigo-500"
            />
          </div>
        </div>

        {showAdvanced && canManageWorkspace && (
          <div className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {t("workspace.webhook_security")}
                </h4>
                <p className="text-sm text-gray-500 dark:text-neutral-500">
                  {t("workspace.webhook_security_description")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("workspace.webhook_secret")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    {...register("webhook_secret")}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white px-4 py-2 font-mono text-sm"
                    placeholder={t(
                      "workspace.integrations.secret_placeholder",
                      {
                        defaultValue:
                          "Generate a secret for webhook verification",
                      },
                    )}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    buttonStyle="outline"
                    onClick={generateSecret}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    {t("workspace.generate", { defaultValue: "Generate" })}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-500 mt-2">
                  {t("workspace.secret_description")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              {t("workspace.activity_log")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
              {t("workspace.recent_webhook_activity")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                <thead className="bg-gray-50 dark:bg-neutral-900/50">
                  <tr>
                    {[
                      t("workspace.time"),
                      t("workspace.channel"),
                      t("workspace.event"),
                      t("workspace.activity.status"),
                      t("workspace.response"),
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
                  {activity.map((log) => (
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
                              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                        {log.message && (
                          <div className="text-xs text-gray-500 dark:text-neutral-500 truncate max-w-[200px]">
                            {log.message}
                          </div>
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
                          {log.success
                            ? t("workspace.activity.sent", {
                                defaultValue: "Sent",
                              })
                            : t("workspace.activity.failed", {
                                defaultValue: "Failed",
                              })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-500 dark:text-neutral-500">
                          {log.response_code || "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activity.length === 0 && !loadingActivity && (
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
                  {loadingActivity && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500"></div>
                          <span className="text-sm text-gray-500">
                            {t("workspace.loading")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {activity.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-neutral-500">
                  {t("workspace.showing_activities", {
                    count: activity.length,
                  })}
                </p>
                <Button
                  variant="secondary"
                  buttonStyle="outline"
                  size="sm"
                  onClick={fetchActivity}
                  loading={loadingActivity}
                >
                  {t("workspace.refresh", { defaultValue: "Refresh" })}
                </Button>
              </div>
            </div>
          )}
        </div>

        {canManageWorkspace && (
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSaving}
              className="px-8"
            >
              {t("workspace.integrations.save_integrations")}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const RolesManagement = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("workspace.roles_management.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {t("workspace.roles_management.description")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {roles.map((role) => {
            const isCurrentRole = userRole === role.slug;
            const memberCount =
              current_workspace.users?.filter(
                (u: any) => u.pivot?.role_id === role.id,
              ).length || 0;

            return (
              <div
                key={role.id}
                className={`border rounded-lg p-5 transition-all duration-300 hover:shadow-lg ${
                  isCurrentRole
                    ? "border-primary-300 dark:border-primary-700 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-neutral-950"
                    : "border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        role.slug === "owner"
                          ? "bg-gradient-to-br from-amber-500 to-orange-500"
                          : role.slug === "admin"
                            ? "bg-gradient-to-br from-purple-500 to-pink-500"
                            : role.slug === "member"
                              ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                              : "bg-gradient-to-br from-gray-500 to-slate-500"
                      }`}
                    >
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {role.name}
                        {isCurrentRole && (
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold rounded-full">
                            {t("workspace.your_role")}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-neutral-500">
                        {memberCount} {t("workspace.members_count")}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 text-xs font-mono rounded">
                    {role.slug}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
                  {role.description || t("workspace.no_description")}
                </p>

                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                    {t("workspace.key_permissions")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.slice(0, 4).map((permission: any) => (
                      <div
                        key={permission.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 shadow-sm"
                        title={permission.description}
                      >
                        {permission.name}
                      </div>
                    ))}
                    {role.permissions && role.permissions.length > 4 && (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400">
                        +{role.permissions.length - 4} {t("workspace.more")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!canManageWorkspace && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  {t("workspace.permissions_required")}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t("workspace.owner_admin_required")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, active }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-lg transition-all duration-300 ${
        active === id
          ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25"
          : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${active === id ? "text-white" : "text-gray-500 dark:text-neutral-400"}`}
      />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <AuthenticatedLayout>
      <Head title={`${current_workspace.name} - ${t("workspace.settings")}`} />

      <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {current_workspace.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {current_workspace.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      {current_workspace.public ? (
                        <>
                          <Globe className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            {t("workspace.public")}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {t("workspace.private")}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="h-4 w-px bg-gray-200 dark:bg-neutral-700"></div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-neutral-400">
                        {current_workspace.users?.length || 0}{" "}
                        {t("workspace.members")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                {current_workspace.description || t("workspace.no_description")}
              </p>
            </div>

            <WorkspaceInfoBadge variant="full" />
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "general",
                label: t("workspace.tabs.general"),
                icon: SettingsIcon,
              },
              {
                id: "members",
                label: t("workspace.tabs.members"),
                icon: Users,
              },
              {
                id: "roles",
                label: t("workspace.tabs.roles"),
                icon: Shield,
              },
              {
                id: "integrations",
                label: t("workspace.tabs.integrations"),
                icon: Share2,
              },
            ].map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                active={activeTab}
              />
            ))}
          </div>
        </div>

        {/* Integrations Alert */}
        {activeTab === "integrations" && !isOwner && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  {t("workspace.integrations.owner_note_title")}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t("workspace.integrations.owner_note")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === "general" && <GeneralSettings />}
          {activeTab === "members" && (
            <MembersManagement roles={roles} workspace={current_workspace} />
          )}
          {activeTab === "roles" && <RolesManagement />}
          {activeTab === "integrations" && <IntegrationsSettings />}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
