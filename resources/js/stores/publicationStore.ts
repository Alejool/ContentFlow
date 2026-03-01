import { Publication } from "@/types/Publication";
import axios from "axios";
import { create } from "zustand";
import { useCalendarStore } from "./calendarStore";

interface PublicationState {
  publications: Publication[];
  currentPublication: Publication | null;

  publishedPlatforms: Record<number, number[]>;
  failedPlatforms: Record<number, number[]>;
  publishingPlatforms: Record<number, number[]>;
  scheduledPlatforms: Record<number, number[]>;
  removedPlatforms: Record<number, number[]>;

  isLoading: boolean;
  error: string | null;

  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };

  fetchPublications: (filters?: any, page?: number) => Promise<void>;
  fetchPublicationById: (id: number) => Promise<Publication | null>;
  fetchPublishedPlatforms: (publicationId: number) => Promise<{
    published: number[];
    failed: number[];
    publishing: number[];
    scheduled: number[];
    removed: number[];
  }>;

  addPublication: (publication: Publication) => void;
  updatePublication: (id: number, publication: Partial<Publication>) => void;
  removePublication: (id: number) => void;

  createPublication: (formData: FormData) => Promise<Publication | null>;
  updatePublicationStore: (
    id: number,
    formData: FormData,
  ) => Promise<Publication | null>;
  deletePublication: (id: number) => Promise<boolean>;
  duplicatePublication: (id: number) => Promise<boolean>;

  publishPublication: (
    id: number,
    formData: FormData,
  ) => Promise<{ success: boolean; data?: any }>;
  unpublishPublication: (
    id: number,
    platformIds: number[],
  ) => Promise<{ success: boolean; data?: any }>;
  setCurrentPublication: (publication: Publication | null) => void;

  getPublicationById: (id: number) => Publication | undefined;
  getPublishedPlatforms: (publicationId: number) => number[];
  getFailedPlatforms: (publicationId: number) => number[];
  getRemovedPlatforms: (publicationId: number) => number[];
  getPublishingPlatforms: (publicationId: number) => number[];
  getScheduledPlatforms: (publicationId: number) => number[];

  setPublishedPlatforms: (publicationId: number, accountIds: number[]) => void;
  setFailedPlatforms: (publicationId: number, accountIds: number[]) => void;
  setRemovedPlatforms: (publicationId: number, accountIds: number[]) => void;
  setPublishingPlatforms: (publicationId: number, accountIds: number[]) => void;
  setScheduledPlatforms: (publicationId: number, accountIds: number[]) => void;

  clearPageData: () => void;
  clearError: () => void;
  reset: () => void;

  acquireLock: (
    id: number,
    force?: boolean,
  ) => Promise<{ success: boolean; data?: any }>;
  releaseLock: (id: number) => Promise<{ success: boolean; data?: any }>;
}

