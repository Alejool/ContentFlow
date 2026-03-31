/**
 * Centralized TanStack Query key factory.
 * Using arrays ensures proper cache invalidation hierarchy.
 * e.g. invalidating ['publications'] invalidates all sub-keys.
 */
export const queryKeys = {
  publications: {
    all: ['publications'] as const,
    lists: () => ['publications', 'list'] as const,
    list: (filters: Record<string, unknown>, page: number) =>
      ['publications', 'list', filters, page] as const,
    detail: (id: number) => ['publications', 'detail', id] as const,
    platforms: (id: number) => ['publications', 'platforms', id] as const,
  },

  campaigns: {
    all: ['campaigns'] as const,
    lists: () => ['campaigns', 'list'] as const,
    list: (filters: Record<string, unknown>, page: number) =>
      ['campaigns', 'list', filters, page] as const,
    detail: (id: number) => ['campaigns', 'detail', id] as const,
  },

  notifications: {
    all: ['notifications'] as const,
  },

  approvals: {
    all: ['approvals'] as const,
    pending: (type?: string) => ['approvals', 'pending', type] as const,
    history: (filters?: Record<string, unknown>, page?: number) =>
      ['approvals', 'history', filters, page] as const,
    publicationHistory: (publicationId: number) =>
      ['approvals', 'publication-history', publicationId] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    period: (period: string, workspaceId: number) => ['analytics', period, workspaceId] as const,
  },

  calendar: {
    all: ['calendar'] as const,
    events: (filters?: Record<string, unknown>) => ['calendar', 'events', filters] as const,
  },

  socialAccounts: {
    all: ['social-accounts'] as const,
    capabilities: (accountId?: number | null) =>
      accountId
        ? (['social-accounts', 'capabilities', accountId] as const)
        : (['social-accounts', 'capabilities'] as const),
  },

  logs: {
    all: ['logs'] as const,
    list: (filters: Record<string, unknown>, page: number) =>
      ['logs', 'list', filters, page] as const,
  },

  members: {
    all: ['members'] as const,
    list: (workspaceId: number) => ['members', 'list', workspaceId] as const,
  },

  workflows: {
    all: ['workflows'] as const,
    list: (workspaceId: number) => ['workflows', 'list', workspaceId] as const,
  },

  roles: {
    all: ['roles'] as const,
    list: (workspaceId: number) => ['roles', 'list', workspaceId] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    stats: (workspaceId: number) => ['dashboard', 'stats', workspaceId] as const,
  },

  analyticsData: {
    all: ['analytics-data'] as const,
    period: (period: number, workspaceId: number) =>
      ['analytics-data', 'period', period, workspaceId] as const,
  },

  reels: {
    all: ['reels'] as const,
    list: (filters: Record<string, unknown>) => ['reels', 'list', filters] as const,
  },
} as const;
