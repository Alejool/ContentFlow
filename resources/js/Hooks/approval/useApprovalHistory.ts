import { queryKeys } from '@/lib/queryKeys';
import { ApprovalRequest } from '@/types/ApprovalTypes';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface ApprovalHistoryFilters {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

interface ApprovalHistoryPage {
  data: ApprovalRequest[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

async function fetchApprovalHistoryFn(
  filters: ApprovalHistoryFilters,
): Promise<ApprovalHistoryPage> {
  const params: Record<string, any> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 12,
  };
  if (filters.status && filters.status !== 'all') params.status = filters.status;
  if (filters.search) params.search = filters.search;

  const response = await axios.get(route('api.v1.approvals.history'), { params });
  const raw = response.data.history ?? response.data.data ?? response.data;

  // API may return paginated object or plain array
  if (Array.isArray(raw)) {
    return {
      data: raw,
      current_page: 1,
      last_page: 1,
      total: raw.length,
      per_page: filters.per_page ?? 12,
    };
  }

  return {
    data: raw.data ?? [],
    current_page: raw.current_page ?? 1,
    last_page: raw.last_page ?? 1,
    total: raw.total ?? 0,
    per_page: raw.per_page ?? filters.per_page ?? 12,
  };
}

async function fetchPublicationApprovalHistoryFn(
  publicationId: number,
): Promise<ApprovalRequest[]> {
  const response = await axios.get(route('api.v1.approvals.publication.history', publicationId));
  const raw = response.data.history ?? response.data.data ?? response.data;
  return Array.isArray(raw) ? raw : (raw.data ?? []);
}

/**
 * Paginated approval history (workspace-wide).
 */
export function useApprovalHistory(filters: ApprovalHistoryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.approvals.history(filters, filters.page),
    queryFn: () => fetchApprovalHistoryFn(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Approval history for a single publication.
 */
export function usePublicationApprovalHistory(publicationId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.approvals.publicationHistory(publicationId!),
    queryFn: () => fetchPublicationApprovalHistoryFn(publicationId!),
    enabled: !!publicationId,
    staleTime: 2 * 60 * 1000,
  });
}
