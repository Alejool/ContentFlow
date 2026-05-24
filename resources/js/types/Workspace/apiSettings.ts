export interface ApiToken {
  id: number;
  name: string;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface TokenMeta {
  label: string;
  labelColor: string;
  isExpired: boolean;
  isRefreshToken: boolean;
}

export interface ApiSettingsTabProps {
  workspace: {
    id: number | string;
    slug: string;
    [key: string]: unknown;
  };
  canManageWorkspace: boolean;
}

export interface ApiTokenForm {
  name: string;
}
