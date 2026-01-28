import { Publication } from "./Publication";

export type Campaign = {
  id: number;
  name: string;
  title?: string;
  description: string;
  goal?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status?: "active" | "paused" | "completed" | "draft";
  created_at: string;
  updated_at: string;
  publications?: Publication[];
  user?: {
    id: number;
    name: string;
    email: string;
    photo_url: string;
  };
  publications_count?: number;
};
