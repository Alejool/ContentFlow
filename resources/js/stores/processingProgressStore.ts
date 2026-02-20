import { create } from "zustand";

export interface ProcessingJob {
  id: string;
  publicationId: number;
  type: "video_processing" | "reel_generation" | "thumbnail_generation";
  progress: number;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  stats?: {
    eta: number;
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
  };
  error?: string;
  startTime: number;
  completedTime?: number;
}

interface ProcessingProgressState {
  jobs: Record<string, ProcessingJob>;

  addJob: (job: ProcessingJob) => void;
  updateJob: (id: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (id: string) => void;
  cancelJob: (id: string) => void;
}

export const useProcessingProgress = create<ProcessingProgressState>(
  (set, get) => ({
    jobs: {},

    addJob: (job) =>
      set((state) => ({
        jobs: {
          ...state.jobs,
          [job.id]: job,
        },
      })),

    updateJob: (id, updates) =>
      set((state) => {
        const current = state.jobs[id];
        if (!current) return state;

        return {
          jobs: {
            ...state.jobs,
            [id]: { ...current, ...updates },
          },
        };
      }),

    removeJob: (id) =>
      set((state) => {
        const { [id]: _, ...rest } = state.jobs;
        return { jobs: rest };
      }),

    cancelJob: (id) =>
      set((state) => {
        const job = state.jobs[id];
        if (!job) return state;

        return {
          jobs: {
            ...state.jobs,
            [id]: {
              ...job,
              status: "cancelled" as const,
            },
          },
        };
      }),
  }),
);

// WebSocket listener initialization
export function initProcessingProgressRealtime(userId: number) {
  if (!window.Echo) {
    return;
  }

  const channel = window.Echo.private(`users.${userId}`);

  // Listen for processing progress updates
  channel.listen(".ProcessingProgressUpdated", (e: any) => {
    const { jobId, publicationId, progress, stats } = e;

    const store = useProcessingProgress.getState();
    const existingJob = store.jobs[jobId];

    if (existingJob) {
      // Update existing job
      store.updateJob(jobId, {
        progress,
        stats,
      });
    } else {
      // Add new job if it doesn't exist
      store.addJob({
        id: jobId,
        publicationId,
        type: "video_processing",
        progress,
        status: "processing",
        stats,
        startTime: Date.now(),
      });
    }
  });

  // Listen for processing completion
  channel.listen(".VideoProcessingCompleted", (e: any) => {
    const { jobId, publicationId } = e;

    const store = useProcessingProgress.getState();
    const job = store.jobs[jobId];

    if (job) {
      store.updateJob(jobId, {
        status: "completed",
        progress: 100,
        completedTime: Date.now(),
      });

      // Remove completed job after a delay to allow UI to show completion
      setTimeout(() => {
        store.removeJob(jobId);
      }, 3000);
    }
  });

  // Listen for processing failures
  channel.listen(".VideoProcessingFailed", (e: any) => {
    const { jobId, error } = e;

    const store = useProcessingProgress.getState();
    const job = store.jobs[jobId];

    if (job) {
      store.updateJob(jobId, {
        status: "failed",
        error: error || "Processing failed",
        completedTime: Date.now(),
      });
    }
  });

  // Listen for processing cancellations
  channel.listen(".VideoProcessingCancelled", (e: any) => {
    const { jobId } = e;

    const store = useProcessingProgress.getState();
    store.cancelJob(jobId);

    // Remove cancelled job after a delay
    setTimeout(() => {
      store.removeJob(jobId);
    }, 2000);
  });
}
