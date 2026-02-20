/**
 * Network error handling utilities with retry mechanism and exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface NetworkError extends Error {
  status?: number;
  statusText?: string;
  isNetworkError: boolean;
  isRetryable: boolean;
}

/**
 * Creates a network error with additional metadata
 */
export function createNetworkError(
  message: string,
  status?: number,
  statusText?: string
): NetworkError {
  const error = new Error(message) as NetworkError;
  error.status = status;
  error.statusText = statusText;
  error.isNetworkError = true;
  error.isRetryable = isRetryableError(status);
  return error;
}

/**
 * Determines if an error is retryable based on status code
 */
function isRetryableError(status?: number): boolean {
  if (!status) return true; // Network errors without status are retryable
  
  // Retry on server errors (5xx) and specific client errors
  return (
    status >= 500 || // Server errors
    status === 408 || // Request Timeout
    status === 429 || // Too Many Requests
    status === 0 // Network failure
  );
}

/**
 * Calculates delay for exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Sleeps for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const networkError = error as NetworkError;
      if (networkError.isNetworkError && !networkError.isRetryable) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Wraps a fetch request with error handling and retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(url, options);

      // Check if response is ok
      if (!response.ok) {
        throw createNetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText
        );
      }

      return response;
    } catch (error) {
      // Handle network errors (no response)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw createNetworkError('Network request failed. Please check your connection.');
      }
      throw error;
    }
  }, retryOptions);
}

/**
 * User-friendly error messages for different error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  const networkError = error as NetworkError;
  
  if (networkError.isNetworkError) {
    if (!networkError.status) {
      return 'Unable to connect. Please check your internet connection.';
    }

    switch (networkError.status) {
      case 400:
        return 'Invalid request. Please try again.';
      case 401:
        return 'You need to log in to continue.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'Request timed out. Please try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again later.';
      default:
        return networkError.message || 'An error occurred. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Checks if the user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Waits for the user to come back online
 */
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * Queue for offline actions
 */
class OfflineQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  /**
   * Adds an action to the queue
   */
  enqueue(action: () => Promise<any>): void {
    this.queue.push(action);
    this.processQueue();
  }

  /**
   * Processes the queue when online
   */
  private async processQueue(): Promise<void> {
    if (this.processing || !isOnline() || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && isOnline()) {
      const action = this.queue.shift();
      if (action) {
        try {
          await action();
        } catch (error) {
          // Re-queue if it's a network error
          const networkError = error as NetworkError;
          if (networkError.isNetworkError && networkError.isRetryable) {
            this.queue.unshift(action);
            break;
          }
        }
      }
    }

    this.processing = false;
  }

  /**
   * Gets the queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clears the queue
   */
  clear(): void {
    this.queue = [];
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

// Listen for online event to process queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineQueue['processQueue']();
  });
}
