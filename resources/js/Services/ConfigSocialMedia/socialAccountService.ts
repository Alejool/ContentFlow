import type { SocialAccount } from '@/types/ConfigSocialMedia/SocialAccount';
import axios from 'axios';

export const socialAccountService = {
  list: (): Promise<SocialAccount[]> =>
    axios.get('/api/v1/social-accounts').then((r) => r.data.accounts ?? []),
};
