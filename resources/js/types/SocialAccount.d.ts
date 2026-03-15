export interface SocialAccount {
  id: number;
  platform: string;
  account_id: string;
  account_name?: string;
  is_active: boolean;
  account_metadata?: {
    avatar?: string;
    username?: string;
    [key: string]: unknown;
  };
  user?: {
    id: number;
    name: string;
  };
}
