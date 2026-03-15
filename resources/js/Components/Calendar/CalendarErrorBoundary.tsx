import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class CalendarErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("Calendar Error Boundary caught an error:", error, errorInfo);
    }

    // Log to error tracking service
    this.logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Log to backend error tracking
    try {
      fetch("/api/v1/errors/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN":
            document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
          context: "calendar",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t("calendar.error.title", "Something went wrong")}
        </h2>

        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {t(
            "calendar.error.description",
            "An error occurred while rendering the calendar. Please try again.",
          )}
        </p>

        {error && import.meta.env.DEV && (
          <div className="mb-4 rounded bg-gray-100 p-3 text-left dark:bg-gray-700">
            <p className="break-all font-mono text-xs text-gray-700 dark:text-gray-300">
              {error.message}
            </p>
          </div>
        )}

        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t("calendar.error.retry", "Retry loading calendar")}
        >
          <RefreshCw className="h-4 w-4" />
          {t("calendar.error.retry_button", "Try Again")}
        </button>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {t("calendar.error.persist", "If the problem persists, please contact support.")}
        </p>
      </div>
    </div>
  );
};

// Wrapper component to use hooks
export const CalendarErrorBoundary: React.FC<Props> = (props) => {
  return <CalendarErrorBoundaryClass {...props} />;
};
