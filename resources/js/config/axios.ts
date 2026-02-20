/**
 * Axios Configuration with Optimistic Updates
 * 
 * This file sets up axios with the optimistic interceptor.
 * Import and use this configured instance for optimistic updates.
 */

import axios from 'axios';
import { setupOptimisticInterceptor } from '../plugins/optimisticAxios';

// Create a configured axios instance
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
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
