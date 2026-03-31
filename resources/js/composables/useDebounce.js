/**
 * Debounce utility - prevents multiple rapid function calls
 *
 * @param {Function} fn - Function to debounce
 * @param {Number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Object} - { debouncedFn, cancel }
 */
export function useDebounce(fn, delay = 300) {
  let timeoutId = null;
  let isDebouncing = false;

  const debouncedFn = (...args) => {
    if (isDebouncing) {
      return Promise.reject(new Error('Request is being debounced'));
    }

    isDebouncing = true;
    clearTimeout(timeoutId);

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          isDebouncing = false;
        }
      }, delay);
    });
  };

  const cancel = () => {
    clearTimeout(timeoutId);
    isDebouncing = false;
  };

  return { debouncedFn, cancel };
}

/**
 * Debounce for input values - executes callback after user stops typing
 *
 * @param {Function} callback - Callback to execute
 * @param {Number} delay - Delay in milliseconds
 * @returns {Object} - { handler, cancel }
 */
export function useDebouncedInput(callback, delay = 300) {
  let timeoutId = null;

  const handler = (value) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(value), delay);
  };

  const cancel = () => clearTimeout(timeoutId);

  return { handler, cancel };
}

/**
 * Throttle utility - rate limits function calls
 *
 * @param {Function} fn - Function to throttle
 * @param {Number} interval - Minimum interval between calls in ms
 * @returns {Object} - { throttledFn }
 */
export function useThrottle(fn, interval = 1000) {
  let lastCallTime = 0;

  const throttledFn = (...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < interval) {
      const remaining = interval - timeSinceLastCall;
      return Promise.reject(
        new Error(`Please wait ${Math.ceil(remaining / 1000)} seconds before trying again`),
      );
    }

    lastCallTime = now;
    return Promise.resolve(fn(...args));
  };

  return { throttledFn };
}
