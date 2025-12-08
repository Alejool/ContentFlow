export type Campaign = {
  id: number;
  title: string;
  description: string;
  image: string;
  created_at: string;
  updated_at: string;
  goal?: string;
  hashtags?: string;
  slug?: string;
  start_date?: string;
  end_date?: string;
  publish_date?: string;
  status?: "draft" | "published";
  is_active?: boolean;
  scheduled_at?: string;
  media_files?: MediaFile[];
  scheduled_posts?: {
    id: number;
    social_account_id: number;
    scheduled_at: string;
    status: "pending" | "posted" | "failed";
    social_account?: SocialAccount;
  }[];
};

export type SocialAccount = {
  id: number;
  platform: string;
  account_id: string;
  account_name: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  is_active: boolean;
  last_failed_at: string;
  failure_count: number;
  account_metadata: any;
};

export type MediaFile = {
  id: number;
  user_id: number;
  campaign_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  pivot: {
    campaign_id: number;
    media_file_id: number;
    order: number;
  };
};
