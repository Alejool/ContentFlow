import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import { Globe, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WorkspaceSettingsHeaderProps {
  workspace: any;
}

export default function WorkspaceSettingsHeader({
  workspace,
}: WorkspaceSettingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {workspace.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  {workspace.public ? (
                    <>
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        {t("workspace.public_workspace")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {t("workspace.private_workspace")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            {workspace.description || t("workspace.no_description")}
          </p>
        </div>

        <WorkspaceInfoBadge variant="full" />
      </div>
    </div>
  );
}
