export interface Workspace {
  id: number | string;
  name: string;
  description: string | null;
  public: boolean;
  allow_public_invites: boolean;
  created_by: number | string;
}

export interface GeneralSettingsTabProps {
  workspace: Workspace;
  canManageWorkspace?: boolean | undefined;
}

export type SettingsFormData = {
  name: string;
  description?: string | undefined;
  public?: boolean | undefined;
  allow_public_invites?: boolean | undefined;
  timezone?: string | undefined;
};
