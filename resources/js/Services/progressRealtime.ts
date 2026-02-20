import { useUploadQueue } from "@/stores/uploadQueueStore";
import { useProcessingProgress } from "@/stores/processingProgressStore";
import axios from "axios";

// Polling intervals
const UPLOAD_POLL_INTERVAL = 500; // 500ms for uploads (Requirement 1.3)
const PROCESSING_POLL_INTERVAL = 1000; // 1s for processing (Requirement 3.3)

// Track active polling intervals
let uploadPollInterval: NodeJS.Timeout | null = null;
let processingPollInterval: NodeJS.Timeout | null = null;

// Track if WebSocket is available
let isWebSocketAvailable = false;

/**
 * Initialize real-time progress tracking for uploads and processing
 * Automatically falls back to polling if WebSocket is unavailable
 * 
 * @param userId - The authenticated user's ID
 */
export function initProgressRealtime(userId: number) {
  // Check if WebSocket is available
  isWebSocketAvailable = !!window.Echo;

  if (isWebSocketAvailable) {
    initWebSocketListeners(userId);
  } else {
    initPollingFallback();
  }
}

/**
 * Initialize WebSocket event listeners for real-time updates
 */
function initWebSocketListeners(userId: number) {
  if (!window.Echo) return;

  const channel = window.Echo.private(`users.${userId}`);

  // Listen for upload progress updates (Requirement 1.3)
  channel.listen(".UploadProgressUpdated", (event: any) => {
    handleUploadProgressUpdate(event);
  });

  // Listen for processing progress updates (Requirement 3.3)
  channel.listen(".ProcessingProgressUpdated", (event: any) => {
    handleProcessingProgressUpdate(event);
  });

  // Listen for video processing completion (Requirements 8.1, 8.2)
  channel.listen(".VideoProcessingCompleted", (event: any) => {
    handleVideoProcessingCompleted(event);
  });

  // Listen for processing failures
  channel.listen(".VideoProcessingFailed", (event: any) => {
    handleVideoProcessingFailed(event);
  });

  // Listen for processing cancellations
  channel.listen(".VideoProcessingCancelled", (event: any) => {
    handleVideoProcessingCancelled(event);
  });

  // Handle WebSocket connection errors - fallback to polling
  channel.error((error: any) => {
    isWebSocketAvailable = false;
    initPollingFallback();
  });
}

/**
 * Handle upload progress update events
 */
function handleUploadProgressUpdate(event: any) {
  const { uploadId, progress, stats } = event;

  const uploadStore = useUploadQueue.getState();
  const upload = uploadStore.queue[uploadId];

  if (upload) {
    // Update existing upload with new progress and stats
    uploadStore.updateUpload(uploadId, {
      progress: Math.min(100, Math.max(0, progress)),
      stats: stats ? {
        eta: stats.eta || 0,
        speed: stats.speed || 0,
        startTime: stats.startTime || upload.stats?.startTime || Date.now(),
        bytesUploaded: stats.bytesUploaded || 0,
        lastUpdateTime: Date.now(),
      } : upload.stats,
    });
  }
}

/**
 * Handle processing progress update events
 */
function handleProcessingProgressUpdate(event: any) {
  const {
    jobId,
    publicationId,
    progress,
    currentStep,
    completedSteps,
    totalSteps,
    eta,
  } = event;

  const processingStore = useProcessingProgress.getState();
  const job = processingStore.jobs[jobId];

  if (job) {
    // Update existing job
    processingStore.updateJob(jobId, {
      progress: Math.min(100, Math.max(0, progress)),
      status: "processing",
      stats: {
        eta: eta || 0,
        currentStep: currentStep || "",
        totalSteps: totalSteps || 0,
        completedSteps: completedSteps || 0,
      },
    });
  } else {
    // Add new job if it doesn't exist
    processingStore.addJob({
      id: jobId,
      publicationId,
      type: "video_processing",
      progress: Math.min(100, Math.max(0, progress)),
      status: "processing",
      stats: {
        eta: eta || 0,
        currentStep: currentStep || "",
        totalSteps: totalSteps || 0,
        completedSteps: completedSteps || 0,
      },
      startTime: Date.now(),
    });
  }
}

/**
 * Handle video processing completion events
 */
function handleVideoProcessingCompleted(event: any) {
  const { publicationId, status, errorMessage } = event;

  const processingStore = useProcessingProgress.getState();

  // Find job by publicationId
  const job = Object.values(processingStore.jobs).find(
    (j) => j.publicationId === publicationId
  );

  if (job) {
    processingStore.updateJob(job.id, {
      status: status === "completed" ? "completed" : "failed",
      progress: 100,
      error: errorMessage,
      completedTime: Date.now(),
    });

    // Remove completed job after a delay to allow UI to show completion
    setTimeout(() => {
      processingStore.removeJob(job.id);
    }, 3000);
  }
}

