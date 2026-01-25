export type Publication = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  image?: string;
  created_at: string;
  updated_at: string;
  hashtags?: string;
  goal?: string;
  slug?: string;
  scheduled_at?: string;
  status?:
    | "draft"
    | "published"
    | "scheduled"
    | "publishing"
    | "pending_review"
    | "approved"
    | "rejected";
  is_active?: boolean;
  media_files?: MediaFile[];
  scheduled_posts?: ScheduledPost[];
  social_post_logs?: SocialPostLog[];
  approval_logs?: ApprovalLog[];
  activities?: any[];
  campaigns?: {
    id: number;
    name: string;
    status: string;
    pivot: {
      order: number;
    };
  }[];
  user?: {
    id: number;
    name: string;
    email: string;
    photo_url: string;
  };
  platform_settings?: Record<string, any>;
  approved_by?: number;
  approved_at?: string;
  published_by?: number;
  published_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  rejection_reason?: string;
  publisher?: {
    id: number;
    name: string;
    photo_url: string;
  };
  rejector?: {
    id: number;
    name: string;
    photo_url: string;
  };
  approver?: {
    id: number;
    name: string;
    photo_url: string;
  };
  media_locked_by?: {
    id: number;
    name: string;
    photo_url?: string;
  } | null;
  approval_logs?: ApprovalLog[];
};

export type ApprovalLog = {
  id: number;
  publication_id: number;
  requested_by: number;
  requested_at: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  action: "approved" | "rejected" | null;
  rejection_reason: string | null;
  requester?: {
    id: number;
    name: string;
    photo_url?: string;
  };
  reviewer?: {
    id: number;
    name: string;
    photo_url?: string;
  };
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
  publication?: Publication;
  campaign?: { id: number; name: string };
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
  thumbnail?: {
    id: number;
    file_path: string;
    file_name: string;
    derivative_type: string;
  };
  pivot?: {
    publication_id: number;
    media_file_id: number;
    order: number;
  };
};
