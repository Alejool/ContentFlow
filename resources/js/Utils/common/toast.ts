import type { ToastOptions } from 'react-hot-toast';
import { toast as hotToast } from 'react-hot-toast';

/**
 * Custom toast wrapper that can be used throughout the application
 * Provides consistent styling and behavior
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return hotToast.success(message, options);
  },

  error: (message: string, options?: ToastOptions) => {
    return hotToast.error(message, options);
  },

  loading: (message: string, options?: ToastOptions) => {
    return hotToast.loading(message, options);
  },

  promise: hotToast.promise,

  custom: hotToast.custom,

  dismiss: hotToast.dismiss,

  remove: hotToast.remove,
};

export default toast;
