export type Publication = {
  id: number;
  title: string;
  description: string;
  image?: string; // Optional helper for thumbnail
  created_at: string;
  updated_at: string;
  hashtags?: string;
  slug?: string;
  scheduled_at?: string;
  status?: "draft" | "published" | "scheduled";
  is_active?: boolean;
  media_files?: MediaFile[];
  scheduled_posts?: ScheduledPost[];
  campaigns?: Array<{ id: number; name: string; title?: string }>;
};

export type ScheduledPost = {
  id: number;
  social_account_id: number;
  scheduled_at: string;
  status: "pending" | "posted" | "failed";
  social_account?: SocialAccount;
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
  publication_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  pivot?: {
    publication_id: number;
    media_file_id: number;
    order: number;
  };
};
