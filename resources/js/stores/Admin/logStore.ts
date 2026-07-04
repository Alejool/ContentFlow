import { logService } from '@/Services/Admin/logService';
import { create } from 'zustand';

interface LogState {
  logs: Record<string, unknown>[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  isLoading: boolean;
  error: string | null;

  fetchLogs: (filters?: Record<string, unknown>, page?: number) => Promise<void>;
  reset: () => void;
}

const emptyPagination = {
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: 10,
};

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  pagination: emptyPagination,
  isLoading: false,
  error: null,

  fetchLogs: async (filters = {}, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await logService.list(filters, page);
      if (response.success) {
        set({
          logs: response.logs.data,
          pagination: {
            current_page: response.logs.current_page,
            last_page: response.logs.last_page,
            total: response.logs.total,
            per_page: response.logs.per_page,
          },
        });
      }
    } catch (error) {
      set({ error: (error as Error).message ?? 'Failed to fetch logs' });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () =>
    set({
      logs: [],
      pagination: emptyPagination,
      isLoading: false,
      error: null,
    }),
}));
