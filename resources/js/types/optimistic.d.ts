// Type definitions for Optimistic Updates and PWA features

export interface OptimisticOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  resourceId?: string | number;
  optimisticData: any;
  originalData: any | null;
  request: Promise<any>;
  status: 'pending' | 'success' | 'failed' | 'rolled_back';
  timestamp: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onRollback?: () => void;
}

export interface OptimisticState {
  operations: Map<string, OptimisticOperation>;
  failedOperations: OptimisticOperation[];
  isOnline: boolean;
  addOperation: (operation: OptimisticOperation) => void;
  confirmOperation: (id: string, serverData: any) => void;
  rollbackOperation: (id: string, error: Error) => void;
  getPendingOperations: (resource: string) => OptimisticOperation[];
  persist: () => void;
  restore: () => void;
}

export interface OptimisticOptions {
  resource: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onRollback?: () => void;
  retryOnError?: boolean;
  maxRetries?: number;
}

export interface QueuedOperation {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  resource: string;
  resourceId?: string | number;
  description: string;
  timestamp: number;
  priority: number;
  retryCount: number;
  maxRetries: number;
  status: 'queued' | 'syncing' | 'failed' | 'completed';
  lastError?: string;
  failedAt?: number;
}

export interface OfflineOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  syncOnReconnect?: boolean;
}

export interface CacheEntry {
  url: string;
  method: string;
  cachedAt: number;
  expiresAt?: number;
  lastAccessed: number;
  accessCount: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  size: number;
  response: Response;
}

export interface SyncOperation {
  id: string;
  url: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

export interface InterceptorConfig {
  optimistic?: boolean;
  optimisticData?: any;
  resource?: string;
  rollbackOnError?: boolean;
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    optimistic?: boolean;
    optimisticData?: any;
    resource?: string;
    rollbackOnError?: boolean;
  }
}
