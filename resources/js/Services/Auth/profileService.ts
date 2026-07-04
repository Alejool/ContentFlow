import axios from 'axios';

export interface AvatarResponse {
  success: boolean;
  message?: string;
  user?: { photo_url?: string | null; [key: string]: unknown };
}

export interface ProfileResponse<TUser = unknown> {
  success: boolean;
  message?: string;
  user?: TUser;
}

export const profileService = {
  updateProfile: <TUser = unknown>(data: Record<string, unknown>): Promise<ProfileResponse<TUser>> =>
    axios.patch('/api/v1/profile', data).then((r) => r.data),

  updatePassword: (data: Record<string, unknown>): Promise<ProfileResponse> =>
    axios.put('/api/v1/profile/password', data).then((r) => r.data),

  updateLocale: (locale: string): Promise<void> =>
    axios.patch('/settings/locale', { locale }).then(() => undefined),

  deleteAccount: (data: Record<string, unknown>): Promise<void> =>
    axios.delete('/profile', { data }).then(() => undefined),

  getConnectedAccounts: <TAccount = unknown>(): Promise<TAccount[]> =>
    axios.get('/social-accounts').then((r) => r.data?.accounts ?? []),

  updateTheme: (themeColor: string): Promise<ProfileResponse> =>
    axios.patch('/api/v1/profile/theme', { theme_color: themeColor }).then((r) => r.data),

  uploadAvatar: (formData: FormData): Promise<AvatarResponse> =>
    axios
      .post('/api/v1/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  deleteAvatar: (): Promise<AvatarResponse> =>
    axios.delete('/api/v1/profile/avatar').then((r) => r.data),

  updateSocialSettings: (settings: Record<string, unknown>): Promise<void> =>
    axios.patch('/api/v1/profile/social-settings', { settings }).then(() => undefined),

  resendEmailVerification: (): Promise<void> =>
    axios.post('/email/verification-notification').then(() => undefined),
};
