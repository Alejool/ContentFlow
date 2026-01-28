import toast, { ToastOptions } from "react-hot-toast";

interface CustomToastOptions extends ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastServiceClass {
  private defaultDuration = 4000;
  private maxToasts = 3;

  /**
   * Show success toast
   */
  success(message: string, options?: CustomToastOptions): string {
    return toast.success(message, {
      duration: this.defaultDuration,
      ...options,
    });
  }

  /**
   * Show error toast
   */
  error(message: string, options?: CustomToastOptions): string {
    return toast.error(message, {
      duration: 6000, // Errors stay longer
      ...options,
    });
  }

  /**
   * Show warning toast
   */
  warning(message: string, options?: CustomToastOptions): string {
    return toast(message, {
      duration: this.defaultDuration,
      icon: "⚠️",
      ...options,
    });
  }

  /**
   * Show info toast
   */
  info(message: string, options?: CustomToastOptions): string {
    return toast(message, {
      duration: this.defaultDuration,
      icon: "ℹ️",
      ...options,
    });
  }

  /**
   * Show loading toast with promise
   */
  loading<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ): Promise<T> {
    return toast.promise(promise, messages, options);
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(toastId?: string): void {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    toast.dismiss();
  }

  /**
   * Show validation errors from Laravel
   */
  validationErrors(errors: Record<string, string[]>): void {
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach((message) => {
        this.error(message);
      });
    });
  }

  /**
   * Show toast from flash message
   */
  fromFlash(flash: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  }): void {
    if (flash.success) {
      this.success(flash.success);
    }
    if (flash.error) {
      this.error(flash.error);
    }
    if (flash.warning) {
      this.warning(flash.warning);
    }
    if (flash.info) {
      this.info(flash.info);
    }
  }
}

export const ToastService = new ToastServiceClass();
