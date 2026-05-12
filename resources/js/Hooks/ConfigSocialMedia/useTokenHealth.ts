import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export type TokenStatus = 'valid' | 'expiring_soon' | 'expired';

export interface TokenHealthAccount {
  id: number;
  platform: string;
  account_name: string;
  status: TokenStatus;
  /** null when already expired */
  days_remaining: number | null;
}

interface TokenHealthResponse {
  accounts: TokenHealthAccount[];
}

async function fetchTokenHealth(): Promise<TokenHealthResponse> {
  const response = await axios.get('/api/v1/social-accounts/token-health');
  return response.data;
}

/**
 * Fetches the health status of the current workspace's social account tokens.
 * Refreshes every 5 minutes.
 *
 * @returns IDs of accounts that are expired or expiring soon, and the full map.
 */
export function useTokenHealth() {
  const query = useQuery({
    queryKey: ['social-accounts', 'token-health'],
    queryFn: fetchTokenHealth,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Don't throw if missing – gracefully degrade
    retry: 1,
  });

  const accounts = query.data?.accounts ?? [];

  const invalidAccountIds = accounts.filter((a) => a.status === 'expired').map((a) => a.id);

  const expiringSoonAccountIds = accounts
    .filter((a) => a.status === 'expiring_soon')
    .map((a) => a.id);

  const tokenHealthMap: Record<number, TokenHealthAccount> = {};
  for (const account of accounts) {
    tokenHealthMap[account.id] = account;
  }

  return {
    ...query,
    invalidAccountIds,
    expiringSoonAccountIds,
    tokenHealthMap,
    hasIssues: invalidAccountIds.length > 0 || expiringSoonAccountIds.length > 0,
  };
}
