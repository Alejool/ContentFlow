import { router } from "@inertiajs/react";
import axios, { AxiosError } from "axios";
import { ToastService } from "./ToastService";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

class ErrorInterceptorClass {
  private retryCount = new Map<string, number>();
  private maxRetries = 2;

  initialize() {
    axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        await this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private async handleError(error: AxiosError<ErrorResponse>) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Network error
    if (!error.response) {
      return this.handleNetworkError(error);
    }

    // Handle by status code
    switch (status) {
      case 400:
        this.handle400(data);
        break;
      case 401:
        this.handle401();
        break;
      case 403:
        this.handle403(data);
        break;
      case 404:
        this.handle404(data);
        break;
      case 422:
        this.handle422(data);
        break;
      case 429:
        this.handle429(data);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        this.handle5xx(data);
        break;
      default:
        this.handleDefault(error);
    }
  }

  private handle400(data?: ErrorResponse) {
    const message = data?.message || "Bad request. Please check your input.";
    ToastService.error(message);
  }

  private handle401() {
    if (window.location.pathname === '/login') return;

    ToastService.error("Your session has expired. Please log in again.");
    setTimeout(() => {
      window.location.href = "/login";
    }, 60000);
  }

  private handle403(data?: ErrorResponse) {
    const message =
      data?.message || "You don't have permission to perform this action.";
    ToastService.error(message);
    console.error("403 Forbidden:", data);
  }

  private handle404(data?: ErrorResponse) {
    const message = data?.message || "The requested resource was not found.";
    ToastService.warning(message);
  }

  private handle422(data?: ErrorResponse) {
    if (data?.errors) {
      // Laravel validation errors
      ToastService.validationErrors(data.errors);
    } else {
      const message =
        data?.message || "Validation failed. Please check your input.";
      ToastService.error(message);
    }
  }

  private handle429(data?: ErrorResponse) {
    const message =
      data?.message || "Too many requests. Please wait a moment and try again.";
    ToastService.warning(message);
  }

  private handle5xx(data?: ErrorResponse) {
    const message =
      data?.message || "A server error occurred. Please try again later.";
    ToastService.error(message);

    // Log error for monitoring
    console.error("Server error:", data);
  }

  private handleNetworkError(error: AxiosError) {
    const config = error.config;

    if (!config) {
      ToastService.error("Network error. Please check your connection.");
      return;
    }

    // Retry logic
    const url = config.url || "";
    const retries = this.retryCount.get(url) || 0;

    if (retries < this.maxRetries) {
      this.retryCount.set(url, retries + 1);
      ToastService.info(
        `Connection failed. Retrying... (${retries + 1}/${this.maxRetries})`
      );

      // Retry after delay
      setTimeout(() => {
        axios.request(config);
      }, 1000 * (retries + 1));
    } else {
      this.retryCount.delete(url);
      ToastService.error(
        "Network error. Please check your connection and try again."
      );
    }
  }

  private handleDefault(error: AxiosError<ErrorResponse>) {
    const message =
      error.response?.data?.message || "An unexpected error occurred.";
    ToastService.error(message);
    console.error("Unexpected error:", error);
  }
}

export const ErrorInterceptor = new ErrorInterceptorClass();
