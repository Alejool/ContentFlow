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
};
