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
  content_type?: "post" | "reel" | "story" | "poll" | "carousel";
  poll_options?: string[];
  poll_duration_hours?: number;
  status?:
    | "draft"
    | "published"
    | "scheduled"
    | "publishing"
    | "processing"
    | "pending_review"
    | "approved"
    | "rejected"
    | "failed"
    | "retrying";
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
  publish_date?: string;
  rejected_by?: number;
  rejected_at?: string;
  rejection_reason?: string;
  workspace?: {
    id: number;
    name: string;
  };
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
  current_approval_step_id?: number | null;
  current_approval_step?: {
    level_number: number;
    id: number;
    name: string;
    step_order: number;
    workflow?: {
      id: number;
      name: string;
      steps?: any[];
    };
  };
  approval_logs?: ApprovalLog[];
  platform_status_summary?: Record<
    string,
    {
      platform: string;
      status:
        | "published"
        | "failed"
        | "pending"
        | "publishing"
        | "success"
        | "orphaned";
      published_at?: string;
      error?: string;
      url?: string;
      account_name?: string;
      account_id?: string;
      is_current_account?: boolean;
      can_unpublish?: boolean;
    }
  >;
  is_recurring?: boolean;
  recurrence_type?: "daily" | "weekly" | "monthly" | "yearly";
  recurrence_interval?: number;
  recurrence_days?: number[];
  recurrence_end_date?: string;
  recurrence_accounts?: number[];
  recurrence_settings?: {
    id: number;
    publication_id: number;
    recurrence_type: "daily" | "weekly" | "monthly" | "yearly";
    recurrence_interval: number;
    recurrence_days: number[] | null;
    recurrence_end_date: string | null;
    recurrence_accounts: number[] | null;
    created_at: string;
    updated_at: string;
  };
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
  current_step_id?: number | null;
  current_step?: {
    id: number;
    name: string;
    step_order: number;
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
