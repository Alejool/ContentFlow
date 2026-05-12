import { useEffect } from 'react';
import { initNotificationRealtime } from '@/Services/Notifications/notificationRealtime';
import { cleanupProgressRealtime, initProgressRealtime } from '@/Services/Queue/progressRealtime';
import { useNotificationStore } from '@/stores/Notifications/notificationStore';
import { User } from '@/types';

export function useRealtimeInit(user?: User | null) {
  useEffect(() => {
    if (user?.id) {
      initNotificationRealtime(user.id);
      initProgressRealtime(user.id);
      useNotificationStore.getState().fetchNotifications();
    }

    // Cleanup on unmount
    return () => {
      if (user?.id) {
        cleanupProgressRealtime(user.id);
      }
    };
  }, [user?.id]);
}
