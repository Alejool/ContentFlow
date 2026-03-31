import { queryKeys } from '@/lib/queryKeys';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface LogsResponse {
  data: any[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function serializeFilters(filters: Record<string, any>): Record<string, any> {
  return Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) acc[key] = value;
      else if (value && !Array.isArray(value) && value !== 'all') acc[key] = value;
      return acc;
    },
    {} as Record<string, any>,
  );
}

async function fetchLogsFn(filters: Record<string, any>, page: number): Promise<LogsResponse> {
  const cleanFilters = serializeFilters(filters);
  const response = await axios.get('/api/v1/logs', {
    params: { ...cleanFilters, page },
    paramsSerializer: {
      indexes: null,
      serialize: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
          } else if (value !== null && value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return searchParams.toString();
      },
    },
  });

  const logs = response.data.logs;
  return {
    data: logs.data ?? [],
    current_page: logs.current_page ?? 1,
    last_page: logs.last_page ?? 1,
    total: logs.total ?? 0,
    per_page: logs.per_page ?? 10,
  };
}

export function useLogs(filters: Record<string, any> = {}, page = 1) {
  return useQuery({
    queryKey: queryKeys.logs.list(filters, page),
    queryFn: () => fetchLogsFn(filters, page),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
