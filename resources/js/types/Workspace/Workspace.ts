import type { User } from '@/types/Workspace/User';

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  photo_url: string | null;
  public: boolean;
  created_at: string;
  updated_at: string;
  projects_count?: number;
  users?: User[];
  pivot?: {
    user_id: number;
    workspace_id: number;
    role_id: number;
  };
}
