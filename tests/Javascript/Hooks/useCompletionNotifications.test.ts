import { useCompletionNotifications } from '@/Hooks/useCompletionNotifications';
import { useUploadQueue } from '@/stores/uploadQueueStore';
import { useProcessingProgress } from '@/stores/processingProgressStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock stores
vi.mock('@/stores/uploadQueueStore');
vi.mock('@/stores/processingProgressStore');
vi.mock('@/stores/notificationStore');

// Mock Inertia router
vi.mock('@inertiajs/react', () => ({
  router: {
    visit: vi.fn(),
  },
}));

// Mock Notification API
const mockNotification = vi.fn();
global.Notification = mockNotification as any;
global.Notification.permission = 'default';
global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

describe('useCompletionNotifications', () => {
  const mockFetchNotifications = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Setup store mocks
    (useUploadQueue as any).mockReturnValue({
      queue: {},
    });

    (useProcessingProgress as any).mockReturnValue({
      jobs: {},
    });

    (useNotificationStore as any).mockReturnValue({
      fetchNotifications: mockFetchNotifications,
    });

    // Reset Notification permission
    global.Notification.permission = 'default';
  });

  it('initializes with default preferences', () => {
    const { result } = renderHook(() => useCompletionNotifications());

    expect(result.current.preferences).toEqual({
      enableInAppNotifications: true,
      enableBrowserNotifications: false,
      notifyOnUploadComplete: true,
      notifyOnProcessingComplete: true,
    });
  });

  it('loads preferences from localStorage', () => {
    const customPreferences = {
      enableInAppNotifications: false,
      enableBrowserNotifications: true,
      notifyOnUploadComplete: false,
      notifyOnProcessingComplete: true,
    };

    localStorage.setItem(
      'completion_notification_preferences',
      JSON.stringify(customPreferences)
    );

    const { result } = renderHook(() => useCompletionNotifications());

    expect(result.current.preferences).toEqual(customPreferences);
  });

  it('saves preferences to localStorage', () => {
    const { result } = renderHook(() => useCompletionNotifications());

    const newPreferences = {
      enableInAppNotifications: false,
      enableBrowserNotifications: true,
      notifyOnUploadComplete: true,
      notifyOnProcessingComplete: false,
    };

    act(() => {
      result.current.savePreferences(newPreferences);
    });

    const stored = localStorage.getItem('completion_notification_preferences');
    expect(JSON.parse(stored!)).toEqual(newPreferences);
  });

  it('requests browser notification permission', async () => {
    const { result } = renderHook(() => useCompletionNotifications());

    let permissionGranted: boolean = false;

    await act(async () => {
      permissionGranted = await result.current.requestBrowserNotificationPermission();
    });

    expect(global.Notification.requestPermission).toHaveBeenCalled();
    expect(permissionGranted).toBe(true);
  });

  it('handles upload completion notification', async () => {
    const completedUpload = {
      id: 'upload-1',
      file: new File(['test'], 'test.mp4'),
      progress: 100,
      status: 'completed',
      publicationId: 123,
      publicationTitle: 'Test Publication',
      isPausable: false,
    };

    (useUploadQueue as any).mockReturnValue({
      queue: {
        'upload-1': completedUpload,
      },
    });

    const { rerender } = renderHook(() => useCompletionNotifications());

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });
  });

  it('handles processing completion notification', async () => {
    const completedJob = {
      id: 'job-1',
      publicationId: 123,
      type: 'video_processing',
      progress: 100,
      status: 'completed',
      startTime: Date.now() - 10000,
      completedTime: Date.now(),
    };

    (useProcessingProgress as any).mockReturnValue({
      jobs: {
        'job-1': completedJob,
      },
    });

    const { rerender } = renderHook(() => useCompletionNotifications());

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });
  });

  it('does not send duplicate notifications', async () => {
    const completedUpload = {
      id: 'upload-1',
      file: new File(['test'], 'test.mp4'),
      progress: 100,
      status: 'completed',
      publicationId: 123,
      publicationTitle: 'Test Publication',
      isPausable: false,
    };

    (useUploadQueue as any).mockReturnValue({
      queue: {
        'upload-1': completedUpload,
      },
    });

    const { rerender } = renderHook(() => useCompletionNotifications());

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
    });

    // Rerender should not trigger another notification
    rerender();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
  });

  it('respects notification preferences for uploads', async () => {
    const preferences = {
      enableInAppNotifications: false,
      enableBrowserNotifications: false,
      notifyOnUploadComplete: false,
      notifyOnProcessingComplete: true,
    };

    localStorage.setItem(
      'completion_notification_preferences',
      JSON.stringify(preferences)
    );

    const completedUpload = {
      id: 'upload-1',
      file: new File(['test'], 'test.mp4'),
      progress: 100,
      status: 'completed',
      publicationId: 123,
      publicationTitle: 'Test Publication',
      isPausable: false,
    };

    (useUploadQueue as any).mockReturnValue({
      queue: {
        'upload-1': completedUpload,
      },
    });

    renderHook(() => useCompletionNotifications());

    // Should not call fetchNotifications because notifyOnUploadComplete is false
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetchNotifications).not.toHaveBeenCalled();
  });

  it('cleans up tracked completions when items are removed', async () => {
    const completedUpload = {
      id: 'upload-1',
      file: new File(['test'], 'test.mp4'),
      progress: 100,
      status: 'completed',
      publicationId: 123,
      publicationTitle: 'Test Publication',
      isPausable: false,
    };

    const mockQueue = {
      queue: {
        'upload-1': completedUpload,
      },
    };

    (useUploadQueue as any).mockReturnValue(mockQueue);

    const { rerender } = renderHook(() => useCompletionNotifications());

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });

    // Remove the upload from queue
    mockQueue.queue = {};
    (useUploadQueue as any).mockReturnValue(mockQueue);

    rerender();

    // Add it back - should trigger notification again since it was cleaned up
    mockQueue.queue = { 'upload-1': completedUpload };
    (useUploadQueue as any).mockReturnValue(mockQueue);

    rerender();

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalledTimes(2);
    });
  });
});
