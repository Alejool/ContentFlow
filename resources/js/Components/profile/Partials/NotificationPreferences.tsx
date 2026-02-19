import { useCompletionNotifications } from '@/Hooks/useCompletionNotifications';
import { Bell, BellOff, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

/**
 * Notification Preferences Component
 * 
 * Allows users to configure their notification preferences for upload
 * and processing completions.
 * 
 * Requirements: 8.5 - Add notification preferences to user settings
 */
export default function NotificationPreferences() {
  const { t } = useTranslation();
  const {
    preferences,
    savePreferences,
    requestBrowserNotificationPermission,
    browserNotificationPermission,
  } = useCompletionNotifications();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleToggle = (key: keyof typeof localPreferences) => {
    const newPreferences = {
      ...localPreferences,
      [key]: !localPreferences[key],
    };
    setLocalPreferences(newPreferences);
    savePreferences(newPreferences);
    toast.success(t('profile.notifications.saved') || 'Preferences saved');
  };

  const handleRequestBrowserPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const granted = await requestBrowserNotificationPermission();
      if (granted) {
        toast.success(
          t('profile.notifications.permission_granted') ||
            'Browser notifications enabled'
        );
        // Enable browser notifications in preferences
        const newPreferences = {
          ...localPreferences,
          enableBrowserNotifications: true,
        };
        setLocalPreferences(newPreferences);
        savePreferences(newPreferences);
      } else {
        toast.error(
          t('profile.notifications.permission_denied') ||
            'Browser notification permission denied'
        );
      }
    } catch (error) {
      toast.error(
        t('profile.notifications.permission_error') ||
          'Failed to request notification permission'
      );
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
          <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('profile.notifications.title') || 'Notification Preferences'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('profile.notifications.description') ||
              'Configure how you want to be notified about upload and processing completions'}
          </p>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 divide-y divide-gray-200 dark:divide-neutral-700">
        {/* In-App Notifications */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('profile.notifications.in_app') || 'In-App Notifications'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.notifications.in_app_description') ||
                  'Show notifications within the application'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('enableInAppNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localPreferences.enableInAppNotifications
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.enableInAppNotifications
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Browser Notifications */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('profile.notifications.browser') || 'Browser Notifications'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.notifications.browser_description') ||
                  'Show system notifications even when the app is in the background'}
              </p>
              {browserNotificationPermission === 'denied' && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {t('profile.notifications.permission_denied_help') ||
                    'Permission denied. Please enable notifications in your browser settings.'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {browserNotificationPermission !== 'granted' && (
                <button
                  onClick={handleRequestBrowserPermission}
                  disabled={
                    isRequestingPermission ||
                    browserNotificationPermission === 'denied'
                  }
                  className="text-xs px-3 py-1.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequestingPermission
                    ? t('profile.notifications.requesting') || 'Requesting...'
                    : t('profile.notifications.enable') || 'Enable'}
                </button>
              )}
              <button
                onClick={() => handleToggle('enableBrowserNotifications')}
                disabled={browserNotificationPermission !== 'granted'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  localPreferences.enableBrowserNotifications &&
                  browserNotificationPermission === 'granted'
                    ? 'bg-primary-600'
                    : 'bg-gray-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.enableBrowserNotifications &&
                    browserNotificationPermission === 'granted'
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Upload Completion Notifications */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('profile.notifications.upload_complete') ||
                  'Upload Completions'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.notifications.upload_complete_description') ||
                  'Notify when file uploads complete'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('notifyOnUploadComplete')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localPreferences.notifyOnUploadComplete
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.notifyOnUploadComplete
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Processing Completion Notifications */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('profile.notifications.processing_complete') ||
                  'Processing Completions'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.notifications.processing_complete_description') ||
                  'Notify when video processing completes'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('notifyOnProcessingComplete')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localPreferences.notifyOnProcessingComplete
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.notifyOnProcessingComplete
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('profile.notifications.info_title') || 'About Notifications'}
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {t('profile.notifications.info_description') ||
                'Notifications help you stay informed about long-running operations. You can customize which types of notifications you receive and how they are delivered.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
