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
};
