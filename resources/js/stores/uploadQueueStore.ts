import { create } from "zustand";

export interface QueuedUpload {
  id: string; // tempId
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  publicationId?: number; // Linked after saving
  publicationTitle?: string; // For notifications
  s3Key?: string;
  error?: string;
  stats?: { eta?: number; speed?: number };
}

interface UploadQueueState {
  queue: Record<string, QueuedUpload>;

  // Actions
  addUpload: (id: string, file: File) => void;
  updateUpload: (id: string, updates: Partial<QueuedUpload>) => void;
  removeUpload: (id: string) => void;
  linkUploadToPublication: (
    id: string,
    publicationId: number,
    publicationTitle?: string,
  ) => void;
}

export const useUploadQueue = create<UploadQueueState>((set) => ({
  queue: {},

  addUpload: (id, file) =>
    set((state) => ({
      queue: {
        ...state.queue,
        [id]: {
          id,
          file,
          progress: 0,
          status: "pending",
        },
      },
    })),

  updateUpload: (id, updates) =>
    set((state) => {
      const current = state.queue[id];
      if (!current) return state; // Don't update if removed
      return {
        queue: {
          ...state.queue,
          [id]: { ...current, ...updates },
        },
      };
    }),

  removeUpload: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.queue;
      return { queue: rest };
    }),

  linkUploadToPublication: (id, publicationId, publicationTitle) =>
    set((state) => {
      const item = state.queue[id];
      if (!item) return state;
      return {
        queue: {
          ...state.queue,
          [id]: { ...item, publicationId, publicationTitle }, // Link it!
        },
      };
    }),
}));
