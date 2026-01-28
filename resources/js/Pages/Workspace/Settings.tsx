import GeneralSettingsTab from "@/Components/Workspace/GeneralSettingsTab";
import IntegrationsSettingsTab from "@/Components/Workspace/IntegrationsSettingsTab";
import MembersManagement from "@/Components/Workspace/MembersManagement";
import OverviewTab from "@/Components/Workspace/OverviewTab";
import RolesManagementTab from "@/Components/Workspace/RolesManagementTab";
import SettingsTabs from "@/Components/Workspace/SettingsTabs";
import WorkspaceSettingsHeader from "@/Components/Workspace/WorkspaceSettingsHeader";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import {
  AlertCircle,
  Settings as SettingsIcon,
  Share2,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface WorkspaceSettingsProps {
  workspace: any;
  roles: any[];
  auth: any;
  current_workspace?: any;
}

export default function WorkspaceSettings({
  workspace,
  roles = [],
  auth,
  current_workspace: globalWorkspace,
}: WorkspaceSettingsProps) {
  const { t } = useTranslation();

  const current_workspace = workspace || globalWorkspace;

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab");
  const [activeTab, setActiveTab] = useState<
    "general" | "members" | "roles" | "integrations" | "overview"
  >((initialTab as any) || "overview");

  // DEBUG: Verifica los datos recibidos
  console.log("Datos recibidos:", {
    workspace: current_workspace,
    roles,
    auth,
    hasWorkspace: !!current_workspace,
    hasRoles: !!roles,
    hasAuth: !!auth,
  });

  if (!current_workspace || !roles) {
    console.log("Faltan datos:", {
      workspace: current_workspace,
      roles,
    });

    return (
      <AuthenticatedLayout>
        <Head title={t("workspace.settings")} />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-neutral-300">
            {t("common.loading")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Cargando configuración del workspace...
          </p>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
            <p>Debug info:</p>
            <p>Workspace: {current_workspace ? "✓" : "✗"}</p>
            <p>Roles: {roles ? "✓" : "✗"}</p>
            <p>Auth: {auth ? "✓" : "✗"}</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Encuentra el usuario actual en el workspace
  const currentUser = current_workspace.users
    ? Array.isArray(current_workspace.users)
      ? current_workspace.users.find(
          (u: any) => Number(u.id) === Number(auth.user.id),
        )
      : Object.values(current_workspace.users).find(
          (u: any) => Number(u.id) === Number(auth.user.id),
        )
    : null;

  const userRole =
    currentUser?.pivot?.role?.slug || currentUser?.role?.slug || "member";
  const isOwner =
    Number(current_workspace.created_by) === Number(auth.user.id) ||
    userRole === "owner";

  const canManageWorkspace = isOwner || userRole === "admin";

  const tabs = [
    {
      id: "overview",
      label: t("workspace.tabs.overview") || "Overview",
      icon: Sparkles,
    },
    {
      id: "general",
      label: t("workspace.tabs.general") || "General",
      icon: SettingsIcon,
    },
    {
      id: "members",
      label: t("workspace.tabs.members") || "Members",
      icon: Users,
    },
    {
      id: "roles",
      label: t("workspace.tabs.roles") || "Roles",
      icon: Shield,
    },
    {
      id: "integrations",
      label: t("workspace.tabs.integrations") || "Integrations",
      icon: Share2,
    },
  ];

  const renderTabContent = () => {
    console.log("Renderizando tab:", activeTab, {
      workspace: current_workspace,
      canManageWorkspace,
    });

    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            workspace={current_workspace}
            auth={auth}
            onTabChange={(tab: any) => setActiveTab(tab)}
          />
        );
      case "general":
        return (
          <GeneralSettingsTab
            workspace={current_workspace}
            canManageWorkspace={canManageWorkspace}
          />
        );
      case "members":
        return (
          <MembersManagement roles={roles} workspace={current_workspace} />
        );
      case "roles":
        return (
          <RolesManagementTab
            roles={roles}
            workspace={current_workspace}
            userRole={userRole}
            canManageWorkspace={canManageWorkspace}
          />
        );
      case "integrations":
        return (
          <IntegrationsSettingsTab
            workspace={current_workspace}
            isOwner={isOwner}
            canManageWorkspace={canManageWorkspace}
          />
        );
      default:
        return (
          <OverviewTab
            workspace={current_workspace}
            auth={auth}
            onTabChange={(tab: any) => setActiveTab(tab)}
          />
        );
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${current_workspace.name} - ${t("workspace.settings")}`} />

      <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <WorkspaceSettingsHeader workspace={current_workspace} />

        <SettingsTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab: any) => setActiveTab(tab)}
        />

        {activeTab === "integrations" && !isOwner && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  Permisos de propietario requeridos
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Solo los propietarios del workspace pueden gestionar
                  integraciones.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-[500px]">{renderTabContent()}</div>
      </div>
    </AuthenticatedLayout>
  );
}
