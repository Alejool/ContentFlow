import { Publication } from '@/types/Publication';
import axios from 'axios';
import { useCallback, useState } from 'react';

export function usePublishModal(
  publication: Publication,
  onPublished: (data: any) => void,
  onClose: () => void
) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [schedulePost, setSchedulePost] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePlatformChange = useCallback((accountId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId) 
        ? prev.filter((id) => id !== accountId) 
        : [...prev, accountId]
    );
  }, []);

  const resetState = useCallback(() => {
    setSelectedPlatforms([]);
    setSchedulePost(false);
    setScheduledAt('');
    setIsPublishing(false);
  }, []);

  const publish = async () => {
    if (selectedPlatforms.length === 0 || isPublishing) return;

    setIsPublishing(true);

    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/publish`, {
        platform_ids: selectedPlatforms,
        scheduled_at: schedulePost ? scheduledAt : null,
      });

      onPublished(response.data);
      resetState();
      onClose();
    } catch (error: any) {
      alert('Error al publicar: ' + (error.response?.data?.message || 'Error desconocido'));
    } finally {
      setIsPublishing(false);
    }
  };

  const publishAnyway = async () => {
    // Same as publish but bypasses warnings
    await publish();
  };

  return {
    selectedPlatforms,
    schedulePost,
    scheduledAt,
    isPublishing,
    handlePlatformChange,
    setSchedulePost,
    setScheduledAt,
    resetState,
    publish,
    publishAnyway
  };
}