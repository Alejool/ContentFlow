export type Publication = {
  id: number;
  title: string;
  description: string;
  image?: string; // Optional helper for thumbnail
  created_at: string;
  updated_at: string;
  hashtags?: string;
  goal?: string;
  slug?: string;
  scheduled_at?: string;
  status?: "draft" | "published" | "scheduled" | "publishing";
  is_active?: boolean;
  media_files?: MediaFile[];
  scheduled_posts?: ScheduledPost[];
  social_post_logs?: SocialPostLog[];
  campaigns?: Array<{ id: number; name: string; title?: string }>;
  platform_settings?: Record<string, any>;
};

export type ScheduledPost = {
  id: number;
  social_account_id: number;
  scheduled_at: string;
  status: "pending" | "posted" | "failed";
  social_account?: SocialAccount;
  account_name?: string;
  platform?: string;
};

export type SocialPostLog = {
  id: number;
  social_account_id: number;
  status:
    | "published"
    | "failed"
    | "deleted"
    | "pending"
    | "publishing"
    | "success"
    | "orphaned";
  social_account?: SocialAccount;
  platform: string;
  created_at: string;
  updated_at: string;
  account_name?: string;
  error_message?: string;
  content?: string;
  post_url?: string;
  video_url?: string;
  engagement_data?: any;
  publication?: Publication; // For mapped logs
  campaign?: { id: number; name: string }; // For mapped logs
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
  metadata?: {
    thumbnail_url?: string;
    duration?: number;
    width?: number;
    height?: number;
    [key: string]: any;
  };
  derivatives?: Array<{
    id: number;
    derivative_type: string;
    file_type: string;
    file_path: string;
    mime_type?: string;
    [key: string]: any;
  }>;
  pivot?: {
    publication_id: number;
    media_file_id: number;
    order: number;
  };
};
