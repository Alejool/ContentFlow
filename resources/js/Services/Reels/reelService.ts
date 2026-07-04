import axios from 'axios';

export interface GenerateReelPayload {
  media_file_id: number;
  publication_id: number;
  platforms: string[];
  add_subtitles: boolean;
  language: string;
}

export const reelService = {
  generate: (payload: GenerateReelPayload): Promise<void> =>
    axios.post('/api/v1/reels/generate', payload).then(() => undefined),

  list: <TReel = unknown, TPagination = unknown>(
    params: Record<string, unknown>,
  ): Promise<{ reels: TReel[]; pagination: TPagination }> =>
    axios.get('/api/v1/reels', { params }).then((r) => r.data.data),
};
