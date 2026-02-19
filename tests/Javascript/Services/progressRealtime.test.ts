import {
  initProgressRealtime,
  stopPolling,
  cleanupProgressRealtime,
} from '@/Services/progressRealtime';
import { useUploadQueue } from '@/stores/uploadQueueStore';
import { useProcessingProgress } from '@/stores/processingProgressStore';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

// Mock stores
vi.mock('@/stores/uploadQueueStore');
vi.mock('@/stores/processingProgressStore');

// Mock axios
vi.mock('axios');

// Mock window.Echo
const mockListen = vi.fn().mockReturnThis();
const mockError = vi.fn().mockReturnThis();
const mockLeave = vi.fn();
const mockPrivate = vi.fn().mockReturnValue({
  listen: mockListen,
  error: mockError,
});

global.window.Echo = {
  private: mockPrivate,
  leave: mockLeave,
} as any;

describe('progressRealtime', () => {
  const mockUpdateUpload = vi.fn();
  const mockAddJob = vi.fn();
  const mockUpdateJob = vi.fn();
  const mockRemoveJob = vi.fn();
  const mockCancelJob = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup upload queue store mock
    (useUploadQueue as any).mockReturnValue({
      queue: {},
      updateUpload: mockUpdateUpload,
    });

    (useUploadQueue.getState as any) = vi.fn().mockReturnValue({
      queue: {},
      updateUpload: mockUpdateUpload,
    });

    // Setup processing progress store mock
    (useProcessingProgress as any).mockReturnValue({
      jobs: {},
      addJob: mockAddJob,
      updateJob: mockUpdateJob,
      removeJob: mockRemoveJob,
      cancelJob: mockCancelJob,
    });

    (useProcessingProgress.getState as any) = vi.fn().mockReturnValue({
      jobs: {},
      addJob: mockAddJob,
      updateJob: mockUpdateJob,
      removeJob: mockRemoveJob,
      cancelJob: mockCancelJob,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    stopPolling();
  });

  describe('WebSocket initialization', () => {
    it('initializes WebSocket listeners when Echo is available', () => {
      initProgressRealtime(123);

      expect(mockPrivate).toHaveBeenCalledWith('users.123');
      expect(mockListen).toHaveBeenCalledWith('.UploadProgressUpdated', expect.any(Function));
      expect(mockListen).toHaveBeenCalledWith('.ProcessingProgressUpdated', expect.any(Function));
      expect(mockListen).toHaveBeenCalledWith('.VideoProcessingCompleted', expect.any(Function));
      expect(mockListen).toHaveBeenCalledWith('.VideoProcessingFailed', expect.any(Function));
      expect(mockListen).toHaveBeenCalledWith('.VideoProcessingCancelled', expect.any(Function));
      expect(mockError).toHaveBeenCalledWith(expect.any(Function));
    });

    it('falls back to polling when Echo is not available', () => {
      const originalEcho = global.window.Echo;
      global.window.Echo = undefined as any;

      initProgressRealtime(123);

      // Should not call Echo methods
      expect(mockPrivate).not.toHaveBeenCalled();

      // Restore Echo
      global.window.Echo = originalEcho;
    });
  });

  describe('Upload progress updates', () => {
    it('handles upload progress update events', () => {
      const mockUpload = {
        id: 'upload-1',
        file: new File(['test'], 'test.mp4'),
        progress: 50,
        status: 'uploading',
        isPausable: true,
      };

      (useUploadQueue.getState as any) = vi.fn().mockReturnValue({
        queue: { 'upload-1': mockUpload },
        updateUpload: mockUpdateUpload,
      });

      initProgressRealtime(123);

      // Get the listener function
      const uploadProgressListener = mockListen.mock.calls.find(
        (call) => call[0] === '.UploadProgressUpdated'
      )?.[1];

      expect(uploadProgressListener).toBeDefined();

      // Simulate event
      uploadProgressListener({
        uploadId: 'upload-1',
        progress: 75,
        stats: {
          eta: 30,
          speed: 1024000,
          bytesUploaded: 5000000,
        },
      });

      expect(mockUpdateUpload).toHaveBeenCalledWith('upload-1', {
        progress: 75,
        stats: expect.objectContaining({
          eta: 30,
          speed: 1024000,
          bytesUploaded: 5000000,
        }),
      });
    });

    it('clamps progress percentage between 0 and 100', () => {
      const mockUpload = {
        id: 'upload-1',
        file: new File(['test'], 'test.mp4'),
        progress: 50,
        status: 'uploading',
        isPausable: true,
      };

      (useUploadQueue.getState as any) = vi.fn().mockReturnValue({
        queue: { 'upload-1': mockUpload },
        updateUpload: mockUpdateUpload,
      });

      initProgressRealtime(123);

      const uploadProgressListener = mockListen.mock.calls.find(
        (call) => call[0] === '.UploadProgressUpdated'
      )?.[1];

      // Test upper bound
      uploadProgressListener({
        uploadId: 'upload-1',
        progress: 150,
        stats: {},
      });

      expect(mockUpdateUpload).toHaveBeenCalledWith('upload-1', expect.objectContaining({
        progress: 100,
      }));

      // Test lower bound
      uploadProgressListener({
        uploadId: 'upload-1',
        progress: -10,
        stats: {},
      });

      expect(mockUpdateUpload).toHaveBeenCalledWith('upload-1', expect.objectContaining({
        progress: 0,
      }));
    });
  });

  describe('Processing progress updates', () => {
    it('handles processing progress update events for existing jobs', () => {
      const mockJob = {
        id: 'job-1',
        publicationId: 456,
        type: 'video_processing',
        progress: 30,
        status: 'processing',
        startTime: Date.now(),
      };

      (useProcessingProgress.getState as any) = vi.fn().mockReturnValue({
        jobs: { 'job-1': mockJob },
        updateJob: mockUpdateJob,
        addJob: mockAddJob,
      });

      initProgressRealtime(123);

      const processingProgressListener = mockListen.mock.calls.find(
        (call) => call[0] === '.ProcessingProgressUpdated'
      )?.[1];

      processingProgressListener({
        jobId: 'job-1',
        publicationId: 456,
        progress: 60,
        currentStep: 'Optimizing video',
        completedSteps: 3,
        totalSteps: 5,
        eta: 120,
      });

      expect(mockUpdateJob).toHaveBeenCalledWith('job-1', {
        progress: 60,
        status: 'processing',
        stats: {
          eta: 120,
          currentStep: 'Optimizing video',
          totalSteps: 5,
          completedSteps: 3,
        },
      });
    });

    it('adds new job if it does not exist', () => {
      (useProcessingProgress.getState as any) = vi.fn().mockReturnValue({
        jobs: {},
        updateJob: mockUpdateJob,
        addJob: mockAddJob,
      });

      initProgressRealtime(123);

      const processingProgressListener = mockListen.mock.calls.find(
        (call) => call[0] === '.ProcessingProgressUpdated'
      )?.[1];

      processingProgressListener({
        jobId: 'job-2',
        publicationId: 789,
        progress: 25,
        currentStep: 'Analyzing video',
        completedSteps: 1,
        totalSteps: 4,
        eta: 180,
      });

      expect(mockAddJob).toHaveBeenCalledWith({
        id: 'job-2',
        publicationId: 789,
        type: 'video_processing',
        progress: 25,
        status: 'processing',
        stats: {
          eta: 180,
          currentStep: 'Analyzing video',
          totalSteps: 4,
          completedSteps: 1,
        },
        startTime: expect.any(Number),
      });
    });
  });

  describe('Processing completion events', () => {
    it('handles video processing completion', () => {
      const mockJob = {
        id: 'job-1',
        publicationId: 456,
        type: 'video_processing',
        progress: 90,
        status: 'processing',
        startTime: Date.now(),
      };

      (useProcessingProgress.getState as any) = vi.fn().mockReturnValue({
        jobs: { 'job-1': mockJob },
        updateJob: mockUpdateJob,
        removeJob: mockRemoveJob,
      });

      initProgressRealtime(123);

      const completionListener = mockListen.mock.calls.find(
        (call) => call[0] === '.VideoProcessingCompleted'
      )?.[1];

      completionListener({
        publicationId: 456,
        status: 'completed',
      });

      expect(mockUpdateJob).toHaveBeenCalledWith('job-1', {
        status: 'completed',
        progress: 100,
        error: undefined,
        completedTime: expect.any(Number),
      });

      // Fast-forward to after the removal delay
      vi.advanceTimersByTime(3000);

      expect(mockRemoveJob).toHaveBeenCalledWith('job-1');
    });

    it('handles video processing failure', () => {
      const mockJob = {
        id: 'job-1',
        publicationId: 456,
        type: 'video_processing',
        progress: 50,
        status: 'processing',
        startTime: Date.now(),
      };

      (useProcessingProgress.getState as any) = vi.fn().mockReturnValue({
        jobs: { 'job-1': mockJob },
        updateJob: mockUpdateJob,
      });

      initProgressRealtime(123);

      const failureListener = mockListen.mock.calls.find(
        (call) => call[0] === '.VideoProcessingFailed'
      )?.[1];

      failureListener({
        jobId: 'job-1',
        publicationId: 456,
        error: 'Processing failed due to invalid format',
      });

      expect(mockUpdateJob).toHaveBeenCalledWith('job-1', {
        status: 'failed',
        error: 'Processing failed due to invalid format',
        completedTime: expect.any(Number),
      });
    });

    it('handles video processing cancellation', () => {
      (useProcessingProgress.getState as any) = vi.fn().mockReturnValue({
        jobs: {},
        cancelJob: mockCancelJob,
        removeJob: mockRemoveJob,
      });

      initProgressRealtime(123);

      const cancellationListener = mockListen.mock.calls.find(
        (call) => call[0] === '.VideoProcessingCancelled'
      )?.[1];

      cancellationListener({
        jobId: 'job-1',
      });

      expect(mockCancelJob).toHaveBeenCalledWith('job-1');

      // Fast-forward to after the removal delay
      vi.advanceTimersByTime(2000);

      expect(mockRemoveJob).toHaveBeenCalledWith('job-1');
    });
  });

  describe('Polling fallback', () => {
    it('polls upload progress when WebSocket is unavailable', async () => {
      const originalEcho = global.window.Echo;
      global.window.Echo = undefined as any;

      const mockUpload = {
        id: 'upload-1',
        file: new File(['test'], 'test.mp4'),
        progress: 30,
        status: 'uploading',
        isPausable: true,
      };

      (useUploadQueue.getState as any) = vi.fn().mockReturnValue({
        queue: { 'upload-1': mockUpload },
        updateUpload: mockUpdateUpload,
      });

      (axios.get as any).mockResolvedValue({
        data: {
          uploads: {
            'upload-1': {
              progress: 50,
              eta: 60,
              speed: 512000,
              bytes_uploaded: 2500000,
            },
          },
          jobs: {},
        },
      });

      initProgressRealtime(123);

      // Fast-forward to trigger polling
      await vi.advanceTimersByTimeAsync(500);

      expect(axios.get).toHaveBeenCalledWith('/api/progress', {
        params: {
          upload_ids: ['upload-1'],
        },
      });

      expect(mockUpdateUpload).toHaveBeenCalledWith('upload-1', expect.objectContaining({
        progress: 50,
      }));

      // Restore Echo
      global.window.Echo = originalEcho;
    });

    it('polls processing progress when WebSocket is unavailable', async () => {
      const originalEcho = global.window.Echo;
      global.window.Echo = undefined as any;

      const mockJob = {
        id: 'job-1',
        publicationId: 456,
        type: 'video_processing',
        progress: 40,
        status: 'processing',
        startTime: Date.now(),
      };

      (useProcessingProgress.getState as any) = vi.fn().mockReturnValue({
        jobs: { 'job-1': mockJob },
        updateJob: mockUpdateJob,
        removeJob: mockRemoveJob,
      });

      (axios.get as any).mockResolvedValue({
        data: {
          uploads: {},
          jobs: {
            'job-1': {
              progress: 70,
              eta: 90,
              current_step: 'Generating thumbnails',
              completed_steps: 3,
              total_steps: 5,
            },
          },
        },
      });

      initProgressRealtime(123);

      // Fast-forward to trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      expect(axios.get).toHaveBeenCalledWith('/api/progress', {
        params: {
          job_ids: ['job-1'],
        },
      });

      expect(mockUpdateJob).toHaveBeenCalledWith('job-1', expect.objectContaining({
        progress: 70,
        status: 'processing',
      }));

      // Restore Echo
      global.window.Echo = originalEcho;
    });

    it('handles polling errors gracefully', async () => {
      const originalEcho = global.window.Echo;
      global.window.Echo = undefined as any;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockUpload = {
        id: 'upload-1',
        file: new File(['test'], 'test.mp4'),
        progress: 30,
        status: 'uploading',
        isPausable: true,
      };

      (useUploadQueue.getState as any) = vi.fn().mockReturnValue({
        queue: { 'upload-1': mockUpload },
        updateUpload: mockUpdateUpload,
      });

      (axios.get as any).mockRejectedValue(new Error('Network error'));

      initProgressRealtime(123);

      // Fast-forward to trigger polling
      await vi.advanceTimersByTimeAsync(500);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to poll upload progress:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      global.window.Echo = originalEcho;
    });
  });

  describe('Cleanup', () => {
    it('stops polling when cleanup is called', () => {
      const originalEcho = global.window.Echo;
      global.window.Echo = undefined as any;

      initProgressRealtime(123);

      cleanupProgressRealtime(123);

      // Polling should be stopped, so no axios calls after cleanup
      vi.advanceTimersByTime(1000);

      expect(axios.get).not.toHaveBeenCalled();

      global.window.Echo = originalEcho;
    });

    it('leaves WebSocket channel when cleanup is called', () => {
      initProgressRealtime(123);

      cleanupProgressRealtime(123);

      expect(mockLeave).toHaveBeenCalledWith('users.123');
    });
  });
});
