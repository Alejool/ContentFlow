import { addonService } from '@/Services/Addons/addonService';
import type { AddonsSummaryData } from '@/types/Addons/addon';
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
      const data = await addonService.getSummary();
      set({ data, loading: false });
    } catch (error) {
      console.error('Error fetching addons summary:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      set({
        error: axiosError.response?.data?.message || 'Error al cargar el resumen de addons',
        loading: false,
      });
    }
  },

  reset: () => set({ data: null, loading: false, error: null }),
}));
