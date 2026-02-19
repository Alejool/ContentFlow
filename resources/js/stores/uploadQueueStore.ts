import { create } from "zustand";

const STORAGE_KEY = "upload_queue_state";
const STATE_VERSION = 1;
const STATE_EXPIRY_DAYS = 7;

export interface UploadStats {
  eta: number; // Estimated time remaining in seconds
  speed: number; // Upload speed in bytes/second
  startTime: number; // Upload start timestamp
  bytesUploaded: number; // Total bytes uploaded
  lastUpdateTime: number; // Last progress update timestamp
}

export interface QueuedUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "paused" | "completed" | "error" | "cancelled";
  publicationId?: number;
  publicationTitle?: string;
  s3Key?: string;
  error?: string;
  stats?: UploadStats;

  // New fields for pause/resume
  uploadId?: string; // Multipart upload ID for resumption
  uploadedParts?: Array<{
    // Completed parts for multipart uploads
    PartNumber: number;
    ETag: string;
  }>;
  abortController?: AbortController; // For cancellation
  isPausable: boolean; // Whether this upload supports pausing
  
  // Retry tracking
  retryCount?: number; // Number of retry attempts made
  lastError?: string; // Last error message for debugging
  canRetry?: boolean; // Whether retry is available
}

interface PersistedUpload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  status: string;
  s3Key?: string;
  uploadId?: string;
  uploadedParts?: Array<{
    PartNumber: number;
    ETag: string;
  }>;
  publicationId?: number;
  publicationTitle?: string;
  timestamp: number;
}

interface PersistedUploadState {
  version: number;
  uploads: Record<string, PersistedUpload>;
}

interface UploadQueueState {
  queue: Record<string, QueuedUpload>;
  persistedState: Record<string, Partial<QueuedUpload>>;
  hasRestoredState: boolean;
  showResumePrompt: boolean;

  addUpload: (id: string, file: File) => void;
  updateUpload: (id: string, updates: Partial<QueuedUpload>) => void;
  removeUpload: (id: string) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => void;
  linkUploadToPublication: (
    id: string,
    publicationId: number,
    publicationTitle?: string,
  ) => void;

  // Persistence methods
  persistState: () => void;
  restoreState: () => void;
  clearPersistedUpload: (id: string) => void;
  initializeStore: () => void;
  dismissResumePrompt: () => void;
  clearAllPersistedUploads: () => void;
}

