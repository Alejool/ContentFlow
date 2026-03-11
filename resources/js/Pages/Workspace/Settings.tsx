import ApiSettingsTab from "@/Components/Workspace/ApiSettingsTab";
import ApprovalWorkflowsTab from "@/Components/Workspace/ApprovalWorkflowsTab";
import EnterpriseSupportTab from "@/Components/Workspace/EnterpriseSupportTab";
import GeneralSettingsTab from "@/Components/Workspace/GeneralSettingsTab";
import IntegrationsSettingsTab from "@/Components/Workspace/IntegrationsSettingsTab";
import MembersManagement from "@/Components/Workspace/MembersManagement";
import OverviewTab from "@/Components/Workspace/OverviewTab";
import PlanUsageTab from "@/Components/Workspace/PlanUsageTab";
import RolesManagementTab from "@/Components/Workspace/RolesManagementTab";
import SettingsTabs from "@/Components/Workspace/SettingsTabs";
import WhiteLabelSettingsTab from "@/Components/Workspace/WhiteLabelSettingsTab";
import WorkspaceSettingsHeader from "@/Components/Workspace/WorkspaceSettingsHeader";
import AlertCard from "@/Components/common/Modern/AlertCard";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import {
  CheckCircle,
  Key,
  Layout,
  Palette,
  Settings as SettingsIcon,
  Share2,
  Shield,
  Sparkles,
  Users,
  TrendingUp 
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface WorkspaceSettingsProps {
  workspace: any;
  roles: any[];
  auth: any;
  current_workspace?: any;
}

const EMPTY_ROLES: any[] = [];

export default function WorkspaceSettings({
  workspace,
  roles = EMPTY_ROLES,
  auth,
  current_workspace: globalWorkspace,
}: WorkspaceSettingsProps) {
  const { t } = useTranslation();

  const current_workspace = workspace || globalWorkspace;

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab");
  const [activeTab, setActiveTab] = useState<
    | "general"
    | "members"
    | "roles"
    | "integrations"
    | "overview"
    | "usage"
    | "white-label"
    | "api"
    | "support"
    | "approvals"
  >((initialTab as any) || "overview");

  // Cargar el orden de tabs guardado
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    if (typeof window !== "undefined" && current_workspace?.id) {
      const saved = localStorage.getItem(
        `workspace_${current_workspace.id}_tab_order`
      );
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  if (!current_workspace || !roles) {
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

  const planId =
    current_workspace.subscription?.plan?.toLowerCase() ||
    current_workspace.plan?.toLowerCase() ||
    "demo";

  const isEnterprise =
    planId === "enterprise" || current_workspace.features?.white_label;

  const tabs: Array<{
    id: string;
    label: string;
    icon: any;
    locked?: boolean;
    planRequired?: string[];
  }> = [
    {
      id: "overview",
      label: t("workspace.tabs.overview") || "Overview",
      icon: Sparkles,
      // locked: true,
    },
    {
      id: "usage",
      label: "Uso del Plan",
      icon: TrendingUp,
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

  const hasBasicApprovalAccess = [
    "demo",
    "professional",
    "enterprise",
  ].includes(planId);
  const hasAdvancedApprovalAccess = ["enterprise"].includes(planId);

  if (canManageWorkspace && hasAdvancedApprovalAccess) {
    tabs.splice(4, 0, {
      id: "approvals",
      label: "Aprobaciones",
      icon: CheckCircle,
      planRequired: ["enterprise"], // Solo para enterprise
    });
  }

  if (isEnterprise && isOwner) {
    tabs.push(
      {
        id: "white-label",
        label: t("workspace.tabs.white_label") || "White-label",
        icon: Palette,
        planRequired: ["enterprise"], // Solo para enterprise
      },
      {
        id: "api",
        label: t("workspace.tabs.api") || "API Access",
        icon: Key,
        planRequired: ["enterprise"], // Solo para enterprise
      },
      {
        id: "support",
        label: t("workspace.tabs.support") || "Enterprise Support",
        icon: Layout,
        planRequired: ["enterprise"], // Solo para enterprise
      },
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            workspace={current_workspace}
            auth={auth}
            onTabChange={(tab: any) => setActiveTab(tab)}
          />
        );
      case "usage":
        return <PlanUsageTab workspace={current_workspace} />;
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
      case "white-label":
        return (
          <WhiteLabelSettingsTab
            workspace={current_workspace}
            canManageWorkspace={canManageWorkspace}
          />
        );
      case "api":
        return (
          <ApiSettingsTab
            workspace={current_workspace}
            canManageWorkspace={canManageWorkspace}
          />
        );
      case "approvals":
        if (!canManageWorkspace || !hasBasicApprovalAccess) {
          return (
            <OverviewTab
              workspace={current_workspace}
              auth={auth}
              onTabChange={(tab: any) => setActiveTab(tab)}
            />
          );
        }
        return (
          <ApprovalWorkflowsTab
            workspace={current_workspace}
            roles={roles}
            canManageWorkspace={canManageWorkspace}
            hasAdvancedAccess={hasAdvancedApprovalAccess}
          />
        );
      case "support":
        return <EnterpriseSupportTab />;
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
    <AuthenticatedLayout
      header={
          <WorkspaceSettingsHeader workspace={current_workspace} />
      }
    >
      <Head title={`${current_workspace.name} - ${t("workspace.settings")}`} />

      <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <SettingsTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab: any) => setActiveTab(tab)}
          isDraggable={canManageWorkspace} // Solo admins/owners pueden reorganizar
          currentPlan={planId}
          tabOrder={tabOrder}
          onTabOrderChange={(newOrder) => {
            // Actualizar estado local
            setTabOrder(newOrder);
            // Guardar el nuevo orden en localStorage
            localStorage.setItem(
              `workspace_${current_workspace.id}_tab_order`,
              JSON.stringify(newOrder)
            );
          }}
        />

        {activeTab === "integrations" && !isOwner && (
          <AlertCard
            type="warning"
            title={t("workspace.integrations.owner_permissions_required")}
            message={t("workspace.integrations.owner_exclusive_description")}
            className="mb-6"
          />
        )}

        <div className="min-h-[500px]">{renderTabContent()}</div>
      </div>
    </AuthenticatedLayout>
  );
}
