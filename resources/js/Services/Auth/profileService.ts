import axios from 'axios';

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

  updateTheme: (themeColor: string): Promise<void> =>
    axios.patch('/api/v1/profile/theme', { theme_color: themeColor }).then(() => undefined),
};
