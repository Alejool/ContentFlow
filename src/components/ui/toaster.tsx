"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  X,
} from "lucide-react";
import * as React from "react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastContextType {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, "id">) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Iconos para cada tipo de toast
const ToastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-primary-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  loading: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
};

// Colores de fondo para cada tipo
const ToastBgColors: Record<ToastType, string> = {
  success:
    "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50",
  error:
    "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50",
  warning:
    "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50",
  info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",
  loading:
    "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",
};

// Text colors for each type
const ToastTextColors: Record<ToastType, string> = {
  success: "text-green-800 dark:text-green-300",
  error: "text-primary-800 dark:text-primary-300",
  warning: "text-yellow-800 dark:text-yellow-300",
  info: "text-blue-800 dark:text-blue-300",
  loading: "text-blue-800 dark:text-blue-300",
};

// Progress bar colors for each type
const ToastProgressColors: Record<ToastType, string> = {
  success: "bg-green-500",
  error: "bg-primary-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
  loading: "bg-blue-500",
};

// Componente individual de toast
const ToastItem = ({ toast }: { toast: ToastProps }) => {
  const { dismissToast } = useToast();
  const [isVisible, setIsVisible] = React.useState(true);
  const [progress, setProgress] = React.useState(100);
  const progressRef = React.useRef<HTMLDivElement>(null);
  const animationFrameRef = React.useRef<number>();

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0 && toast.type !== "loading") {
      const startTime = Date.now();
      const totalDuration = toast.duration;

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalDuration - elapsed);
        const newProgress = (remaining / totalDuration) * 100;

        setProgress(newProgress);

        if (remaining > 0) {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          setIsVisible(false);
          setTimeout(() => dismissToast(toast.id), 300);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateProgress);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [toast.id, toast.duration, toast.type, dismissToast]);

  React.useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        dismissToast(toast.id);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, toast.id, dismissToast]);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div
      className={`
        relative rounded-lg border shadow-lg max-w-md w-full overflow-hidden 
        transition-all duration-300 transform
        ${ToastBgColors[toast.type]}
        ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95"
        }
      `}
      style={{
        animation: isVisible ? "toastSlideIn 0.3s ease-out" : "none",
      }}
    >
      {/* Barra de progreso */}
      {toast.duration && toast.type !== "loading" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            ref={progressRef}
            className={`h-full transition-all duration-300 ${
              ToastProgressColors[toast.type]
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{ToastIcons[toast.type]}</div>

        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4
              className={`font-semibold text-sm mb-1 ${
                ToastTextColors[toast.type]
              }`}
            >
              {toast.title}
            </h4>
          )}
          {toast.description && (
            <p className={`text-sm ${ToastTextColors[toast.type]}`}>
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                handleClose();
              }}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {toast.type !== "loading" && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -m-1"
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Componente del contenedor de toasts
export const Toaster = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 md:bottom-6 md:right-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

// Provider principal
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const showToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [{ ...toast, id }, ...prev.slice(0, 4)]); // Limit to 5 toasts
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      dismissAllToasts,
    }),
    [toasts, showToast, dismissToast, dismissAllToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

// Hook helper para usar toasts fácilmente
export function useToaster() {
  const { showToast, dismissToast, dismissAllToasts } = useToast();

  const toast = React.useCallback(
    (options: Omit<ToastProps, "id">) => {
      showToast(options);
    },
    [showToast]
  );

  const success = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showToast({
        title,
        description,
        type: "success",
        duration: duration || 5000,
      });
    },
    [showToast]
  );

  const error = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showToast({
        title,
        description,
        type: "error",
        duration: duration || 5000,
      });
    },
    [showToast]
  );

  const warning = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showToast({
        title,
        description,
        type: "warning",
        duration: duration || 5000,
      });
    },
    [showToast]
  );

  const info = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showToast({
        title,
        description,
        type: "info",
        duration: duration || 5000,
      });
    },
    [showToast]
  );

  const loading = React.useCallback(
    (title: string, description?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      showToast({
        id,
        title,
        description,
        type: "loading",
      } as any);
      return id;
    },
    [showToast]
  );

  const updateLoading = React.useCallback(
    (
      id: string,
      type: Exclude<ToastType, "loading">,
      title: string,
      description?: string
    ) => {
      dismissToast(id);
      showToast({
        title,
        description,
        type,
        duration: 5000,
      });
    },
    [showToast, dismissToast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
    loading,
    updateLoading,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
  };
}

// Componente más simple para usar directamente
export function SimpleToaster() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);
  const toastIdCounter = React.useRef(0);

  const showToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = `toast-${toastIdCounter.current++}`;
    setToasts((prev) => [{ ...toast, id }, ...prev.slice(0, 4)]);

    if (toast.duration && toast.type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration);
    }
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const api = React.useMemo(
    () => ({
      success: (title: string, description?: string, duration?: number) =>
        showToast({
          title,
          description,
          type: "success",
          duration: duration || 5000,
        }),
      error: (title: string, description?: string, duration?: number) =>
        showToast({
          title,
          description,
          type: "error",
          duration: duration || 5000,
        }),
      warning: (title: string, description?: string, duration?: number) =>
        showToast({
          title,
          description,
          type: "warning",
          duration: duration || 5000,
        }),
      info: (title: string, description?: string, duration?: number) =>
        showToast({
          title,
          description,
          type: "info",
          duration: duration || 5000,
        }),
      loading: (title: string, description?: string) => {
        const id = `toast-${toastIdCounter.current++}`;
        showToast({ id, title, description, type: "loading" } as any);
        return id;
      },
      dismiss: dismissToast,
      dismissAll: () => setToasts([]),
    }),
    [showToast, dismissToast]
  );

  React.useEffect(() => {
    // @ts-ignore
    window.toast = api;
  }, [api]);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 md:bottom-6 md:right-6">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  );
}

// Estilos CSS para animaciones (añade esto a tu CSS global)
const toastStyles = `
@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
}
`;

// Componente para inyectar estilos
export function ToastStyles() {
  return <style>{toastStyles}</style>;
}

// Función global para usar toasts sin contexto
let globalToaster: ReturnType<typeof useToaster> | null = null;

export function setGlobalToaster(toaster: ReturnType<typeof useToaster>) {
  globalToaster = toaster;
}

export function getGlobalToaster() {
  if (!globalToaster) {
    // Create a simple fallback
    const fallbackToaster = {
      toast: (options: Omit<ToastProps, "id">) => {
        console.log("Toast (fallback):", options);
      },
      success: (title: string, description?: string) => {
        console.log("Success toast:", title, description);
      },
      error: (title: string, description?: string) => {
        console.log("Error toast:", title, description);
      },
      warning: (title: string, description?: string) => {
        console.log("Warning toast:", title, description);
      },
      info: (title: string, description?: string) => {
        console.log("Info toast:", title, description);
      },
      loading: (title: string, description?: string) => {
        console.log("Loading toast:", title, description);
        return "fallback-id";
      },
      updateLoading: () => {},
      dismiss: () => {},
      dismissAll: () => {},
    };
    return fallbackToaster;
  }
  return globalToaster;
}

// Hook para usar toasts fácilmente en cualquier componente
export function useToastManager() {
  const toast = React.useRef(getGlobalToaster());

  return toast.current;
}

// High Order Component para añadir toasts a un componente
export function withToaster<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithToasterComponent(props: P) {
    const toaster = useToastManager();

    return <Component {...props} toaster={toaster} />;
  };
}
