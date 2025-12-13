import axios from "axios";
import { create } from "zustand";

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
  fetchCampaigns: () => Promise<void>;
  getCampaignById: (id: number) => Campaign | undefined;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: number, campaign: Partial<Campaign>) => void;
  removeCampaign: (id: number) => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get("/campaigns");
      let campaignsData = [];
      if (
        response.data?.campaigns?.data &&
        Array.isArray(response.data.campaigns.data)
      ) {
        campaignsData = response.data.campaigns.data;
      } else if (Array.isArray(response.data?.campaigns)) {
        campaignsData = response.data.campaigns;
      } else if (Array.isArray(response.data?.data)) {
        campaignsData = response.data.data;
      }
      set({ campaigns: campaignsData, isLoading: false });
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
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
        campaign.id === id ? { ...campaign, ...updatedCampaign } : campaign
      ),
    }));
  },

  removeCampaign: (id: number) => {
    set((state) => ({
      campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
    }));
  },
}));
