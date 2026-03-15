import { queryKeys } from '@/lib/queryKeys';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

async function fetchPublicationStatsFn(): Promise<Record<string, number>> {
  const response = await axios.get(route('api.v1.publications.stats'));
  return response.data ?? {};
}

export function useDashboardStats(workspaceId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(workspaceId!),
    queryFn: fetchPublicationStatsFn,
    enabled: !!workspaceId,
    staleTime: 60 * 1000, // 1 min — dashboard stats refresh often
    refetchOnWindowFocus: true,
  });
}
