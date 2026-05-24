import ApiSettingsTab from '@/Components/Workspace/ApiSettingsTab';
import ApprovalWorkflowsTab from '@/Components/Workspace/ApprovalWorkflowsTab';
import GeneralSettingsTab from '@/Components/Workspace/GeneralSettingsTab';
import IntegrationsSettingsTab from '@/Components/Workspace/IntegrationsSettingsTab';
import MembersManagement from '@/Components/Workspace/MembersManagement';
import OverviewTab from '@/Components/Workspace/OverviewTab';
import PlanUsageTab from '@/Components/Workspace/PlanUsageTab';
import RolesManagementTab from '@/Components/Workspace/RolesManagementTab';
import SettingsTabs from '@/Components/Workspace/SettingsTabs';
import WhiteLabelSettingsTab from '@/Components/Workspace/WhiteLabelSettingsTab';
import WorkspaceSettingsHeader from '@/Components/Workspace/WorkspaceSettingsHeader';
import AlertCard from '@/Components/common/Modern/AlertCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildTabs,
  loadTabOrder,
  resolveApprovalAccess,
  resolveIsOwner,
  resolvePlanId,
  resolveUserRole,
  saveTabOrder,
} from '@/Pages/Workspace/settings.helpers';
import type { SettingsTab, WorkspaceSettingsProps } from '@/Pages/Workspace/settings.types';

const EMPTY_ROLES: NonNullable<WorkspaceSettingsProps['roles']> = [];
const EMPTY_PERMISSIONS: NonNullable<WorkspaceSettingsProps['permissions']> = [];

export default function WorkspaceSettings({
  workspace,
  roles = EMPTY_ROLES,
  permissions = EMPTY_PERMISSIONS,
  auth,
  current_workspace: globalWorkspace,
}: WorkspaceSettingsProps) {
  const { t } = useTranslation();


  const current_workspace = workspace ?? globalWorkspace;

  const initialTab = new URLSearchParams(window.location.search).get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? 'overview');
  const [tabOrder, setTabOrder] = useState<SettingsTab[]>(() =>
    current_workspace ? loadTabOrder(current_workspace.id) : [],
  );

  if (!current_workspace || !roles) {
    return (
      <AuthenticatedLayout>
        <Head title={t('workspace.settings')} />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
          <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
            {t('common.loading')}
          </p>
        </div>
      </AuthenticatedLayout>
    );
  }

  const userRole = resolveUserRole(current_workspace, auth);
  const isOwner = resolveIsOwner(current_workspace, auth, userRole);
  const canManageWorkspace = isOwner || userRole === 'admin';
  const planId = resolvePlanId(current_workspace);
  const isEnterprise = planId === 'enterprise' || !!current_workspace.features?.white_label;
  const hasApprovalAccess = resolveApprovalAccess(current_workspace, planId);

  const tabs = buildTabs({ t, canManageWorkspace, hasApprovalAccess, isEnterprise, isOwner });

  const handleTabChange = (tab: SettingsTab) => setActiveTab(tab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab workspace={current_workspace} onTabChange={handleTabChange} />;

      case 'usage':
        return <PlanUsageTab workspace={current_workspace} />;

      case 'general':
        return (
          <GeneralSettingsTab
            workspace={current_workspace}
            canManageWorkspace={canManageWorkspace}
          />
        );

      case 'members':
        return <MembersManagement roles={roles} workspace={current_workspace} />;

      case 'roles':
        return (
          <RolesManagementTab
            roles={roles}
            permissions={permissions}
            workspace={current_workspace}
            userRole={userRole}
            canManageWorkspace={canManageWorkspace}
          />
        );

      case 'integrations':
        return (
          <IntegrationsSettingsTab
            workspace={current_workspace}
            isOwner={isOwner}
            canManageWorkspace={canManageWorkspace}
          />
        );

      case 'white-label':
        return (
          <WhiteLabelSettingsTab
            workspace={current_workspace}
            canManageWorkspace={canManageWorkspace}
          />
        );

      case 'api':
        return (
          <ApiSettingsTab workspace={current_workspace} canManageWorkspace={canManageWorkspace} />
        );

      case 'approvals':
        if (!canManageWorkspace || !hasApprovalAccess) {
          return <OverviewTab workspace={current_workspace} onTabChange={handleTabChange} />;
        }
        return (
          <ApprovalWorkflowsTab
            workspace={current_workspace}
            roles={roles}
            canManageWorkspace={canManageWorkspace}
            hasAdvancedAccess={hasApprovalAccess}
          />
        );

      default:
        return <OverviewTab workspace={current_workspace} onTabChange={handleTabChange} />;
    }
  };

  return (
    <AuthenticatedLayout header={<WorkspaceSettingsHeader workspace={current_workspace} />}>
      <Head title={`${current_workspace.name} — ${t('workspace.settings')}`} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 ">
        <SettingsTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDraggable={canManageWorkspace}
          currentPlan={planId}
          tabOrder={tabOrder}
          onTabOrderChange={(newOrder) => {
            setTabOrder(newOrder as SettingsTab[]);
            saveTabOrder(current_workspace.id, newOrder as SettingsTab[]);
          }}
        />

        {activeTab === 'integrations' && !isOwner && (
          <AlertCard
            type="warning"
            title={t('workspace.integrations.owner_permissions_required')}
            message={t('workspace.integrations.owner_exclusive_description')}
            className="mb-6"
          />
        )}

        <div className="">{renderTabContent()}</div>
      </div>
    </AuthenticatedLayout>
  );
}
