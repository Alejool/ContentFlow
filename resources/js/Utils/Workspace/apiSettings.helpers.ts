import type { ApiToken, TokenMeta } from '@/types/Workspace/apiSettings';

export const PER_PAGE_OPTIONS = [5, 10, 25];

/** Returns a token type label + badge colour */
export function getTokenMeta(token: ApiToken): TokenMeta {
  const isProgrammaticAccess = token.name?.startsWith('api-access:');
  const isRefresh = token.name?.startsWith('api-refresh:');
  const isExpired = token.expires_at ? new Date(token.expires_at) < new Date() : false;

  if (isRefresh) {
    return {
      label: 'API · Refresh',
      labelColor: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
      isExpired,
      isRefreshToken: true,
    };
  }
  if (isProgrammaticAccess) {
    return {
      label: 'API · Access',
      labelColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      isExpired,
      isRefreshToken: false,
    };
  }
  return {
    label: 'Dashboard',
    labelColor: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
    isExpired: false, // dashboard tokens never expire
    isRefreshToken: false,
  };
}
