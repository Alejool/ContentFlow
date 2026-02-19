import { ref, watch } from 'vue';

/**
 * Debounce composable for preventing multiple rapid function calls
 * Useful for API requests, search inputs, and button clicks
 * 
 * @param {Function} fn - Function to debounce
 * @param {Number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Object} - Debounced function and state
 */
export function useDebounce(fn, delay = 300) {
  const isDebouncing = ref(false);
  let timeoutId = null;

  const debouncedFn = (...args) => {
    if (isDebouncing.value) {
      console.log('⏳ Debouncing: Request blocked');
      return Promise.reject(new Error('Request is being debounced'));
    }

    isDebouncing.value = true;

    clearTimeout(timeoutId);

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          isDebouncing.value = false;
        }
      }, delay);
    });
  };

  const cancel = () => {
    clearTimeout(timeoutId);
    isDebouncing.value = false;
  };

  return {
    debouncedFn,
    isDebouncing,
    cancel,
  };
}

/**
 * Debounce for reactive values
 * Useful for search inputs that trigger API calls
 * 
 * @param {Ref} value - Reactive value to watch
 * @param {Function} callback - Callback to execute
 * @param {Number} delay - Delay in milliseconds
 */
export function useDebouncedRef(value, callback, delay = 300) {
  let timeoutId = null;

  watch(value, (newValue) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(newValue);
    }, delay);
  });

  return {
    cancel: () => clearTimeout(timeoutId),
  };
}

/**
 * Throttle composable for rate limiting function calls
 * Ensures function is called at most once per interval
 * 
 * @param {Function} fn - Function to throttle
 * @param {Number} interval - Minimum interval between calls in ms
 * @returns {Object} - Throttled function and state
 */
export function useThrottle(fn, interval = 1000) {
  const isThrottled = ref(false);
  let lastCallTime = 0;

  const throttledFn = (...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < interval) {
      const remainingTime = interval - timeSinceLastCall;
      console.log(`⏳ Throttled: Please wait ${Math.ceil(remainingTime / 1000)}s`);
      
      return Promise.reject(
        new Error(`Please wait ${Math.ceil(remainingTime / 1000)} seconds before trying again`)
      );
    }

    isThrottled.value = true;
    lastCallTime = now;

    return Promise.resolve(fn(...args)).finally(() => {
      setTimeout(() => {
        isThrottled.value = false;
      }, interval);
    });
  };

  return {
    throttledFn,
    isThrottled,
  };
}
