import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface QueueStatus {
  publicationId?: number;
  queuePosition: number;
  estimatedWaitMinutes: number;
  plan: string;
  effectivePriority: number;
  status: 'queued' | 'publishing' | 'published' | 'failed';
  message?: string;
}

export function useQueueStatus(publicationId?: number) {
  const { props } = usePage();
  const auth = props.auth as any;
  const userId = auth?.user?.id;

  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  useEffect(() => {
    if (!userId || !window.Echo) return;

    const channel = window.Echo.private(`users.${userId}`);

    // Escuchar notificaciones de cola
    channel.notification((notification: any) => {
      const { type, data } = notification;

      // Publicación en cola
      if (type === 'App\\Notifications\\PublicationQueuedNotification') {
        if (!publicationId || data.publication_id === publicationId) {
          setQueueStatus({
            publicationId: data.publication_id,
            queuePosition: data.queue_position || 1,
            estimatedWaitMinutes: data.estimated_wait_minutes || 0,
            plan: data.plan || 'free',
            effectivePriority: data.effective_priority || 30,
            status: 'queued',
            message: data.message,
          });
        }
      }

      // Publicación iniciando
      if (type === 'App\\Notifications\\PublicationProcessingStartedNotification') {
        if (!publicationId || data.publication_id === publicationId) {
          setQueueStatus((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'publishing',
                  queuePosition: 0,
                  estimatedWaitMinutes: 0,
                }
              : null
          );
        }
      }

      // Publicación completada
      if (type === 'App\\Notifications\\PublicationPublishedNotification') {
        if (!publicationId || data.publication_id === publicationId) {
          setQueueStatus((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'published',
                }
              : null
          );

          // Limpiar después de 3 segundos
          setTimeout(() => setQueueStatus(null), 3000);
        }
      }

      // Publicación fallida
      if (type === 'App\\Notifications\\PublicationPostFailedNotification') {
        if (!publicationId || data.publication_id === publicationId) {
          setQueueStatus((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'failed',
                }
              : null
          );
        }
      }
    });

    return () => {
      channel.stopListening('.notification');
    };
  }, [userId, publicationId]);

  return queueStatus;
}
