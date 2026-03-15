import { ICON_MAP } from '@/Components/Notifications/DynamicIcon';
import { ToastService } from '@/Services/ToastService';
import { useNotificationStore } from '@/stores/notificationStore';
import React from 'react';

export function initNotificationRealtime(userId: number) {
  if (window.Echo) {
    const channel = window.Echo.private(`users.${userId}`);
    
    // Notificaciones generales
    channel.listen('.NotificationCreated', (e: Record<string, unknown>) => {
      // Show toast immediately
      if (e.title || e.message) {
        const title = e.title || 'Nueva notificación';
        const message = e.message || '';

        let icon = undefined;
        if (e.icon && ICON_MAP[e.icon]) {
          const IconComp = ICON_MAP[e.icon];
          icon = React.createElement(IconComp, { className: 'w-5 h-5' });
        }

        if (e.type === 'error' || e.status === 'failed') {
          ToastService.error(`${title}: ${message}`, { icon });
        } else if (e.type === 'warning') {
          ToastService.warning(`${title}: ${message}`, { icon });
        } else {
          ToastService.success(`${title}: ${message}`, { icon });
        }
      }

      useNotificationStore.getState().fetchNotifications();
    });

    // Notificaciones de cola (publicación en cola)
    channel.notification((notification: any) => {
      handleQueueNotification(notification);
    });
  }
}

function handleQueueNotification(notification: any) {
  const { type, data } = notification;

  switch (type) {
    case 'App\\Notifications\\PublicationQueuedNotification':
      handlePublicationQueued(data);
      break;
    
    case 'App\\Notifications\\BulkPublishStartedNotification':
      handleBulkPublishStarted(data);
      break;
    
    case 'App\\Notifications\\BulkPublishCompletedNotification':
      handleBulkPublishCompleted(data);
      break;
    
    case 'App\\Notifications\\PublicationPublishedNotification':
      handlePublicationPublished(data);
      break;
    
    case 'App\\Notifications\\PublicationPostFailedNotification':
      handlePublicationFailed(data);
      break;
  }

  // Refrescar lista de notificaciones
  useNotificationStore.getState().fetchNotifications();
}

function handlePublicationQueued(data: any) {
  const { message, queue_position, estimated_wait_minutes, plan, priority_info } = data;
  
  let toastMessage = message;
  
  if (estimated_wait_minutes && estimated_wait_minutes > 2) {
    toastMessage += ` ⏱️ ~${estimated_wait_minutes} min`;
  }
  
  if (priority_info) {
    toastMessage += priority_info;
  }
  
  ToastService.info(toastMessage, {
    duration: 5000,
  });
}

function handleBulkPublishStarted(data: any) {
  const { message, publication_count, priority_info } = data;
  
  let toastMessage = message;
  
  if (priority_info) {
    toastMessage += priority_info;
  }
  
  ToastService.info(toastMessage, {
    duration: 5000,
  });
}

function handleBulkPublishCompleted(data: any) {
  const { message, success, publication_count } = data;
  
  if (success) {
    ToastService.success(message, {
      duration: 7000,
    });
  } else {
    ToastService.error(message, {
      duration: 10000,
    });
  }
}

function handlePublicationPublished(data: any) {
  const { publication_title, successful_platforms, failed_platforms } = data;
  
  if (failed_platforms && failed_platforms.length > 0) {
    ToastService.warning(
      `Publicación "${publication_title}" completada con algunos errores. Revisa los detalles.`,
      { duration: 8000 }
    );
  } else {
    ToastService.success(
      `✅ Publicación "${publication_title}" completada exitosamente en ${successful_platforms?.length || 0} plataformas.`,
      { duration: 6000 }
    );
  }
}

function handlePublicationFailed(data: any) {
  const { publication_title, error_message } = data;
  
  ToastService.error(
    `❌ Error al publicar "${publication_title}". ${error_message || 'Intenta nuevamente.'}`,
    { duration: 10000 }
  );
}
