import { useEffect, useState } from 'react';
import { useOnboarding } from '@/Contexts/OnboardingContext';

/**
 * ErrorNotification displays user-friendly error messages with retry option
 * for onboarding operations that fail due to network or other errors.
 */
export function ErrorNotification() {
  const { state } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (state.error && !dismissed) {
      setVisible(true);

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [state.error, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  const handleRetry = () => {
    // Reload the page to retry
    window.location.reload();
  };

  if (!visible || !state.error) {
    return null;
  }

  return (
    <div className="animate-slide-up fixed bottom-4 right-4 z-50 max-w-md">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          {/* Error Icon */}
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <div className="min-w-0 flex-1">
            <h4 className="mb-1 text-sm font-semibold text-red-900 dark:text-red-100">
              Something went wrong
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleRetry}
                className="text-xs font-medium text-red-700 underline hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
              >
                Try Again
              </button>
              <span className="text-red-300 dark:text-red-700">•</span>
              <button
                onClick={handleDismiss}
                className="text-xs font-medium text-red-700 underline hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
