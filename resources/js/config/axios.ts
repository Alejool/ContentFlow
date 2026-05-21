/**
 * Axios Configuration with Optimistic Updates
 *
 * This file sets up axios with the optimistic interceptor.
 * Import and use this configured instance for optimistic updates.
 */

import { setupOptimisticInterceptor } from '@/plugins/common/optimisticAxios';
import axios from 'axios';

const tokenElement = document.head?.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
const csrfToken = tokenElement?.content || '';

// Create a configured axios instance with CSRF and credential support.
const axiosInstance = axios.create({
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
  },
});

// Setup optimistic interceptor
setupOptimisticInterceptor(axiosInstance);

// Export the configured instance
export default axiosInstance;

/**
 * Example usage:
 *
 * import axiosInstance from '@/config/axios';
 *
 * // Make an optimistic request
 * const response = await axiosInstance.post('/api/publications', data, {
 *   optimistic: true,
 *   optimisticData: { id: 'temp-123', ...data },
 *   resource: 'publications',
 *   onSuccess: (serverData) => ,
 *   onError: (error) => ,
 *   onRollback: () => ,
 * });
 */
