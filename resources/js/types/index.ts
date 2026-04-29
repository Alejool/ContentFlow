export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  last_login_at?: string | null;
  locale?: string;
  theme?: string;
  theme_color?: string;
  global_platform_settings?: Record<string, unknown>;
  current_workspace_id?: number;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
  auth: {
    user: User | null;
    current_workspace?: {
      id: number;
      name: string;
      white_label_primary_color?: string;
      white_label_favicon_url?: string;
    } | null;
  };
};

export * from './Publication';
