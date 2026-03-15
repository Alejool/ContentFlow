/**
 * Skeleton loader for calendar during initial data fetch
 * Provides visual feedback while calendar events are loading
 */
export function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Calendar header skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`header-${i}`} className="h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
        ))}

        {/* Calendar days */}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={`day-${i}`} className="h-24 rounded bg-gray-100 p-2 dark:bg-gray-800">
            <div className="mb-2 h-4 w-8 rounded bg-gray-200 dark:bg-gray-700"></div>
            {i % 3 === 0 && <div className="h-6 rounded bg-gray-200 dark:bg-gray-700"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Inline spinner for operations in progress
 * Used during bulk operations, drag & drop updates, etc.
 */
export function CalendarSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-primary-600 border-t-transparent`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Loading overlay for blocking operations
 * Disables controls and shows spinner during critical operations
 */
interface LoadingOverlayProps {
  message?: string;
  show: boolean;
}

export function LoadingOverlay({ message = 'Processing...', show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80"
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      <CalendarSpinner size="lg" />
      <p className="mt-4 font-medium text-gray-700 dark:text-gray-300">{message}</p>
    </div>
  );
}
