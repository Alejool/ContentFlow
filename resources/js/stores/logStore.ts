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
      // Limpiar filtros vacíos
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          acc[key] = value;
        } else if (value && !Array.isArray(value) && value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      const response = await axios.get("/api/v1/logs", {
        params: { ...cleanFilters, page },
        paramsSerializer: {
          indexes: null,
          serialize: (params) => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(`${key}[]`, String(v)));
              } else if (value !== null && value !== undefined) {
                searchParams.append(key, String(value));
              }
            });
            return searchParams.toString();
          }
        }
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
