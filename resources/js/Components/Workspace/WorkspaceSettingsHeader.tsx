import WorkspaceInfoBadge from '@/Components/Workspace/WorkspaceInfoBadge';
import { WorkspaceLogo } from '@/Components/Workspace/WorkspaceLogo';
import { Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WorkspaceSettingsHeaderProps {
  workspace: any;
}

export default function WorkspaceSettingsHeader({ workspace }: WorkspaceSettingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col justify-start gap-6 lg:flex-row lg:items-start">
      <div className="flex-1">
        <div className="flex items-center justify-start gap-4">
          <div
            className={`relative h-10 w-10 bg-primary-500 ${!workspace.white_label_logo_url ? 'bg-primary-500' : ''} flex items-center justify-center overflow-hidden rounded-lg text-lg font-bold text-white`}
          >
            {workspace.white_label_logo_url ? (
              <WorkspaceLogo
                src={workspace.white_label_logo_url}
                alt={workspace.name}
                fallback={workspace.name}
              />
            ) : (
              workspace.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-xl">
              {workspace.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {workspace.public ? (
                  <>
                    <Globe className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {t('workspace.public_workspace')}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {t('workspace.private_workspace')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="flex justify-start text-gray-600 dark:text-gray-400">
          {workspace.description || t('workspace.no_description')}
        </p>
      </div>

      <WorkspaceInfoBadge variant="full" />
    </div>
  );
}
