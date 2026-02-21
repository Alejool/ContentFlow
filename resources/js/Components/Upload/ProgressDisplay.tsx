import { Pause, Play, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatSpeed, formatTime } from "@/Utils/formatters";

export interface ProgressDisplayProps {
  percentage: number;
  eta?: number;
  speed?: number;
  status: "pending" | "uploading" | "paused" | "completed" | "error" | "cancelled" | "processing";
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  isPausable: boolean;
  isPaused: boolean;
  error?: string;
  retryCount?: number;
  canRetry?: boolean;
}

export function ProgressDisplay({
  percentage,
  eta,
  speed,
  status,
  onPause,
  onResume,
  onCancel,
  onRetry,
  isPausable,
  isPaused,
  error,
  retryCount,
  canRetry,
}: ProgressDisplayProps) {
  const { t } = useTranslation();

  // Ensure progress is a valid number between 0-100
  const validPercentage = Math.min(100, Math.max(0, Math.round(percentage || 0)));

  const getProgressColor = () => {
    switch (status) {
      case "error":
        return "bg-red-500 dark:bg-red-600";
      case "completed":
        return "bg-green-500 dark:bg-green-600";
      case "cancelled":
        return "bg-gray-400 dark:bg-neutral-500";
      case "paused":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "uploading":
      case "processing":
        return "bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 dark:from-primary-500 dark:via-primary-600 dark:to-primary-500 animate-pulse";
      default:
        return "bg-primary-500 dark:bg-primary-600";
    }
  };

  const getStatusText = () => {
    if (status === "error" && error) {
      return error;
    }
    if (status === "uploading" && eta) {
      return `~${formatTime(eta)} ${t("common.upload.left")}`;
    }
    if (status === "processing") {
      return t("common.upload.processing");
    }
    if (status === "completed") {
      return t("common.upload.done");
    }
    if (status === "paused") {
      return t("common.upload.paused");
    }
    if (status === "cancelled") {
      return t("common.upload.cancelled");
    }
    return t("common.upload.pending");
  };

  const showControls = status === "uploading" || status === "paused";
  const showRetry = status === "error" && canRetry && onRetry;
  const showMaxRetriesMessage = status === "error" && !canRetry && retryCount && retryCount >= 3;

  return (
    <div className="space-y-2">
      {/* Progress bar with ARIA live region */}
      <div
        className="relative h-2.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden shadow-inner"
        role="progressbar"
        aria-valuenow={validPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("common.upload.progress")}
      >
        <div
          className={`absolute h-full transition-all duration-300 ${getProgressColor()} ${
            status === "uploading" || status === "processing" ? "shadow-lg" : ""
          }`}
          style={{ width: `${validPercentage}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="font-semibold text-gray-700 dark:text-neutral-300"
          aria-live="polite"
          aria-atomic="true"
        >
          {validPercentage}%
        </span>
        {eta !== undefined && status === "uploading" && (
          <span
            className="text-gray-500 dark:text-neutral-400"
            aria-live="polite"
            aria-label={t("common.upload.eta")}
          >
            {formatTime(eta)} {t("common.upload.left")}
          </span>
        )}
        {speed !== undefined && status === "uploading" && (
          <span
            className="text-gray-500 dark:text-neutral-400"
            aria-live="polite"
            aria-label={t("common.upload.speed")}
          >
            {formatSpeed(speed)}
          </span>
        )}
      </div>

      {/* Status text */}
      <div
        className="text-xs text-gray-600 dark:text-neutral-400"
        aria-live="polite"
        aria-atomic="true"
      >
        {getStatusText()}
      </div>

      {/* Error details and retry info */}
      {status === "error" && (
        <div className="space-y-2">
          {retryCount !== undefined && retryCount > 0 && (
            <div className="text-xs text-gray-500 dark:text-neutral-500">
              {t("common.upload.retryAttempt", { count: retryCount })}
            </div>
          )}
          {showMaxRetriesMessage && (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              {t("common.upload.maxRetriesReached")}
            </div>
          )}
        </div>
      )}

      {/* Control buttons */}
      {showControls && (
        <div className="flex gap-2 pt-1">
          {isPausable && !isPaused && onPause && (
            <button
              onClick={onPause}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-200 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
              aria-label={t("common.upload.pause")}
              type="button"
            >
              <Pause className="w-3 h-3" aria-hidden="true" />
              {t("common.upload.pause")}
            </button>
          )}
          {isPaused && onResume && (
            <button
              onClick={onResume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
              aria-label={t("common.upload.resume")}
              type="button"
            >
              <Play className="w-3 h-3" aria-hidden="true" />
              {t("common.upload.resume")}
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
              aria-label={t("common.cancel")}
              type="button"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              {t("common.cancel")}
            </button>
          )}
        </div>
      )}

      {/* Retry button */}
      {showRetry && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
            aria-label={t("common.upload.retry")}
            type="button"
          >
            <Play className="w-3 h-3" aria-hidden="true" />
            {t("common.upload.retry")}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-200 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
              aria-label={t("common.upload.dismiss")}
              type="button"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              {t("common.upload.dismiss")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
