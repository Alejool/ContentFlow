interface ErrorLogEntry {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
}

class ErrorLoggerClass {
  private endpoint = "/api/log-error";

  /**
   * Log an error to the backend
   */
  async log(
    error: Error | string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      const entry: ErrorLogEntry = {
        message: typeof error === "string" ? error : error.message,
        stack: typeof error === "object" ? error.stack : undefined,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error("Error logged:", entry);
      }

      // Send to backend (don't await to avoid blocking)
      fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(entry),
      }).catch((err) => {
        // Silently fail if logging fails
        console.error("Failed to send error log:", err);
      });
    } catch (err) {
      // Don't throw errors from the error logger
      console.error("Error in ErrorLogger:", err);
    }
  }

  /**
   * Log a critical error (will also show toast)
   */
  critical(error: Error | string, context?: Record<string, any>): void {
    this.log(error, { ...context, severity: "critical" });
  }
}

export const ErrorLogger = new ErrorLoggerClass();
