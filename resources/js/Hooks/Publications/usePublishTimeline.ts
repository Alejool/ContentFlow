import { publicationService } from '@/Services/Publications/publicationService';
import { useQuery } from '@tanstack/react-query';

export interface PublishTimelineEntry {
  id: number;
  platform: string;
  account_name: string | null;
  status: string;
  published_at: string | null;
  post_url: string | null;
  error_message: string | null;
  retry_count: number;
  last_retry_at: string | null;
  is_retrying: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublishTimelineData {
  publication: {
    id: number;
    title: string;
    status: string;
    scheduled_at: string | null;
  };
  timeline: PublishTimelineEntry[];
}

export function usePublishTimeline(publicationId: number | null) {
  return useQuery<PublishTimelineData>({
    queryKey: ['publish-timeline', publicationId],
    queryFn: async () => {
      const res = await publicationService.getPublishTimeline(publicationId as number);
      return res.data ?? res;
    },
    enabled: publicationId !== null,
    staleTime: 15 * 1000,
  });
}
