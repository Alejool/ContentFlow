import { useMemo } from 'react';
import { usePublicationStore } from '@/stores/publicationStore';
import { Publication } from '@/types/Publication';

export const usePublicationPlatforms = (publication: Publication | null) => {
  const { publishedPlatforms, publishingPlatforms, failedPlatforms } = usePublicationStore();

  const publishedAccountIds = useMemo(() => {
    const fromStore = publishedPlatforms[publication?.id ?? 0] || [];
    const fromLogs =
      publication?.social_post_logs
        ?.filter((log: any) => log.status === 'published')
        .map((log: any) => log.social_account_id) || [];
    return Array.from(new Set([...fromStore, ...fromLogs]));
  }, [publication, publishedPlatforms]);

  const publishingAccountIds = useMemo(() => {
    const fromStore = publishingPlatforms[publication?.id ?? 0] || [];
    const fromLogs =
      publication?.social_post_logs
        ?.filter((log: any) => log.status === 'publishing')
        .map((log: any) => log.social_account_id) || [];

    return Array.from(new Set([...fromStore, ...fromLogs]));
  }, [publication, publishingPlatforms]);

  const failedAccountIds = useMemo(() => {
    const fromStore = failedPlatforms[publication?.id ?? 0] || [];
    const fromLogs =
      publication?.social_post_logs
        ?.filter((log: any) => log.status === 'failed')
        .map((log: any) => log.social_account_id) || [];
    return Array.from(new Set([...fromStore, ...fromLogs]));
  }, [publication, failedPlatforms]);

  return {
    publishedAccountIds,
    publishingAccountIds,
    failedAccountIds,
  };
};
