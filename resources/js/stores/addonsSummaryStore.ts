import type { AddonsSummaryData } from '@/types/addon';
import axios from 'axios';
import { create } from 'zustand';

interface AddonsSummaryState {
  data: AddonsSummaryData | null;
  loading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
  reset: () => void;
}

export const useAddonsSummaryStore = create<AddonsSummaryState>((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<AddonsSummaryData>('/api/v1/addons/summary');
      set({ data: response.data, loading: false });
    } catch (error: any) {
      console.error('Error fetching addons summary:', error);
      set({
        error: error.response?.data?.message || 'Error al cargar el resumen de addons',
        loading: false,
      });
    }
  },

  reset: () => set({ data: null, loading: false, error: null }),
}));
