import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import type { SocialPlatform } from '@/types/onboarding';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface PlatformCardProps {
  platform: SocialPlatform;
  isConnected: boolean;
  connectedAccount?: { platform: string; account_name: string };
  onConnectionSuccess?: () => void;
}

// OAuth timeout duration (30 seconds)
const OAUTH_TIMEOUT = 30000;

// OAuth popup check interval (500ms)
const POPUP_CHECK_INTERVAL = 500;

/**
 * PlatformCard displays a social media platform with connection functionality.
 *
 * Features:
 * - Platform icon, name, and description
 * - Connect button with loading state
 * - Connected status indicator
 * - OAuth flow initiation and callback handling
 */
export default function PlatformCard({
  platform,
  isConnected,
  connectedAccount,
  onConnectionSuccess,
}: PlatformCardProps) {
  const { t } = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isConnectingRef.current = isConnecting;
  }, [isConnecting]);

  // Clear error and connecting state when connection is successful
  useEffect(() => {
    if (isConnected) {
      setIsConnecting(false);
      setError(null);
    }
  }, [isConnected]);

  // Cleanup function for OAuth flow
  const cleanupOAuthFlow = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }
  };

  useEffect(() => {
    // Listen for OAuth callback messages from popup window
    const handleMessage = (event: MessageEvent) => {
      // Validate message origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'social_auth_callback') {
        cleanupOAuthFlow();

        if (event.data.success) {
          // OAuth successful
          setIsConnecting(false);
          setError(null);

          // Notify parent component
          onConnectionSuccess?.();

          // Reload to get updated account list
          router.reload({ only: ['connectedAccounts'] });
        } else {
          // OAuth failed - handle different error types
          setIsConnecting(false);

          const errorMessage = event.data.message || 'Failed to connect account';
          const errorType = event.data.errorType;

          // Reload accounts even on error (account might have been partially created)
          router.reload({ only: ['connectedAccounts'] });

          switch (errorType) {
            case 'denied':
              setError('You denied access. Please try again if you want to connect.');
              break;
            case 'timeout':
              setError('Connection timed out. Please try again.');
              break;
            case 'invalid_state':
              setError('Invalid authentication state. Please try again.');
              break;
            case 'network':
              setError('Network error. Please check your connection and try again.');
              break;
            default:
              setError(errorMessage);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      cleanupOAuthFlow();
    };
  }, [onConnectionSuccess]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Get the OAuth URL from the backend
      const response = await fetch(`/social-accounts/auth-url/${platform.id.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to get OAuth URL`);
      }

      const data = await response.json();

      if (data.success && data.url) {
        // Open OAuth flow in a popup window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.url,
          `${platform.name} OAuth`,
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`,
        );

        if (!popup) {
          throw new Error(
            'Failed to open authentication window. Please allow popups and try again.',
          );
        }

        popupRef.current = popup;

        // Set timeout for OAuth flow
        timeoutRef.current = setTimeout(() => {
          if (isConnectingRef.current) {
            cleanupOAuthFlow();
            setIsConnecting(false);
            setError('Authentication timed out. Please try again.');
          }
        }, OAUTH_TIMEOUT);

        // Check if popup was closed without callback
        checkIntervalRef.current = setInterval(() => {
          if (popup?.closed) {
            cleanupOAuthFlow();

            // If still connecting after popup closed, assume it was cancelled
            if (isConnectingRef.current) {
              setIsConnecting(false);
              setError('Authentication was cancelled. Click Connect to try again.');
            }
          }
        }, POPUP_CHECK_INTERVAL);
      } else {
        throw new Error(data.message || 'Failed to get OAuth URL');
      }
    } catch (err: any) {
      cleanupOAuthFlow();

      // Provide user-friendly error messages
      let errorMessage = 'Failed to connect account. Please try again.';

      if (err.message.includes('popup')) {
        errorMessage = 'Please allow popups for this site and try again.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsConnecting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleConnect();
  };

  return (
    <div
      className={`relative rounded-xl border-2 p-6 transition-all ${
        isConnected
          ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
          : 'border-gray-200 bg-white hover:border-primary-500 hover:shadow-md dark:border-neutral-700 dark:border-neutral-900 dark:bg-gradient-to-b dark:from-neutral-800 dark:to-neutral-900'
      }`}
    >
      {/* Platform Icon */}
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${
          isConnected
            ? 'bg-green-100 dark:bg-green-900/20'
            : `bg-${platform.color}-100 dark:bg-${platform.color}-900/20`
        }`}
        style={{
          backgroundColor: isConnected ? undefined : `${platform.color}20`,
        }}
      >
        {platform.icon ? (
          <img src={platform.icon} alt={`${platform.name} icon`} className="h-8 w-8" />
        ) : (
          <span
            className={`text-2xl font-bold ${
              isConnected ? 'text-green-600' : `text-${platform.color}-600`
            }`}
            style={{
              color: isConnected ? undefined : platform.color,
            }}
          >
            {platform.name.substring(0, 1)}
          </span>
        )}
      </div>

      {/* Platform Info */}
      <div className="mb-4">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {platform.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{platform.description}</p>
      </div>

      {/* Connected Status or Connect Button */}
      {isConnected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check className="h-5 w-5" />
            <span className="font-medium">{t('platform.connected')}</span>
          </div>
          {connectedAccount && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connectedAccount.account_name}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('platform.connectTo', { platform: platform.name })}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('platform.connecting')}
              </>
            ) : (
              t('platform.connect')
            )}
          </button>

          {error && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="w-full rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:text-red-300"
                aria-label={`Retry connecting ${platform.name}`}
              >
                {t('errors.retry')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