/**
 * Handle video processing failure events
 */
function handleVideoProcessingFailed(event: any) {
  const { jobId, publicationId, error } = event;

  const processingStore = useProcessingProgress.getState();
  const job = processingStore.jobs[jobId];

  if (job) {
    processingStore.updateJob(jobId, {
      status: "failed",
      error: error || "Processing failed",
      completedTime: Date.now(),
    });
  }
}

/**
 * Handle video processing cancellation events
 */
function handleVideoProcessingCancelled(event: any) {
  const { jobId } = event;

  const processingStore = useProcessingProgress.getState();
  processingStore.cancelJob(jobId);

  // Remove cancelled job after a delay
  setTimeout(() => {
    processingStore.removeJob(jobId);
  }, 2000);
}

/**
 * Initialize polling fallback when WebSocket is unavailable
 */
function initPollingFallback() {
  // Start upload progress polling
  if (!uploadPollInterval) {
    uploadPollInterval = setInterval(() => {
      pollUploadProgress();
    }, UPLOAD_POLL_INTERVAL);
  }

  // Start processing progress polling
  if (!processingPollInterval) {
    processingPollInterval = setInterval(() => {
      pollProcessingProgress();
    }, PROCESSING_POLL_INTERVAL);
  }
}

/**
 * Poll upload progress from the server
 */
async function pollUploadProgress() {
  const uploadStore = useUploadQueue.getState();
  const activeUploads = Object.values(uploadStore.queue).filter(
    (upload) => upload.status === "uploading" || upload.status === "pending"
  );

  if (activeUploads.length === 0) {
    return; // No active uploads to poll
  }

  const uploadIds = activeUploads.map((upload) => upload.id);

  try {
    const response = await axios.get("/api/progress", {
      params: {
        upload_ids: uploadIds,
      },
    });

    const { uploads } = response.data;

    // Update each upload with polled progress
    Object.entries(uploads || {}).forEach(([uploadId, progressData]: [string, any]) => {
      const upload = uploadStore.queue[uploadId];
      if (upload) {
        uploadStore.updateUpload(uploadId, {
          progress: Math.min(100, Math.max(0, progressData.progress || 0)),
          stats: {
            eta: progressData.eta || 0,
            speed: progressData.speed || 0,
            startTime: upload.stats?.startTime || Date.now(),
            bytesUploaded: progressData.bytes_uploaded || 0,
            lastUpdateTime: Date.now(),
          },
        });
      }
    });
  } catch (error) {
    }
}

/**
 * Poll processing progress from the server
 */
async function pollProcessingProgress() {
  const processingStore = useProcessingProgress.getState();
  const activeJobs = Object.values(processingStore.jobs).filter(
    (job) => job.status === "processing" || job.status === "queued"
  );

  if (activeJobs.length === 0) {
    return; // No active jobs to poll
  }

  const jobIds = activeJobs.map((job) => job.id);

  try {
    const response = await axios.get("/api/progress", {
      params: {
        job_ids: jobIds,
      },
    });

    const { jobs } = response.data;

    // Update each job with polled progress
    Object.entries(jobs || {}).forEach(([jobId, progressData]: [string, any]) => {
      const job = processingStore.jobs[jobId];
      if (job) {
        processingStore.updateJob(jobId, {
          progress: Math.min(100, Math.max(0, progressData.progress || 0)),
          status: progressData.progress >= 100 ? "completed" : "processing",
          stats: {
            eta: progressData.eta || 0,
            currentStep: progressData.current_step || "",
            totalSteps: progressData.total_steps || 0,
            completedSteps: progressData.completed_steps || 0,
          },
        });

        // If completed, remove after delay
        if (progressData.progress >= 100) {
          setTimeout(() => {
            processingStore.removeJob(jobId);
          }, 3000);
        }
      }
    });
  } catch (error) {
    }
}

/**
 * Stop all polling intervals
 * Call this when cleaning up or when WebSocket becomes available
 */
export function stopPolling() {
  if (uploadPollInterval) {
    clearInterval(uploadPollInterval);
    uploadPollInterval = null;
  }

  if (processingPollInterval) {
    clearInterval(processingPollInterval);
    processingPollInterval = null;
  }
}

/**
 * Cleanup function to stop all listeners and polling
 */
export function cleanupProgressRealtime(userId: number) {
  // Stop polling
  stopPolling();

  // Leave WebSocket channel if available
  if (window.Echo && isWebSocketAvailable) {
    try {
      window.Echo.leave(`users.${userId}`);
    } catch (error) {
      }
  }
}
