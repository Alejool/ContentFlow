import type { ToastOptions } from 'react-hot-toast';
import toast from 'react-hot-toast';

interface CustomToastOptions extends ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
}

const MAX_TOASTS = 3;
const activeToastIds: string[] = [];

class ToastServiceClass {
  private defaultDuration = 4000;

  private track(id: string, duration: number) {
    activeToastIds.push(id);
    if (activeToastIds.length > MAX_TOASTS) {
      const oldest = activeToastIds.shift()!;
      toast.dismiss(oldest);
    }
    setTimeout(() => {
      const idx = activeToastIds.indexOf(id);
      if (idx !== -1) activeToastIds.splice(idx, 1);
    }, duration + 500);
  }

  success(message: string, options?: CustomToastOptions): string {
    const id = toast.success(message, { duration: this.defaultDuration, ...options });
    this.track(id, options?.duration ?? this.defaultDuration);
    return id;
  }

  error(message: string, options?: CustomToastOptions): string {
    const id = toast.error(message, { duration: 6000, ...options });
    this.track(id, options?.duration ?? 6000);
    return id;
  }

  warning(message: string, options?: CustomToastOptions): string {
    const id = toast(message, { duration: this.defaultDuration, ...options });
    this.track(id, options?.duration ?? this.defaultDuration);
    return id;
  }

  info(message: string, options?: CustomToastOptions): string {
    const id = toast(message, { duration: this.defaultDuration, ...options });
    this.track(id, options?.duration ?? this.defaultDuration);
    return id;
  }

  loading<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions,
  ): Promise<T> {
    return toast.promise(promise, messages, options);
  }

  dismiss(toastId?: string): void {
    toast.dismiss(toastId);
  }

  dismissAll(): void {
    toast.dismiss();
  }

  validationErrors(errors: Record<string, string[]>): void {
    Object.entries(errors).forEach(([_field, messages]) => {
      messages.forEach((message) => {
        this.error(message);
      });
    });
  }

  fromFlash(flash: { success?: string; error?: string; warning?: string; info?: string }): void {
    if (flash.success) this.success(flash.success);
    if (flash.error) this.error(flash.error);
    if (flash.warning) this.warning(flash.warning);
    if (flash.info) this.info(flash.info);
  }
}

export const ToastService = new ToastServiceClass();
