import axios from "axios";
import { create } from "zustand";

interface LogState {
  logs: any[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  isLoading: boolean;
  error: string | null;

  fetchLogs: (filters?: any, page?: number) => Promise<void>;
  reset: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  pagination: {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  },
  isLoading: false,
  error: null,

  fetchLogs: async (filters = {}, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get("/logs", {
        params: { ...filters, page },
      });
      if (response.data.success) {
        set({
          logs: response.data.logs.data,
          pagination: {
            current_page: response.data.logs.current_page,
            last_page: response.data.logs.last_page,
            total: response.data.logs.total,
            per_page: response.data.logs.per_page,
          },
        });
      }
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to fetch logs",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () =>
    set({
      logs: [],
      pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
      },
      isLoading: false,
      error: null,
    }),
}));
