import axios from "axios";
import { create } from "zustand";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  email_verified_at: string | null;
  photo_url?: string | null;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
  provider?: string | null;
  locale?: string | null;
  country_code?: string | null;
  global_platform_settings?: Record<string, any> | null;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  updateProfile: (data: any) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (
    data: any
  ) => Promise<{ success: boolean; message?: string }>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.patch("/profile", data);
      if (response.data.success) {
        set({ user: response.data.user });
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updatePassword: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put("/profile/password", data);
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update password";
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
