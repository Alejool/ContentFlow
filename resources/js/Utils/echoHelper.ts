/**
 * Echo Helper Utilities
 * 
 * Provides safe access to Laravel Echo with proper initialization checks
 * and retry logic to handle async bootstrap loading.
 */

type EchoCallback = () => void;

/**
 * Check if Echo is initialized and ready to use
 */
export function isEchoReady(): boolean {
  return typeof window !== 'undefined' && !!window.Echo;
}

/**
 * Wait for Echo to be initialized before executing a callback
 * 
 * @param callback - Function to execute once Echo is ready
 * @param maxRetries - Maximum number of retry attempts (default: 50)
 * @param retryDelay - Delay between retries in ms (default: 100)
 * @returns Cleanup function to cancel waiting
 * 
 * @example
 * const cleanup = waitForEcho(() => {
 *   window.Echo.private('channel').listen('event', handler);
 * });
 * 
 * // Later, if needed:
 * cleanup();
 */
export function waitForEcho(
  callback: EchoCallback,
  maxRetries: number = 50,
  retryDelay: number = 100,
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let retries = 0;
  let cancelled = false;

  const checkAndExecute = () => {
    if (cancelled) return;

    if (isEchoReady()) {
      callback();
    } else if (retries < maxRetries) {
      retries++;
      timeoutId = setTimeout(checkAndExecute, retryDelay);
    } else {
      console.error(
        '[echoHelper] Echo failed to initialize after',
        maxRetries,
        'retries. WebSocket features may not work.',
      );
    }
  };

  checkAndExecute();

  // Return cleanup function
  return () => {
    cancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

/**
 * Safely leave an Echo channel
 * 
 * @param channelName - Name of the channel to leave
 * 
 * @example
 * safeLeaveChannel('users.123');
 */
export function safeLeaveChannel(channelName: string): void {
  if (isEchoReady()) {
    try {
      window.Echo.leave(channelName);
    } catch (error) {
      console.warn(`[echoHelper] Failed to leave channel ${channelName}:`, error);
    }
  }
}

/**
 * Safely access Echo with a callback, with automatic retry logic
 * 
 * @param callback - Function that uses Echo
 * @returns Cleanup function
 * 
 * @example
 * const cleanup = withEcho(() => {
 *   const channel = window.Echo.private('users.123');
 *   channel.listen('.event', handler);
 * });
 */
export function withEcho(callback: EchoCallback): () => void {
  if (isEchoReady()) {
    callback();
    return () => {}; // No cleanup needed if already ready
  }

  // Echo not ready, wait for it
  return waitForEcho(callback);
}

/**
 * Create a safe Echo channel subscription with automatic cleanup
 * 
 * @param channelName - Name of the channel
 * @param channelType - Type of channel ('private', 'public', 'presence')
 * @param setup - Function to set up listeners on the channel
 * @returns Cleanup function that leaves the channel
 * 
 * @example
 * const cleanup = createEchoSubscription(
 *   'users.123',
 *   'private',
 *   (channel) => {
 *     channel.listen('.event', handler);
 *   }
 * );
 * 
 * // Later:
 * cleanup();
 */
export function createEchoSubscription(
  channelName: string,
  channelType: 'private' | 'public' | 'presence' = 'private',
  setup: (channel: any) => void,
): () => void {
  let channel: any = null;

  const cleanup = withEcho(() => {
    try {
      // Create channel based on type
      switch (channelType) {
        case 'private':
          channel = window.Echo.private(channelName);
          break;
        case 'presence':
          channel = window.Echo.join(channelName);
          break;
        case 'public':
          channel = window.Echo.channel(channelName);
          break;
      }

      // Set up listeners
      if (channel) {
        setup(channel);
      }
    } catch (error) {
      console.error(`[echoHelper] Failed to create subscription for ${channelName}:`, error);
    }
  });

  // Return cleanup function
  return () => {
    cleanup();
    safeLeaveChannel(channelName);
  };
}

/**
 * Hook-friendly Echo subscription creator
 * Use this in React useEffect hooks
 * 
 * @example
 * useEffect(() => {
 *   return createEchoSubscription('users.123', 'private', (channel) => {
 *     channel.listen('.event', handler);
 *   });
 * }, [userId]);
 */
export { createEchoSubscription as useEchoSubscription };