export const usePublicationStore = create<PublicationState>((set, get) => ({
  publications: [],
  currentPublication: null,

  publishedPlatforms: {},
  failedPlatforms: {},
  publishingPlatforms: {},
  scheduledPlatforms: {},
  removedPlatforms: {},

  isLoading: false,
  error: null,

  pagination: {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 7,
  },

  fetchPublications: async (filters = {}, page = 1) => {
    set({ isLoading: true, error: null });

    // CRITICAL: Clear previous page data to prevent memory bloat
    // Only keep data for the current page being viewed
    // TEMPORARILY DISABLED FOR DEBUGGING
    // get().clearPageData();

    try {
      // Limpiar filtros vacíos
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          acc[key] = value;
        } else if (value && !Array.isArray(value) && value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      console.log('[publicationStore] Fetching publications with filters:', cleanFilters, 'page:', page);

      const response = await axios.get(route("api.v1.publications.index"), {
        params: { ...cleanFilters, page },
        paramsSerializer: {
          indexes: null,
          serialize: (params) => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(`${key}[]`, String(v)));
              } else if (value !== null && value !== undefined) {
                searchParams.append(key, String(value));
              }
            });
            return searchParams.toString();
          }
        }
      });

      const data = response.data.publications;

      console.log('[publicationStore] Received publications:', data.data?.length || 0, 'items');
      console.log('[publicationStore] Response structure:', {
        hasData: !!data,
        hasDataArray: !!data.data,
        dataLength: data.data?.length,
        currentPage: data.current_page,
        total: data.total
      });

      set({
        publications: data.data ?? [],
        pagination: {
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
          per_page: data.per_page,
        },
        isLoading: false,
      });

      console.log('[publicationStore] State updated, isLoading set to false');
    } catch (error: any) {
      console.error('[publicationStore] Error fetching publications:', error);
      set({
        error: error.message ?? "Failed to fetch publications",
        isLoading: false,
      });
    }
  },

  fetchPublicationById: async (id: number) => {
    // Force refresh, ignore cache
    // const cached = get().publications.find((p) => p.id === id);
    // if (cached) {
    //   set({ currentPublication: cached });
    //   return cached;
    // }

    set({ error: null });
    try {
      const response = await axios.get(route("api.v1.publications.show", id));
      const publication = response.data.publication;

      set((state) => ({
        publications: state.publications.map((p) =>
          p.id === id ? publication : p,
        ),
        currentPublication: publication,
      }));

      return publication;
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to fetch publication",
      });
      return null;
    }
  },

  fetchPublishedPlatforms: async (publicationId: number) => {
    try {
      const response = await axios.get(
        route("api.v1.publications.published-platforms", publicationId),
      );

      const published = response.data.published_platforms ?? [];
      const failed = response.data.failed_platforms ?? [];
      const publishing = response.data.publishing_platforms ?? [];
      const removed = response.data.removed_platforms ?? [];
      const scheduled = response.data.scheduled_platforms ?? [];

      set((state) => ({
        publishedPlatforms: {
          ...state.publishedPlatforms,
          [publicationId]: published,
        },
        failedPlatforms: {
          ...state.failedPlatforms,
          [publicationId]: failed,
        },
        publishingPlatforms: {
          ...state.publishingPlatforms,
          [publicationId]: publishing,
        },
        scheduledPlatforms: {
          ...state.scheduledPlatforms,
          [publicationId]: scheduled,
        },
      }));
      set((state) => ({
        removedPlatforms: {
          ...state.removedPlatforms,
          [publicationId]: removed,
        },
      }));

      return { published, failed, publishing, removed, scheduled };
    } catch {
      return {
        published: [],
        failed: [],
        publishing: [],
        removed: [],
        scheduled: [],
      };
    }
  },

  addPublication: (publication) =>
    set((state) => ({
      publications: [publication, ...state.publications],
    })),

  updatePublication: (id, updated) =>
    set((state) => {
      // 1. Process social_post_logs if they are part of the update
      // This ensures that platform status caches (published, publishing, etc.)
      // are always in sync with the latest data from Echo or API.
      const logs = updated.social_post_logs || (updated as any).socialPostLogs;

      const newPlatformStatusUpdates: Partial<PublicationState> = {};

      if (logs && Array.isArray(logs)) {
        const published: number[] = [];
        const failed: number[] = [];
        const publishing: number[] = [];
        const removed: number[] = [];
        const scheduled: number[] = [];

        // Determine which social accounts have pending scheduled posts
        // to avoid marking them as "available" prematurely
        const publication = state.publications.find((p) => p.id === id);
        const scheduledIds = new Set(
          publication?.scheduled_posts
            ?.filter((sp) => sp.status === "pending")
            .map((sp) => sp.social_account_id) || [],
        );

        logs.forEach((log: any) => {
          if (scheduledIds.has(log.social_account_id)) return;

          const status = log.status;
          const attempts = log.attempts || 0;
          const maxAttempts = log.max_attempts || 3;

          if (status === "published" || status === "success") {
            published.push(log.social_account_id);
          } else if (status === "failed" || (status === "pending" && attempts >= maxAttempts)) {
            // Mark as failed if explicitly failed OR if all retry attempts exhausted
            failed.push(log.social_account_id);
          } else if ((status === "publishing" || status === "pending") && attempts < maxAttempts) {
            // Only show as publishing if actively in progress and retries remain
            publishing.push(log.social_account_id);
          } else if (status === "removed_on_platform" || status === "deleted") {
            removed.push(log.social_account_id);
          }
        });

        newPlatformStatusUpdates.publishedPlatforms = {
          ...state.publishedPlatforms,
          [id]: Array.from(new Set(published)),
        };
        newPlatformStatusUpdates.failedPlatforms = {
          ...state.failedPlatforms,
          [id]: Array.from(new Set(failed)),
        };
        newPlatformStatusUpdates.publishingPlatforms = {
          ...state.publishingPlatforms,
          [id]: Array.from(new Set(publishing)),
        };
        newPlatformStatusUpdates.removedPlatforms = {
          ...state.removedPlatforms,
          [id]: Array.from(new Set(removed)),
        };
      }

      return {
        ...newPlatformStatusUpdates,
        publications: state.publications.map((p) =>
          p.id === id ? { ...p, ...updated } : p,
        ),
        currentPublication:
          state.currentPublication?.id === id
            ? { ...state.currentPublication, ...updated }
            : state.currentPublication,
      };
    }),

  removePublication: (id) =>
    set((state) => ({
      publications: state.publications.filter((p) => p.id !== id),
      currentPublication:
        state.currentPublication?.id === id ? null : state.currentPublication,
    })),

  createPublication: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        route("api.v1.publications.store"),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      const publication = response.data.publication;
      if (publication) {
        get().addPublication(publication);
      }
      set({ isLoading: false });
      // Refresh calendar store to reflect changes
      useCalendarStore.getState().fetchEvents();
      return publication;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to create publication",
        isLoading: false,
      });
      throw error;
    }
  },

  updatePublicationStore: async (id, formData) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure _method is PUT for Laravel to handle multipart/form-data with PUT
      if (!formData.has("_method")) {
        formData.append("_method", "PUT");
      }
      const response = await axios.post(
        route("api.v1.publications.update", id),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      const publication = response.data.publication || response.data.data;
      if (publication) {
        get().updatePublication(id, publication);
      }
      set({ isLoading: false });
      // Refresh calendar store to reflect updated publication
      useCalendarStore.getState().fetchEvents();
      return publication;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to update publication",
        isLoading: false,
      });
      throw error;
    }
  },

  deletePublication: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(route("api.v1.publications.destroy", id));
      get().removePublication(id);
      set({ isLoading: false });
      useCalendarStore.getState().fetchEvents();
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to delete publication",
        isLoading: false,
      });
      return false;
    }
  },

  duplicatePublication: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        route("api.v1.publications.duplicate", id),
      );
      const publication = response.data.publication;
      if (publication) {
        get().addPublication(publication);
      }
      set({ isLoading: false });
      useCalendarStore.getState().fetchEvents();
      return true;
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ?? "Failed to duplicate publication",
        isLoading: false,
      });
      return false;
    }
  },

  publishPublication: async (id, formData) => {
    try {
      const response = await axios.post(
        route("api.v1.publications.publish", id),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return { success: response.data.success, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        data: error.response?.data?.message ?? "Failed to publish",
      };
    }
  },

  unpublishPublication: async (id, platformIds) => {
    try {
      const response = await axios.post(
        route("api.v1.publications.unpublish", id),
        {
          platform_ids: platformIds,
        },
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        data: error.response?.data?.message ?? "Failed to unpublish",
      };
    }
  },

  setCurrentPublication: (publication) =>
    set({ currentPublication: publication }),

  getPublicationById: (id) => get().publications.find((p) => p.id === id),

  getPublishedPlatforms: (id) => get().publishedPlatforms[id] ?? [],

  getFailedPlatforms: (id) => get().failedPlatforms[id] ?? [],

  getRemovedPlatforms: (id) => get().removedPlatforms[id] ?? [],

  getPublishingPlatforms: (id) => get().publishingPlatforms[id] ?? [],

  getScheduledPlatforms: (id) => get().scheduledPlatforms[id] ?? [],

  setPublishedPlatforms: (id, accounts) =>
    set((state) => ({
      publishedPlatforms: { ...state.publishedPlatforms, [id]: accounts },
    })),

  setFailedPlatforms: (id, accounts) =>
    set((state) => ({
      failedPlatforms: { ...state.failedPlatforms, [id]: accounts },
    })),

  setRemovedPlatforms: (id, accounts) =>
    set((state) => ({
      removedPlatforms: { ...state.removedPlatforms, [id]: accounts },
    })),

  setPublishingPlatforms: (id, accounts) =>
    set((state) => ({
      publishingPlatforms: { ...state.publishingPlatforms, [id]: accounts },
    })),

  setScheduledPlatforms: (id, accounts) =>
    set((state) => ({
      scheduledPlatforms: { ...state.scheduledPlatforms, [id]: accounts },
    })),

  clearPageData: () =>
    set((state) => ({
      // Clear publications array to free memory
      publications: [],
      // Clear all platform caches as they're page-specific
      publishedPlatforms: {},
      failedPlatforms: {},
      publishingPlatforms: {},
      scheduledPlatforms: {},
      removedPlatforms: {},
      // Keep currentPublication if user is editing something
      // This prevents losing data if modal is open
    })),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      publications: [],
      currentPublication: null,
      publishedPlatforms: {},
      failedPlatforms: {},
      publishingPlatforms: {},
      scheduledPlatforms: {},
      isLoading: false,
      error: null,
    }),

  acquireLock: async (id, force = false) => {
    try {
      const response = await axios.post(route("api.v1.publications.lock", id), {
        force,
      });
      return { success: response.data.success, data: response.data };
    } catch (error: any) {
      // Don't set global store error for locks as it's often background/ephemeral
      // Just return the error state so the hook can handle it (e.g. 423 Locked)
      return {
        success: false,
        data: error.response?.data ?? { message: "Failed to acquire lock" },
      };
    }
  },

  releaseLock: async (id) => {
    try {
      const response = await axios.post(
        route("api.v1.publications.unlock", id),
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        data: error.response?.data ?? { message: "Failed to release lock" },
      };
    }
  },
}));
