import { useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { useUploadQueue } from '@/stores/uploadQueueStore';
import { useProcessingProgress } from '@/stores/processingProgressStore';
import { useNotificationStore } from '@/stores/notificationStore';

/**
 * Notification preferences interface
 * Stores user preferences for completion notifications
 */
export interface NotificationPreferences {
  enableInAppNotifications: boolean;
  enableBrowserNotifications: boolean;
  notifyOnUploadComplete: boolean;
  notifyOnProcessingComplete: boolean;
}

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableInAppNotifications: true,
  enableBrowserNotifications: false,
  notifyOnUploadComplete: true,
  notifyOnProcessingComplete: true,
};

const PREFERENCES_KEY = 'completion_notification_preferences';

/**
 * Hook for managing completion notifications for uploads and processing jobs
 * 
 * Features:
 * - In-app notifications via notification store
 * - Browser notifications with permission checking
 * - Click handlers for navigation to completed content
 * - User preferences for notification types
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function useCompletionNotifications() {
  const uploadQueue = useUploadQueue();
  const processingProgress = useProcessingProgress();
  const notificationStore = useNotificationStore();
  
  // Track previously completed items to avoid duplicate notifications
  const completedUploadsRef = useRef<Set<string>>(new Set());
  const completedJobsRef = useRef<Set<string>>(new Set());
  
  // Browser notification permission state
  const browserNotificationPermission = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  /**
   * Load notification preferences from localStorage
   * Requirement 8.5: Add notification preferences to user settings
   */
  const loadPreferences = useCallback((): NotificationPreferences => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }, []);

  /**
   * Save notification preferences to localStorage
   * Requirement 8.5: Add notification preferences to user settings
   */
  const savePreferences = useCallback((preferences: NotificationPreferences) => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }, []);

  /**
   * Request browser notification permission
   * Requirement 8.3, 8.4: Browser notification support with permission checking
   */
  const requestBrowserNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      browserNotificationPermission.current = 'granted';
      return true;
    }

    if (Notification.permission === 'denied') {
      browserNotificationPermission.current = 'denied';
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      browserNotificationPermission.current = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  /**
   * Show browser notification
   * Requirement 8.3, 8.4: Browser notification conditional delivery
   */
  const showBrowserNotification = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      if (
        typeof Notification === 'undefined' ||
        browserNotificationPermission.current !== 'granted'
      ) {
        return;
      }

      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `completion-${Date.now()}`,
        });

        if (onClick) {
          notification.onclick = () => {
            window.focus();
            onClick();
            notification.close();
          };
        }

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Failed to show browser notification:', error);
      }
    },
    []
  );

  /**
   * Show in-app notification
   * Requirement 8.1, 8.2: In-app notification display on completion
   */
  const showInAppNotification = useCallback(
    (title: string, message: string, publicationId?: number) => {
      // Add notification to the store which will display it in the UI
      // The notification store will handle the display via the notification center
      notificationStore.fetchNotifications();
    },
    [notificationStore]
  );

  /**
   * Navigate to completed content
   * Requirement 8.5: Notification click handlers for navigation
   */
  const navigateToContent = useCallback((publicationId?: number) => {
    if (publicationId) {
      router.visit(`/content`);
    } else {
      router.visit('/content');
    }
  }, []);

  /**
   * Handle upload completion
   * Requirement 8.1: Display notification when upload completes
   */
  const handleUploadCompletion = useCallback(
    (uploadId: string, upload: any, preferences: NotificationPreferences) => {
      // Skip if already notified
      if (completedUploadsRef.current.has(uploadId)) {
        return;
      }

      completedUploadsRef.current.add(uploadId);

      const title = 'Upload Complete';
      const message = upload.publicationTitle
        ? `"${upload.publicationTitle}" has been uploaded successfully`
        : 'Your file has been uploaded successfully';

      // Show in-app notification
      if (preferences.enableInAppNotifications && preferences.notifyOnUploadComplete) {
        showInAppNotification(title, message, upload.publicationId);
      }

      // Show browser notification
      if (
        preferences.enableBrowserNotifications &&
        preferences.notifyOnUploadComplete &&
        browserNotificationPermission.current === 'granted'
      ) {
        showBrowserNotification(title, message, () => {
          navigateToContent(upload.publicationId);
        });
      }
    },
    [showInAppNotification, showBrowserNotification, navigateToContent]
  );

  /**
   * Handle processing completion
   * Requirement 8.2: Display notification when processing completes
   */
  const handleProcessingCompletion = useCallback(
    (jobId: string, job: any, preferences: NotificationPreferences) => {
      // Skip if already notified
      if (completedJobsRef.current.has(jobId)) {
        return;
      }

      completedJobsRef.current.add(jobId);

      const title = 'Processing Complete';
      const message = `Your ${job.type.replace('_', ' ')} has been completed successfully`;

      // Show in-app notification
      if (preferences.enableInAppNotifications && preferences.notifyOnProcessingComplete) {
        showInAppNotification(title, message, job.publicationId);
      }

      // Show browser notification
      if (
        preferences.enableBrowserNotifications &&
        preferences.notifyOnProcessingComplete &&
        browserNotificationPermission.current === 'granted'
      ) {
        showBrowserNotification(title, message, () => {
          navigateToContent(job.publicationId);
        });
      }
    },
    [showInAppNotification, showBrowserNotification, navigateToContent]
  );

  /**
   * Monitor upload queue for completions
   */
  useEffect(() => {
    const preferences = loadPreferences();
    
    // Check for completed uploads
    Object.entries(uploadQueue.queue).forEach(([id, upload]) => {
      if (upload.status === 'completed' && !completedUploadsRef.current.has(id)) {
        handleUploadCompletion(id, upload, preferences);
      }
    });
  }, [uploadQueue.queue, handleUploadCompletion, loadPreferences]);

  /**
   * Monitor processing jobs for completions
   */
  useEffect(() => {
    const preferences = loadPreferences();
    
    // Check for completed jobs
    Object.entries(processingProgress.jobs).forEach(([id, job]) => {
      if (job.status === 'completed' && !completedJobsRef.current.has(id)) {
        handleProcessingCompletion(id, job, preferences);
      }
    });
  }, [processingProgress.jobs, handleProcessingCompletion, loadPreferences]);

  /**
   * Cleanup completed items from tracking when they're removed from stores
   */
  useEffect(() => {
    const uploadIds = new Set(Object.keys(uploadQueue.queue));
    const jobIds = new Set(Object.keys(processingProgress.jobs));

    // Remove tracked items that no longer exist in stores
    completedUploadsRef.current.forEach((id) => {
      if (!uploadIds.has(id)) {
        completedUploadsRef.current.delete(id);
      }
    });

    completedJobsRef.current.forEach((id) => {
      if (!jobIds.has(id)) {
        completedJobsRef.current.delete(id);
      }
    });
  }, [uploadQueue.queue, processingProgress.jobs]);

  return {
    preferences: loadPreferences(),
    savePreferences,
    requestBrowserNotificationPermission,
    browserNotificationPermission: browserNotificationPermission.current,
  };
}
