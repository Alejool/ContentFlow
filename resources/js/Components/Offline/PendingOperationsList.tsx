import React, { useEffect, useState } from 'react';
import { useOffline } from '@/Hooks/useOffline';
import type { QueuedOperation } from '@/types/optimistic';
import { 
  RefreshCw, 
  Trash2, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video,
  Calendar
} from 'lucide-react';

/**
 * PendingOperationsList Component
 * 
 * Displays a list of pending operations with:
 * - Operation status (queued, syncing, failed)
 * - Retry and discard actions
 * - Visual feedback for each operation
 * 
 * Requirements: 6.5
 */
export const PendingOperationsList: React.FC = () => {
  const { getQueuedOperations, syncNow, clearFailed, isOnline } = useOffline();
  const [operations, setOperations] = useState<QueuedOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Load operations on mount and refresh periodically
  useEffect(() => {
    loadOperations();
    
    // Refresh every 2 seconds to show sync progress
    const interval = setInterval(loadOperations, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOperations = async () => {
    try {
      const ops = await getQueuedOperations();
      setOperations(ops);
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (operationId: string) => {
    if (!isOnline) {
      return;
    }

    setRetryingId(operationId);
    try {
      await syncNow();
      await loadOperations();
    } catch (error) {
      } finally {
      setRetryingId(null);
    }
  };

  const handleClearFailed = async () => {
    try {
      await clearFailed();
      await loadOperations();
    } catch (error) {
      }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case 'posts':
      case 'publications':
        return <FileText className="h-4 w-4" />;
      case 'images':
        return <ImageIcon className="h-4 w-4" />;
      case 'videos':
      case 'reels':
        return <Video className="h-4 w-4" />;
      case 'calendar':
      case 'events':
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: QueuedOperation['status']) => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Clock className="h-3 w-3" />
            Queued
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          All caught up!
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          No pending operations
        </p>
      </div>
    );
  }

  const failedOps = operations.filter(op => op.status === 'failed');

  return (
    <div className="space-y-4">
      {/* Header with clear failed button */}
      {failedOps.length > 0 && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {failedOps.length} failed operation{failedOps.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleClearFailed}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
          >
            Clear all failed
          </button>
        </div>
      )}

      {/* Operations list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {operations.map((operation) => (
          <div
            key={operation.id}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Resource icon */}
              <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">
                {getResourceIcon(operation.resource)}
              </div>

              {/* Operation details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {operation.description || `${operation.method} ${operation.resource}`}
                  </p>
                  {getStatusBadge(operation.status)}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(operation.timestamp)}
                </p>

                {/* Error message for failed operations */}
                {operation.status === 'failed' && operation.lastError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 line-clamp-2">
                    {operation.lastError}
                  </p>
                )}

                {/* Retry count */}
                {operation.retryCount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Retry {operation.retryCount}/{operation.maxRetries}
                  </p>
                )}
              </div>

              {/* Actions */}
              {operation.status === 'failed' && (
                <div className="flex-shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => handleRetry(operation.id)}
                    disabled={!isOnline || retryingId === operation.id}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Retry operation"
                    aria-label="Retry operation"
                  >
                    <RefreshCw 
                      className={`h-4 w-4 ${retryingId === operation.id ? 'animate-spin' : ''}`} 
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Offline notice */}
      {!isOnline && operations.some(op => op.status === 'queued') && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Operations will sync automatically when you're back online
          </p>
        </div>
      )}
    </div>
  );
};
