import StatCard from "@/Components/Workspace/StatCard";
import {
  Activity,
  Clock,
  Database,
  SettingsIcon,
  Share2,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface OverviewTabProps {
  workspace: any;
  auth: any;
  onTabChange: (tab: any) => void;
}

export default function OverviewTab({
  workspace,
  auth,
  onTabChange,
}: OverviewTabProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const quickActions = [
    {
      icon: UserPlus,
      label: t("workspace.quick_actions.invite_members"),
      description: t("workspace.quick_actions.invite_members_description"),
      action: () => onTabChange("members"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Share2,
      label: t("workspace.quick_actions.share_workspace"),
      description: t("workspace.quick_actions.share_workspace_description"),
      action: () => {
        onTabChange("general");
        // Scroll to public invites if possible or just show general
        toast.success(t("workspace.quick_actions.share_workspace_description"));
      },
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: SettingsIcon,
      label: t("workspace.quick_actions.settings"),
      description: t("workspace.quick_actions.settings_description"),
      action: () => onTabChange("general"),
      color: "from-emerald-500 to-green-500",
    },
    {
      icon: Zap,
      label: t("workspace.quick_actions.integrations"),
      description: t("workspace.quick_actions.integrations_description"),
      action: () => onTabChange("integrations"),
      color: "from-amber-500 to-orange-500",
    },
  ];

  const activeIntegrationsCount = [
    workspace.slack_webhook_url,
    workspace.discord_webhook_url,
  ].filter(Boolean).length;

  const workspaceAge = Math.floor(
    (new Date().getTime() - new Date(workspace.created_at).getTime()) /
      (1000 * 60 * 60 * 24 * 30),
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label={t("workspace.stats.total_members")}
          value={workspace.users?.length || 0}
          color="blue"
        />
        <StatCard
          icon={Database}
          label={t("workspace.stats.projects")}
          value={workspace.projects_count || 0}
          color="purple"
        />
        <StatCard
          icon={Activity}
          label={t("workspace.stats.active_integrations")}
          value={activeIntegrationsCount}
          color="green"
        />
        <StatCard
          icon={Clock}
          label={t("workspace.stats.workspace_age")}
          value={`${workspaceAge}m`}
          color="orange"
        />
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {t("workspace.quick_actions.title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              disabled={loading}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-5 text-left transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:-translate-y-1 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {action.label}
              </h4>
              <p className="text-sm text-gray-500 dark:text-neutral-500">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
