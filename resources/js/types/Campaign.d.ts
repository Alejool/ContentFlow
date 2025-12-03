
export type Campaign = {
  id: number;
  title: string;
  description: string;
  image: string;
  created_at: string;
  updated_at: string;
  goal?: string;
  hashtags?: string;
  slug?: string;
};