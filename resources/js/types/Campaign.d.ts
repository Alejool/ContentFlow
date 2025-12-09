import { Publication } from "./Publication";

export type Campaign = {
  id: number;
  name: string;
  title?: string; // Support legacy or alias
  description: string;
  goal?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status?: "active" | "paused" | "completed" | "draft";
  created_at: string;
  updated_at: string;
  publications?: Publication[];
  publications_count?: number;
};
