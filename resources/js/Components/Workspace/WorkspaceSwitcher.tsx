import { useForm, usePage } from '@inertiajs/react';
import WorkspaceDropdown from './WorkspaceDropdown';

export default function WorkspaceSwitcher({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const { auth } = usePage().props as any;
  const workspaces = auth?.workspaces || [];
  const current_workspace = auth?.current_workspace || null;
  const { post } = useForm();

  const handleSwitch = (slug: string) => {
    post(route('workspaces.switch', slug));
  };

  if (!current_workspace) return null;

  return (
    <WorkspaceDropdown
      workspaces={workspaces}
      current_workspace={current_workspace}
      isSidebarOpen={isSidebarOpen}
      onSwitch={handleSwitch}
      hasCurrentWorkspace={!!auth.user.current_workspace_id}
      roleLabel={current_workspace.role?.name}
    />
  );
}
