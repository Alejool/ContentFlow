/**
 * Centralized TanStack Query key factory.
 * Using arrays ensures proper cache invalidation hierarchy.
 * e.g. invalidating ['publications'] invalidates all sub-keys.
 */
export const queryKeys = {
  publications: {
    all: ['publications'] as const,
    lists: () => ['publications', 'list'] as const,
    list: (filters: Record<string, any>, page: number) =>
      ['publications', 'list', filters, page] as const,
    detail: (id: number) => ['publications', 'detail', id] as const,
    platforms: (id: number) => ['publications', 'platforms', id] as const,
  },

  campaigns: {
    all: ['campaigns'] as const,
    lists: () => ['campaigns', 'list'] as const,
    list: (filters: Record<string, any>, page: number) =>
      ['campaigns', 'list', filters, page] as const,
    detail: (id: number) => ['campaigns', 'detail', id] as const,
  },

  notifications: {
    all: ['notifications'] as const,
  },

  approvals: {
    all: ['approvals'] as const,
    pending: (type?: string) => ['approvals', 'pending', type] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    period: (period: string, workspaceId: number) => ['analytics', period, workspaceId] as const,
  },

  calendar: {
    all: ['calendar'] as const,
    events: (filters?: Record<string, any>) => ['calendar', 'events', filters] as const,
  },
} as const;