export const useUploadQueue = create<UploadQueueState>((set, get) => ({
  queue: {},
  persistedState: {},
  hasRestoredState: false,
  showResumePrompt: false,

  addUpload: (id, file) =>
    set((state) => ({
      queue: {
        ...state.queue,
        [id]: {
          id,
          file,
          progress: 0,
          status: "pending",
          isPausable: false, // Will be set to true when multipart upload starts
          retryCount: 0,
          canRetry: true,
        },
      },
    })),

  updateUpload: (id, updates) =>
    set((state) => {
      const current = state.queue[id];
      if (!current) return state;
      const updated = {
        queue: {
          ...state.queue,
          [id]: { ...current, ...updates },
        },
      };
      // Auto-persist on update
      setTimeout(() => get().persistState(), 0);
      return updated;
    }),

  removeUpload: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.queue;
      // Clear persisted state when removing
      setTimeout(() => get().clearPersistedUpload(id), 0);
      return { queue: rest };
    }),

  pauseUpload: (id) =>
    set((state) => {
      const upload = state.queue[id];
      if (!upload || !upload.isPausable || upload.status !== "uploading") {
        return state;
      }

      // Abort the current upload operation
      if (upload.abortController) {
        upload.abortController.abort();
      }

      const updated = {
        queue: {
          ...state.queue,
          [id]: {
            ...upload,
            status: "paused" as const,
          },
        },
      };

      // Persist state for resumption
      setTimeout(() => get().persistState(), 0);
      return updated;
    }),

  resumeUpload: (id) =>
    set((state) => {
      const upload = state.queue[id];
      if (!upload || upload.status !== "paused") {
        return state;
      }

      return {
        queue: {
          ...state.queue,
          [id]: {
            ...upload,
            status: "uploading" as const,
            abortController: new AbortController(), // Create new controller for resumed upload
          },
        },
      };
    }),

  cancelUpload: (id) =>
    set((state) => {
      const upload = state.queue[id];
      if (!upload) return state;

      // Abort the current upload operation
      if (upload.abortController) {
        upload.abortController.abort();
      }

      const updated = {
        queue: {
          ...state.queue,
          [id]: {
            ...upload,
            status: "cancelled" as const,
          },
        },
      };

      // Clear persisted state
      setTimeout(() => get().clearPersistedUpload(id), 0);
      return updated;
    }),

  retryUpload: (id) =>
    set((state) => {
      const upload = state.queue[id];
      if (!upload || upload.status !== "error") {
        return state;
      }

      const retryCount = (upload.retryCount || 0) + 1;
      const maxRetries = 3;

      return {
        queue: {
          ...state.queue,
          [id]: {
            ...upload,
            status: "pending" as const,
            error: undefined,
            lastError: upload.error,
            retryCount,
            canRetry: retryCount < maxRetries,
            abortController: new AbortController(),
          },
        },
      };
    }),

  linkUploadToPublication: (id, publicationId, publicationTitle) =>
    set((state) => {
      const item = state.queue[id];
      if (!item) return state;
      return {
        queue: {
          ...state.queue,
          [id]: { ...item, publicationId, publicationTitle },
        },
      };
    }),

  persistState: () => {
    const state = get();
    const uploads: Record<string, PersistedUpload> = {};

    // Only persist uploads that are in progress or paused
    Object.values(state.queue).forEach((upload) => {
      if (
        upload.status === "uploading" ||
        upload.status === "paused" ||
        upload.status === "pending"
      ) {
        uploads[upload.id] = {
          id: upload.id,
          fileName: upload.file.name,
          fileSize: upload.file.size,
          fileType: upload.file.type,
          progress: upload.progress,
          status: upload.status,
          s3Key: upload.s3Key,
          uploadId: upload.uploadId,
          uploadedParts: upload.uploadedParts,
          publicationId: upload.publicationId,
          publicationTitle: upload.publicationTitle,
          timestamp: Date.now(),
        };
      }
    });

    const persistedState: PersistedUploadState = {
      version: STATE_VERSION,
      uploads,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      console.error("Failed to persist upload state:", error);
    }
  },

  restoreState: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const persistedState: PersistedUploadState = JSON.parse(stored);

      // Validate schema version
      if (persistedState.version !== STATE_VERSION) {
        console.warn("Upload state schema version mismatch, clearing state");
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const now = Date.now();
      const expiryTime = STATE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const restoredUploads: Record<string, Partial<QueuedUpload>> = {};

      // Validate and restore each upload
      Object.values(persistedState.uploads).forEach((upload) => {
        // Check if state is expired
        if (now - upload.timestamp > expiryTime) {
          console.warn(`Upload ${upload.id} state expired, skipping`);
          return;
        }

        // Validate required fields
        if (
          !upload.id ||
          !upload.fileName ||
          typeof upload.fileSize !== "number" ||
          typeof upload.progress !== "number"
        ) {
          console.warn(`Upload ${upload.id} has invalid state, skipping`);
          return;
        }

        restoredUploads[upload.id] = {
          id: upload.id,
          progress: upload.progress,
          status: upload.status as QueuedUpload["status"],
          s3Key: upload.s3Key,
          uploadId: upload.uploadId,
          uploadedParts: upload.uploadedParts,
          publicationId: upload.publicationId,
          publicationTitle: upload.publicationTitle,
          isPausable: !!upload.uploadId, // If we have an uploadId, it's pausable
        };
      });

      set({ persistedState: restoredUploads });
    } catch (error) {
      console.error("Failed to restore upload state:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  clearPersistedUpload: (id) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const persistedState: PersistedUploadState = JSON.parse(stored);
      delete persistedState.uploads[id];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      set((state) => {
        const { [id]: _, ...rest } = state.persistedState;
        return { persistedState: rest };
      });
    } catch (error) {
      console.error("Failed to clear persisted upload:", error);
    }
  },

  initializeStore: () => {
    const state = get();
    
    // Only restore once
    if (state.hasRestoredState) return;
    
    // Restore persisted state
    get().restoreState();
    
    // Check if there are any incomplete uploads to resume
    const persistedUploads = Object.values(get().persistedState);
    const hasIncompleteUploads = persistedUploads.some(
      (upload) => upload.status === "uploading" || upload.status === "paused" || upload.status === "pending"
    );
    
    set({ 
      hasRestoredState: true,
      showResumePrompt: hasIncompleteUploads 
    });
  },

  dismissResumePrompt: () => {
    set({ showResumePrompt: false });
  },

  clearAllPersistedUploads: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      set({ persistedState: {}, showResumePrompt: false });
    } catch (error) {
      console.error("Failed to clear all persisted uploads:", error);
    }
  },
}));
