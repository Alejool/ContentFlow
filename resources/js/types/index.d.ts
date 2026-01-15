export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string;
  locale?: string;
  theme?: string;
  global_platform_settings?: Record<string, any>;
}

export type PageProps<
  T extends Record<string, unknown> = Record<string, unknown>
> = T & {
  auth: {
    user: User | null;
  };
};
