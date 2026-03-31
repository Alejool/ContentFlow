import { queryKeys } from '@/lib/queryKeys';
import { Publication } from '@/types/Publication';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface PublicationsListResponse {
  data: Publication[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

const STATUS_PRIORITY: Record<string, number> = {
  draft: 0,
  rejected: 1,
  failed: 1,
  scheduled: 2,
  approved: 3,
  pending_review: 4,
  publishing: 5,
  published: 6,
};

function serializeParams(filters: Record<string, any>, page: number) {
  const clean = Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (key === 'status') {
        if (value) acc[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        acc[key] = value;
      } else if (value && !Array.isArray(value) && value !== 'all') {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>,
  );
  return { ...clean, page };
}

async function fetchPublicationsFn(
  filters: Record<string, any>,
  page: number,
  useApprovalFilter = false,
): Promise<PublicationsListResponse> {
  const endpoint = useApprovalFilter
    ? route('api.v1.publications.pending-approvals')
    : route('api.v1.publications.index');

  const response = await axios.get(endpoint, {
    params: serializeParams(filters, page),
    paramsSerializer: {
      indexes: null,
      serialize: (params) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => sp.append(`${key}[]`, String(v)));
          } else if (value !== null && value !== undefined) {
            sp.append(key, String(value));
          }
        });
        return sp.toString();
      },
    },
  });

  const data = response.data.publications;
  const items: Publication[] = data.data ?? data ?? [];

  return {
    data: items,
    current_page: data.current_page ?? 1,
    last_page: data.last_page ?? 1,
    total: data.total ?? (Array.isArray(data) ? data.length : 0),
    per_page: data.per_page ?? 12,
  };
}

/**
 * Fetch a paginated, filtered list of publications.
 * Preserves optimistic local status if the server returns a stale/lower-priority status.
 */
export function usePublicationsList(
  filters: Record<string, any> = {},
  page = 1,
  useApprovalFilter = false,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.publications.list(filters, page),
    queryFn: async () => {
      const incoming = await fetchPublicationsFn(filters, page, useApprovalFilter);

      // Preserve optimistic status from any cached page
      const allCached = queryClient.getQueriesData<PublicationsListResponse>({
        queryKey: queryKeys.publications.lists(),
      });
      const cachedMap = new Map<number, Publication>();
      allCached.forEach(([, data]) => {
        data?.data.forEach((p) => cachedMap.set(p.id, p));
      });

      const merged = incoming.data.map((incoming) => {
        const existing = cachedMap.get(incoming.id);
        if (!existing) return incoming;
        const existingPriority = STATUS_PRIORITY[existing.status ?? ''] ?? 0;
        const incomingPriority = STATUS_PRIORITY[incoming.status ?? ''] ?? 0;
        return existingPriority > incomingPriority
          ? { ...incoming, status: existing.status }
          : incoming;
      });

      return { ...incoming, data: merged };
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useDeletePublication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => axios.delete(route('api.v1.publications.destroy', id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useDuplicatePublication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      axios.post(route('api.v1.publications.duplicate', id)).then((r) => r.data?.publication),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useCreatePublication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      axios
        .post(route('api.v1.publications.store'), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.publication as Publication),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useUpdatePublication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => {
      if (!formData.has('_method')) formData.append('_method', 'PUT');
      return axios
        .post(route('api.v1.publications.update', id), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => (r.data.publication ?? r.data.data) as Publication);
    },
    onSuccess: (publication) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
      if (publication?.id) {
        queryClient.setQueryData(queryKeys.publications.detail(publication.id), publication);
      }
    },
  });
}

export interface PublishedPlatformsData {
  published: number[];
  failed: number[];
  publishing: number[];
  scheduled: number[];
  removed: number[];
  retry_info: Record<
    number,
    { retry_count: number; is_retrying: boolean; retry_status: string; is_duplicate: boolean }
  >;
}

export function usePublishedPlatforms(publicationId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.publications.platforms(publicationId ?? 0),
    queryFn: async (): Promise<PublishedPlatformsData> => {
      const response = await axios.get(
        route('api.v1.publications.published-platforms', publicationId),
      );
      return {
        published: response.data.published_platforms ?? [],
        failed: response.data.failed_platforms ?? [],
        publishing: response.data.publishing_platforms ?? [],
        scheduled: response.data.scheduled_platforms ?? [],
        removed: response.data.removed_platforms ?? [],
        retry_info: response.data.retry_info ?? {},
      };
    },
    enabled: !!publicationId,
    staleTime: 30 * 1000,
  });
}
