import { publicationService } from '@/Services/Publications/publicationService';
import { useCalendarStore } from '@/stores/Calendar/calendarStore';
import { useContentPaginationStore } from '@/stores/Content/contentPaginationStore';
import { create } from 'zustand';

export interface Campaign {
  id: number;
  name: string;
  title?: string;
  description?: string;
  goal?: string;
  budget?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'paused' | 'completed';
  created_at?: string;
  updated_at?: string;
}

interface CampaignState {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  fetchCampaigns: (filters?: Record<string, unknown>, page?: number) => Promise<void>;
  getCampaignById: (id: number) => Campaign | undefined;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: number, campaign: Partial<Campaign>) => void;
  removeCampaign: (id: number) => void;
  deleteCampaign: (id: number) => Promise<boolean>;
  duplicateCampaign: (id: number) => Promise<boolean>;
  clearPageData: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  isLoading: false,
  error: null,

  pagination: {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 5,
  },

  fetchCampaigns: async (filters = {}, page = 1) => {
    set({ isLoading: true, error: null });
    get().clearPageData();

    try {
      const response = await publicationService.listCampaigns({ ...filters, page });

      let campaignsData = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 5,
      };

      if (response?.campaigns?.data) {
        campaignsData = response.campaigns.data;
        paginationData = {
          current_page: response.campaigns.current_page || 1,
          last_page: response.campaigns.last_page || 1,
          total: response.campaigns.total || 0,
          per_page: response.campaigns.per_page || 5,
        };
      } else if (Array.isArray(response?.campaigns)) {
        campaignsData = response.campaigns;
        paginationData.total = campaignsData.length;
      } else if (Array.isArray(response?.data)) {
        campaignsData = response.data;
        if (response.current_page) {
          paginationData = {
            current_page: response.current_page,
            last_page: response.last_page,
            total: response.total,
            per_page: response.per_page,
          };
        }
      }

      set({
        campaigns: campaignsData,
        isLoading: false,
        pagination: paginationData,
      });
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch campaigns',
        isLoading: false,
      });
    }
  },

  getCampaignById: (id: number) => {
    return get().campaigns.find((campaign) => campaign.id === id);
  },

  addCampaign: (campaign: Campaign) => {
    set((state) => ({
      campaigns: [...state.campaigns, campaign],
    }));
  },

  updateCampaign: (id: number, updatedCampaign: Partial<Campaign>) => {
    set((state) => ({
      campaigns: state.campaigns.map((campaign) =>
        campaign.id === id ? { ...campaign, ...updatedCampaign } : campaign,
      ),
    }));
  },

  removeCampaign: (id: number) => {
    set((state) => ({
      campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
    }));
  },

  deleteCampaign: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await publicationService.deleteCampaign(id);
      get().removeCampaign(id);
      set({ isLoading: false });
      useCalendarStore.getState().fetchEvents();
      useContentPaginationStore.getState().resetToFirstPage();
      return true;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      set({
        error: e.response?.data?.message ?? 'Failed to delete campaign',
        isLoading: false,
      });
      return false;
    }
  },

  duplicateCampaign: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const campaign = await publicationService.duplicateCampaign(id);
      if (campaign) {
        get().addCampaign(campaign);
      }
      set({ isLoading: false });
      useCalendarStore.getState().fetchEvents();
      useContentPaginationStore.getState().resetToFirstPage();
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message ?? 'Failed to duplicate campaign',
        isLoading: false,
      });
      return false;
    }
  },

  clearPageData: () =>
    set({
      campaigns: [],
    }),
}));
