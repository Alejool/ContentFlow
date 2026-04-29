import { useEffect } from 'react';
import { initNotificationRealtime } from '@/Services/notificationRealtime';
import { cleanupProgressRealtime, initProgressRealtime } from '@/Services/progressRealtime';
import { useNotificationStore } from '@/stores/notificationStore';
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
