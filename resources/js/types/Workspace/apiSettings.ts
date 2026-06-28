// ─── Token scope definitions (mirrors app/Constants/ApiScopes.php) ────────────

export type ApiScopeKey =
  | 'publications:read' | 'publications:create' | 'publications:update'
  | 'publications:delete' | 'publications:publish'
  | 'campaigns:read' | 'campaigns:create' | 'campaigns:update' | 'campaigns:delete'
  | 'social:read' | 'social:manage'
  | 'calendar:read' | 'calendar:manage'
  | 'analytics:read'
  | 'approvals:read' | 'approvals:manage'
  | 'media:read' | 'media:upload' | 'media:delete'
  | 'workspace:read' | 'workspace:manage'
  | 'ai:use'
  | 'webhooks:read' | 'webhooks:manage'
  | '*';

export interface ApiScopeGroup {
  label: string;
  scopes: Record<string, string>; // scope_key → description
}

export interface ApiScopeGroups {
  [group: string]: ApiScopeGroup;
}

// ─── Token ────────────────────────────────────────────────────────────────────

export interface ApiToken {
  id: number;
  name: string;
  abilities: ApiScopeKey[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  token_type?: 'dashboard' | 'programmatic';
  never_expires?: boolean;
}

export interface TokenMeta {
  label: string;
  labelColor: string;
  isExpired: boolean;
  isRefreshToken: boolean;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export interface ApiTokenForm {
  name: string;
  abilities: ApiScopeKey[];
}

// ─── Component props ──────────────────────────────────────────────────────────

export interface ApiSettingsTabProps {
  workspace: {
    id: number | string;
    slug: string;
    [key: string]: unknown;
  };
  canManageWorkspace: boolean;
}
