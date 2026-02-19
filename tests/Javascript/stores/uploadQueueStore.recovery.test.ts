import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useUploadQueue } from "@/stores/uploadQueueStore";

describe("Upload Queue Store - State Recovery", () => {
  const STORAGE_KEY = "upload_queue_state";
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the store
    useUploadQueue.setState({
      queue: {},
      persistedState: {},
      hasRestoredState: false,
      showResumePrompt: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initializeStore", () => {
    it("should restore persisted state on initialization", () => {
      // Setup: Create persisted state in localStorage
      const persistedState = {
        version: 1,
        uploads: {
          "upload-1": {
            id: "upload-1",
            fileName: "test.mp4",
            fileSize: 1000000,
            fileType: "video/mp4",
            progress: 50,
            status: "paused",
            s3Key: "test-key",
            uploadId: "multipart-id",
            uploadedParts: [{ PartNumber: 1, ETag: "etag1" }],
            timestamp: Date.now(),
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Execute
      useUploadQueue.getState().initializeStore();

      // Verify
      const state = useUploadQueue.getState();
      expect(state.hasRestoredState).toBe(true);
      expect(state.showResumePrompt).toBe(true);
      expect(Object.keys(state.persistedState)).toHaveLength(1);
      expect(state.persistedState["upload-1"]).toBeDefined();
    });

    it("should not show resume prompt if no incomplete uploads", () => {
      // Setup: Create persisted state with completed upload
      const persistedState = {
        version: 1,
        uploads: {
          "upload-1": {
            id: "upload-1",
            fileName: "test.mp4",
            fileSize: 1000000,
            fileType: "video/mp4",
            progress: 100,
            status: "completed",
            timestamp: Date.now(),
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Execute
      useUploadQueue.getState().initializeStore();

      // Verify
      const state = useUploadQueue.getState();
      expect(state.hasRestoredState).toBe(true);
      expect(state.showResumePrompt).toBe(false);
    });

    it("should only initialize once", () => {
      // Setup
      const persistedState = {
        version: 1,
        uploads: {
          "upload-1": {
            id: "upload-1",
            fileName: "test.mp4",
            fileSize: 1000000,
            fileType: "video/mp4",
            progress: 50,
            status: "paused",
            timestamp: Date.now(),
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Execute first initialization
      useUploadQueue.getState().initializeStore();
      const firstState = useUploadQueue.getState().persistedState;

      // Clear localStorage and try to initialize again
      localStorage.clear();
      useUploadQueue.getState().initializeStore();
      const secondState = useUploadQueue.getState().persistedState;

      // Verify: State should not change on second initialization
      expect(firstState).toEqual(secondState);
    });
  });

  describe("restoreState", () => {
    it("should validate schema version", () => {
      // Setup: Create state with wrong version
      const persistedState = {
        version: 999,
        uploads: {
          "upload-1": {
            id: "upload-1",
            fileName: "test.mp4",
            fileSize: 1000000,
            fileType: "video/mp4",
            progress: 50,
            status: "paused",
            timestamp: Date.now(),
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Execute
      useUploadQueue.getState().restoreState();

      // Verify: State should not be restored
      const state = useUploadQueue.getState();
      expect(Object.keys(state.persistedState)).toHaveLength(0);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("should skip expired uploads", () => {
      // Setup: Create expired state (8 days old)
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const persistedState = {
        version: 1,
        uploads: {
          "upload-1": {
            id: "upload-1",
            fileName: "test.mp4",
            fileSize: 1000000,
            fileType: "video/mp4",
            progress: 50,
            status: "paused",
            timestamp: eightDaysAgo,
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Execute
      useUploadQueue.getState().restoreState();

      // Verify: Expired upload should be skipped
      const state = useUploadQueue.getState();
      expect(Object.keys(state.persistedState)).toHaveLength(0);
    });

    it("should skip uploads with invalid state", () => {
      // Setup: Create state with missing required fields
      const persistedState = {
        version: 1,
        uploads: {
          "upload-1": {
            id: "upload-1",
            // Missing fileName, fileSize, progress
            status: "paused",
            timestamp: Date.now(),
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Execute
      useUploadQueue.getState().restoreState();

      // Verify: Invalid upload should be skipped
      const state = useUploadQueue.getState();
      expect(Object.keys(state.persistedState)).toHaveLength(0);
    });

    it("should handle corrupted localStorage data", () => {
      // Setup: Store invalid JSON
      localStorage.setItem(STORAGE_KEY, "invalid json {");

      // Execute
      useUploadQueue.getState().restoreState();

      // Verify: Should not crash and should clear corrupted data
      const state = useUploadQueue.getState();
      expect(Object.keys(state.persistedState)).toHaveLength(0);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("should restore multiple valid uploads", () => {
      // Setup: Create state with multiple uploads
      const persistedState = {
        version: 1,
        uploads: {
          "upload-1": {
            id: "upload-1",
            fileName: "test1.mp4",
            fileSize: 1000000,
            fileType: "video/mp4",
            progress: 50,
            status: "paused",
            timestamp: Date.now(),
          },
          "upload-2": {
            id: "upload-2",
            fileName: "test2.mp4",
            fileSize: 2000000,
            fileType: "video/mp4",
            progress: 75,
            status: "uploading",
            uploadId: "multipart-id",
            timestamp: Date.now(),
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Execute
      useUploadQueue.getState().restoreState();

      // Verify
      const state = useUploadQueue.getState();
      expect(Object.keys(state.persistedState)).toHaveLength(2);
      expect(state.persistedState["upload-1"]).toBeDefined();
      expect(state.persistedState["upload-2"]).toBeDefined();
      expect(state.persistedState["upload-2"]?.isPausable).toBe(true);
    });
  });

  describe("dismissResumePrompt", () => {
    it("should hide the resume prompt", () => {
      // Setup
      useUploadQueue.setState({ showResumePrompt: true });

      // Execute
      useUploadQueue.getState().dismissResumePrompt();

      // Verify
      expect(useUploadQueue.getState().showResumePrompt).toBe(false);
    });
  });

  describe("clearAllPersistedUploads", () => {
    it("should clear all persisted uploads from localStorage and state", () => {
      // Setup
      const persistedState = {
        version: 1,
        uploads: {
          "upload-1": {
            id: "upload-1",
            fileName: "test.mp4",
            fileSize: 1000000,
            fileType: "video/mp4",
            progress: 50,
            status: "paused",
            timestamp: Date.now(),
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
      useUploadQueue.setState({
        persistedState: { "upload-1": { id: "upload-1" } },
        showResumePrompt: true,
      });

      // Execute
      useUploadQueue.getState().clearAllPersistedUploads();

      // Verify
      const state = useUploadQueue.getState();
      expect(Object.keys(state.persistedState)).toHaveLength(0);
      expect(state.showResumePrompt).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("persistState", () => {
    it("should persist only active uploads", () => {
      // Setup: Add uploads with different statuses
      const store = useUploadQueue.getState();
      const mockFile = new File(["content"], "test.mp4", { type: "video/mp4" });
      
      store.addUpload("upload-1", mockFile);
      store.updateUpload("upload-1", { status: "uploading", progress: 50 });
      
      store.addUpload("upload-2", mockFile);
      store.updateUpload("upload-2", { status: "completed", progress: 100 });
      
      store.addUpload("upload-3", mockFile);
      store.updateUpload("upload-3", { status: "paused", progress: 30 });

      // Execute
      store.persistState();

      // Verify: Only uploading and paused should be persisted
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(Object.keys(parsed.uploads)).toHaveLength(2);
      expect(parsed.uploads["upload-1"]).toBeDefined();
      expect(parsed.uploads["upload-3"]).toBeDefined();
      expect(parsed.uploads["upload-2"]).toBeUndefined();
    });
  });
});
