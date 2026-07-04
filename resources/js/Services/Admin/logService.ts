import { arrayParamsSerializer } from '@/Services/common/http';
import axios from 'axios';

export interface LogsPage {
  data: Record<string, unknown>[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface LogsResponse {
  success: boolean;
  logs: LogsPage;
}

/** Drops empty arrays, falsy values and the 'all' sentinel before querying. */
function cleanFilters(filters: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value;
      } else if (value && !Array.isArray(value) && value !== 'all') {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

export const logService = {
  list: (filters: Record<string, unknown> = {}, page = 1): Promise<LogsResponse> =>
    axios
      .get('/api/v1/logs', {
        params: { ...cleanFilters(filters), page },
        paramsSerializer: arrayParamsSerializer,
      })
      .then((r) => r.data),
};
