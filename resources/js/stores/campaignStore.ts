import axios from "axios";
import { create } from "zustand";
import { useCalendarStore } from "@/stores/calendarStore";

export interface Campaign {
  id: number;
  name: string;
  title?: string;
  description?: string;
  goal?: string;
  budget?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "paused" | "completed";
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
  fetchCampaigns: (filters?: any, page?: number) => Promise<void>;
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
      const params = { ...filters, page };
      const response = await axios.get(route("api.v1.campaigns.index"), {
        params,
      });

      let campaignsData = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 5,
      };

      if (response.data?.campaigns?.data) {
        campaignsData = response.data.campaigns.data;
        paginationData = {
          current_page: response.data.campaigns.current_page || 1,
          last_page: response.data.campaigns.last_page || 1,
          total: response.data.campaigns.total || 0,
          per_page: response.data.campaigns.per_page || 5,
        };
      } else if (Array.isArray(response.data?.campaigns)) {
        campaignsData = response.data.campaigns;
        paginationData.total = campaignsData.length;
      } else if (Array.isArray(response.data?.data)) {
        campaignsData = response.data.data;
        if (response.data.current_page) {
          paginationData = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total,
            per_page: response.data.per_page,
          };
        }
      }

      set({
        campaigns: campaignsData,
        isLoading: false,
        pagination: paginationData,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch campaigns",
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
      await axios.delete(route("api.v1.campaigns.destroy", id));
      get().removeCampaign(id);
      set({ isLoading: false });
      useCalendarStore.getState().fetchEvents();
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to delete campaign",
        isLoading: false,
      });
      return false;
    }
  },

  duplicateCampaign: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        route("api.v1.campaigns.duplicate", id),
      );
      const campaign = response.data?.campaign;
      if (campaign) {
        get().addCampaign(campaign);
      }
      set({ isLoading: false });
      useCalendarStore.getState().fetchEvents();
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to duplicate campaign",
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
