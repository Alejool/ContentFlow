import type { User } from '@/types/common/User';

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
