import { Publication } from '@/types/Publication';
import axios from 'axios';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

export function usePublishModal(
  publication: Publication,
  onPublished: (data: any) => void,
  onClose: () => void,
) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [schedulePost, setSchedulePost] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePlatformChange = useCallback((accountId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    );
  }, []);

  const resetState = useCallback(() => {
    setSelectedPlatforms([]);
    setSchedulePost(false);
    setScheduledAt('');
    setIsPublishing(false);
  }, []);

  /**
   * Publish content directly (for owners)
   */
  const publish = async () => {
    if (selectedPlatforms.length === 0 || isPublishing) return;

    setIsPublishing(true);

    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/publish`, {
        platforms: selectedPlatforms,
        scheduled_at: schedulePost ? scheduledAt : null,
      });

      toast.success('Contenido publicado exitosamente');
      onPublished(response.data);
      resetState();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al publicar';
      toast.error(errorMessage);
      console.error('Error publishing:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Send content to review (for non-owners)
   */
  const requestReview = async () => {
    if (isPublishing) return;

    setIsPublishing(true);

    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/request-review`, {
        platform_settings: {
          platforms: selectedPlatforms,
          scheduled_at: schedulePost ? scheduledAt : null,
        },
      });

      toast.success('Contenido enviado a revisión exitosamente');
      onPublished(response.data);
      resetState();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al enviar a revisión';
      toast.error(errorMessage);
      console.error('Error requesting review:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Publish anyway (bypass warnings, only for owners)
   */
  const publishAnyway = async () => {
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
    requestReview,
    publishAnyway,
  };
}
