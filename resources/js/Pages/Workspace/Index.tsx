import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/Components/common/Modern/Button";
import CreateWorkspaceCard from "@/Components/Workspace/CreateWorkspaceCard";
import CreateWorkspaceModal from "@/Components/Workspace/CreateWorkspaceModal";
import WorkspaceCard from "@/Components/Workspace/WorkspaceCard";
import { Plus } from "lucide-react";

export default function Index({
  workspaces,
  roles,
}: {
  workspaces: any[];
  roles: any[];
}) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
              {t("workspace.my_workspaces")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
              {t("workspace.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            buttonStyle="gradient"
            icon={Plus}
            iconPosition="left"
            className="group"
          >
            {t("workspace.create_new")}
          </Button>
        </div>
      }
    >
      <Head title={t("workspace.my_workspaces")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-10 max-w-7xl mx-auto">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            roles={roles}
            currentWorkspaceId={auth.user.current_workspace_id}
            auth={auth}
          />
        ))}

        <CreateWorkspaceCard onClick={() => setShowCreateModal(true)} />
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        t={t}
      />
    </AuthenticatedLayout>
  );
}
