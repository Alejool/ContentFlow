import { profileService } from '@/Services/Auth/profileService';
import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  email_verified_at: string | null;
  photo_url?: string | null;
  default_avatar_icon?: string | null;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
  provider?: string | null;
  locale?: string | null;
  country_code?: string | null;
  global_platform_settings?: Record<string, unknown> | null;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  updateProfile: (
    data: Record<string, unknown>,
  ) => Promise<{ success: boolean; message?: string | undefined }>;
  updatePassword: (
    data: Record<string, unknown>,
  ) => Promise<{ success: boolean; message?: string | undefined }>;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as { response?: { data?: { message?: string } } };
  return axiosError.response?.data?.message || fallback;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await profileService.updateProfile<User>(data);
      if (response.success && response.user) {
        set({ user: response.user });
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Failed to update profile') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updatePassword: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await profileService.updatePassword(data);
      return { success: response.success, message: response.message };
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Failed to update password') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
