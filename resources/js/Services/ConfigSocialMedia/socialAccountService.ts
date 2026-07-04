import type { SocialAccount } from '@/types/ConfigSocialMedia/SocialAccount';
import axios from 'axios';

export const socialAccountService = {
  list: (): Promise<SocialAccount[]> =>
    axios.get('/api/v1/social-accounts').then((r) => r.data.accounts ?? []),

  getAuthUrl: (platform: string): Promise<string | undefined> =>
    axios.get(`/social-accounts/auth-url/${platform}`).then((r) => r.data.auth_url),

  disconnect: (accountId: number): Promise<void> =>
    axios.delete(`/api/v1/social-accounts/${accountId}`).then(() => undefined),

  getPublishingStatus: (accountId: number): Promise<{ has_publishing?: boolean }> =>
    axios
      .get(`/api/v1/social-accounts/${accountId}/publishing-status`)
      .then((r) => r.data ?? {}),
};
