// Calendar Error Codes
export enum CalendarErrorCode {
  // Synchronization errors
  SYNC_FAILED = 'SYNC_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  
  // Operation errors
  BULK_OPERATION_PARTIAL_FAILURE = 'BULK_OPERATION_PARTIAL_FAILURE',
  INVALID_DATE = 'INVALID_DATE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Data errors
  PUBLICATION_NOT_FOUND = 'PUBLICATION_NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface CalendarError {
  code: CalendarErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export interface SyncError extends CalendarError {
  provider: 'google' | 'outlook';
  publicationId?: number;
  retryable: boolean;
  retryCount?: number;
}
