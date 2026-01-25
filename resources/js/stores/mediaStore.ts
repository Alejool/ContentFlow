import { create } from "zustand";

interface MediaFile {
  id?: number;
  tempId: string;
  url: string;
  type: string;
  isNew: boolean;
  file?: File;
  thumbnailUrl?: string;
}

interface MediaState {
  mediaFiles: MediaFile[];
  videoMetadata: Record<
    string,
    { duration: number; youtubeType: "short" | "video" }
  >;
  thumbnails: Record<string, File>;
  removedThumbnailIds: number[];
  imageError: string | null;

  setMediaFiles: (files: MediaFile[]) => void;
  addFiles: (files: MediaFile[]) => void;
  removeFile: (index: number) => void;
  updateFile: (tempId: string, updates: Partial<MediaFile>) => void;
  setVideoMetadata: (
    tempId: string,
    metadata: { duration: number; youtubeType: "short" | "video" },
  ) => void;
  setThumbnail: (tempId: string, file: File) => void;
  clearThumbnail: (tempId: string) => void;
  setImageError: (error: string | null) => void;
  clear: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  mediaFiles: [],
  videoMetadata: {},
  thumbnails: {},
  removedThumbnailIds: [],
  imageError: null,

  setMediaFiles: (mediaFiles) => set({ mediaFiles, removedThumbnailIds: [] }),

  addFiles: (newFiles) =>
    set((state) => ({
      mediaFiles: [...state.mediaFiles, ...newFiles],
    })),

  updateFile: (tempId, updates) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.map((f) =>
        f.tempId === tempId ? { ...f, ...updates } : f,
      ),
    })),

  removeFile: (index) =>
    set((state) => {
      const fileToRemove = state.mediaFiles[index];
      const newMediaFiles = state.mediaFiles.filter((_, i) => i !== index);
      const newVideoMetadata = { ...state.videoMetadata };
      const newThumbnails = { ...state.thumbnails };
      const newRemovedThumbnailIds = [...state.removedThumbnailIds];

      if (fileToRemove) {
        delete newVideoMetadata[fileToRemove.tempId];
        delete newThumbnails[fileToRemove.tempId];
        if (fileToRemove.id) {
          const indexToRemove = newRemovedThumbnailIds.indexOf(fileToRemove.id);
          if (indexToRemove > -1) {
            newRemovedThumbnailIds.splice(indexToRemove, 1);
          }
        }
      }

      return {
        mediaFiles: newMediaFiles,
        videoMetadata: newVideoMetadata,
        thumbnails: newThumbnails,
        removedThumbnailIds: newRemovedThumbnailIds,
      };
    }),

  setVideoMetadata: (tempId, metadata) =>
    set((state) => ({
      videoMetadata: { ...state.videoMetadata, [tempId]: metadata },
    })),

  setThumbnail: (tempId, file) =>
    set((state) => {
      const newRemovedThumbnailIds = [...state.removedThumbnailIds];
      const media = state.mediaFiles.find((m) => m.tempId === tempId);

      // If we are setting a new thumbnail, it's no longer removed
      if (media?.id) {
        const index = newRemovedThumbnailIds.indexOf(media.id);
        if (index > -1) {
          newRemovedThumbnailIds.splice(index, 1);
        }
      }

      return {
        thumbnails: { ...state.thumbnails, [tempId]: file },
        removedThumbnailIds: newRemovedThumbnailIds,
      };
    }),

  clearThumbnail: (tempId) =>
    set((state) => {
      const newThumbnails = { ...state.thumbnails };
      const newRemovedThumbnailIds = [...state.removedThumbnailIds];
      const newMediaFiles = state.mediaFiles.map((m) => {
        if (m.tempId === tempId) {
          if (m.id && !newRemovedThumbnailIds.includes(m.id)) {
            newRemovedThumbnailIds.push(m.id);
          }
          return { ...m, thumbnailUrl: undefined };
        }
        return m;
      });

      delete newThumbnails[tempId];

      return {
        thumbnails: newThumbnails,
        removedThumbnailIds: newRemovedThumbnailIds,
        mediaFiles: newMediaFiles,
      };
    }),

  setImageError: (error) => set({ imageError: error }),

  clear: () =>
    set({
      mediaFiles: [],
      videoMetadata: {},
      thumbnails: {},
      removedThumbnailIds: [],
      imageError: null,
    }),
}));
