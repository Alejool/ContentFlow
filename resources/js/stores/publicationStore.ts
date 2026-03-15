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
  duplicatePlatforms: Record<number, number[]>; // Plataformas con intentos duplicados
  recurringPosts: Record<number, Record<number, any[]>>; // publicationId -> accountId -> posts[]
  publishedRecurringPosts: Record<number, Record<number, any[]>>; // publicationId -> accountId -> posts[]
  retryInfo: Record<
    number,
    Record<
      number,
      {
        retry_count: number;
        is_retrying: boolean;
        retry_status: string;
        is_duplicate: boolean; // Indica si es un intento duplicado
        original_attempt_at?: string; // Timestamp del intento original
      }
    >
  >;

  isLoading: boolean;
  error: string | null;

  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };

  fetchPublications: (filters?: any, page?: number, useApprovalFilter?: boolean) => Promise<void>;
  fetchPublicationById: (id: number) => Promise<Publication | null>;
  fetchPublishedPlatforms: (publicationId: number) => Promise<{
    published: number[];
    failed: number[];
    publishing: number[];
    scheduled: number[];
    removed: number[];
    retry_info: Record<number, { retry_count: number; is_retrying: boolean; retry_status: string }>;
  }>;

  addPublication: (publication: Publication) => void;
  updatePublication: (id: number, publication: Partial<Publication>) => void;
  removePublication: (id: number) => void;

  createPublication: (formData: FormData) => Promise<Publication | null>;
  updatePublicationStore: (id: number, formData: FormData) => Promise<Publication | null>;
  deletePublication: (id: number) => Promise<boolean>;
  duplicatePublication: (id: number) => Promise<boolean>;

  publishPublication: (id: number, formData: FormData) => Promise<{ success: boolean; data?: any }>;
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
  getDuplicatePlatforms: (publicationId: number) => number[]; // Getter para plataformas duplicadas
  getRetryInfo: (
    publicationId: number,
    platformId: number,
  ) => {
    retry_count: number;
    is_retrying: boolean;
    retry_status: string;
    is_duplicate: boolean;
    original_attempt_at?: string;
  } | null;

  setPublishedPlatforms: (publicationId: number, accountIds: number[]) => void;
  setFailedPlatforms: (publicationId: number, accountIds: number[]) => void;
  setRemovedPlatforms: (publicationId: number, accountIds: number[]) => void;
  setPublishingPlatforms: (publicationId: number, accountIds: number[]) => void;
  setScheduledPlatforms: (publicationId: number, accountIds: number[]) => void;
  setDuplicatePlatforms: (publicationId: number, accountIds: number[]) => void; // Setter para plataformas duplicadas

  clearPageData: () => void;
  clearError: () => void;
  reset: () => void;

  acquireLock: (id: number, force?: boolean) => Promise<{ success: boolean; data?: any }>;
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
  duplicatePlatforms: {}, // Inicializar estado de duplicados
  recurringPosts: {},
  publishedRecurringPosts: {},
  retryInfo: {},

  isLoading: false,
  error: null,

  pagination: {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 7,
  },

  fetchPublications: async (filters = {}, page = 1, useApprovalFilter = false) => {
    set({ isLoading: true, error: null });

    // CRITICAL: Clear previous page data to prevent memory bloat
    // Only keep data for the current page being viewed
    // TEMPORARILY DISABLED FOR DEBUGGING
    // get().clearPageData();

    try {
      // Limpiar filtros vacíos
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        // Keep status even if "all" — backend needs it to know user wants everything
        if (key === "status") {
          if (value) acc[key] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          acc[key] = value;
        } else if (value && !Array.isArray(value) && value !== "all") {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Use different endpoint based on approval filter
      const endpoint = useApprovalFilter
        ? route("api.v1.publications.pending-approvals")
        : route("api.v1.publications.index");

      const response = await axios.get(endpoint, {
        params: { ...cleanFilters, page },
        paramsSerializer: {
          indexes: null,
          serialize: (params) => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
              } else if (value !== null && value !== undefined) {
                searchParams.append(key, String(value));
              }
            });
            return searchParams.toString();
          },
        },
      });

      const data = response.data.publications;
      const incomingItems: Publication[] = data.data ?? data ?? [];

      // Preserve optimistic local state: if the store already has a more
      // "advanced" status for an item (e.g. pending_review) and the backend
      // still returns the old status (e.g. draft) due to cache or timing,
      // keep the local state to avoid re-enabling buttons incorrectly.
      const statusPriority: Record<string, number> = {
        draft: 0,
        rejected: 1,
        failed: 1,
        scheduled: 2,
        approved: 3,
        pending_review: 4,
        publishing: 5,
        published: 6,
      };

      const currentPublications = get().publications;
      const mergedItems = incomingItems.map((incoming) => {
        const existing = currentPublications.find((p) => p.id === incoming.id);
        if (!existing) return incoming;
        const existingPriority = statusPriority[existing.status ?? ""] ?? 0;
        const incomingPriority = statusPriority[incoming.status ?? ""] ?? 0;
        // Keep local state if it's more advanced than what the backend returned
        if (existingPriority > incomingPriority) {
          return { ...incoming, status: existing.status };
        }
        return incoming;
      });

      set({
        publications: mergedItems,
        pagination: {
          current_page: data.current_page ?? 1,
          last_page: data.last_page ?? 1,
          total: data.total ?? (Array.isArray(data) ? data.length : 0),
          per_page: data.per_page ?? 12,
        },
        isLoading: false,
      });
    } catch (error: any) {
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
        publications: state.publications.map((p) => (p.id === id ? publication : p)),
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

      const published = Array.isArray(response.data.published_platforms)
        ? response.data.published_platforms
        : [];
      const failed = Array.isArray(response.data.failed_platforms)
        ? response.data.failed_platforms
        : [];
      const publishing = Array.isArray(response.data.publishing_platforms)
        ? response.data.publishing_platforms
        : [];
      const removed = Array.isArray(response.data.removed_platforms)
        ? response.data.removed_platforms
        : [];
      const scheduled = Array.isArray(response.data.scheduled_platforms)
        ? response.data.scheduled_platforms
        : typeof response.data.scheduled_platforms === "object" &&
            response.data.scheduled_platforms !== null
          ? Object.values(response.data.scheduled_platforms)
          : [];
      const retry_info = response.data.retry_info ?? {};
      const recurring_posts = response.data.recurring_posts ?? {};
      const published_recurring_posts = response.data.published_recurring_posts ?? {};

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
        removedPlatforms: {
          ...state.removedPlatforms,
          [publicationId]: removed,
        },
        retryInfo: {
          ...state.retryInfo,
          [publicationId]: retry_info,
        },
        recurringPosts: {
          ...state.recurringPosts,
          [publicationId]: recurring_posts,
        },
        publishedRecurringPosts: {
          ...state.publishedRecurringPosts,
          [publicationId]: published_recurring_posts,
        },
      }));

      return { published, failed, publishing, removed, scheduled, retry_info };
    } catch {
      return {
        published: [],
        failed: [],
        publishing: [],
        removed: [],
        scheduled: [],
        retry_info: {},
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
        const duplicates: number[] = []; // Plataformas con intentos duplicados
        const retryInfoUpdates: Record<number, any> = {};

        // Determine which social accounts have pending scheduled posts
        // to avoid marking them as "available" prematurely
        const publication = state.publications.find((p) => p.id === id);
        const scheduledIds = new Set(
          publication?.scheduled_posts
            ?.filter((sp) => sp.status === "pending")
            .map((sp) => sp.social_account_id) || [],
        );

        // Agrupar logs por social_account_id para detectar duplicados
        const logsByAccount = logs.reduce((acc: any, log: any) => {
          if (!acc[log.social_account_id]) {
            acc[log.social_account_id] = [];
          }
          acc[log.social_account_id].push(log);
          return acc;
        }, {});

        Object.entries(logsByAccount).forEach(([accountId, accountLogs]: [string, any]) => {
          const socialAccountId = parseInt(accountId);
          if (scheduledIds.has(socialAccountId)) return;

          // Ordenar logs por fecha de creación (más reciente primero)
          const sortedLogs = (accountLogs as any[]).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );

          const latestLog = sortedLogs[0];
          const status = latestLog.status;
          const attempts = latestLog.attempts || 0;
          const maxAttempts = latestLog.max_attempts || 3;

          // Detectar intentos duplicados: si hay múltiples logs activos (publishing/pending)
          const activeAttempts = sortedLogs.filter(
            (log) => log.status === "publishing" || log.status === "pending",
          );

          const isDuplicate = activeAttempts.length > 1;
          const originalAttempt = isDuplicate ? sortedLogs[sortedLogs.length - 1] : null;

          // Actualizar retry info con información de duplicados
          retryInfoUpdates[socialAccountId] = {
            retry_count: attempts,
            is_retrying: latestLog.is_retrying || false,
            retry_status: latestLog.retry_status || status,
            is_duplicate: isDuplicate,
            original_attempt_at: originalAttempt?.created_at,
          };

          if (isDuplicate) {
            duplicates.push(socialAccountId);
          } else if (status === "published" || status === "success") {
            published.push(socialAccountId);
          } else if (status === "failed" || (status === "pending" && attempts >= maxAttempts)) {
            // Mark as failed if explicitly failed OR if all retry attempts exhausted
            failed.push(socialAccountId);
          } else if ((status === "publishing" || status === "pending") && attempts < maxAttempts) {
            // Only show as publishing if actively in progress and retries remain
            publishing.push(socialAccountId);
          } else if (status === "removed_on_platform" || status === "deleted") {
            removed.push(socialAccountId);
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
        newPlatformStatusUpdates.duplicatePlatforms = {
          ...state.duplicatePlatforms,
          [id]: Array.from(new Set(duplicates)),
        };
        newPlatformStatusUpdates.retryInfo = {
          ...state.retryInfo,
          [id]: {
            ...state.retryInfo[id],
            ...retryInfoUpdates,
          },
        };
      }

      return {
        ...newPlatformStatusUpdates,
        publications: state.publications.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        currentPublication:
          state.currentPublication?.id === id
            ? { ...state.currentPublication, ...updated }
            : state.currentPublication,
      };
    }),

  removePublication: (id) =>
    set((state) => ({
      publications: state.publications.filter((p) => p.id !== id),
      currentPublication: state.currentPublication?.id === id ? null : state.currentPublication,
    })),

  createPublication: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(route("api.v1.publications.store"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      const response = await axios.post(route("api.v1.publications.update", id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      const response = await axios.post(route("api.v1.publications.duplicate", id));
      const publication = response.data.publication;
      if (publication) {
        get().addPublication(publication);
      }
      set({ isLoading: false });
      useCalendarStore.getState().fetchEvents();
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to duplicate publication",
        isLoading: false,
      });
      return false;
    }
  },

  publishPublication: async (id, formData) => {
    try {
      const response = await axios.post(route("api.v1.publications.publish", id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      const response = await axios.post(route("api.v1.publications.unpublish", id), {
        platform_ids: platformIds,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        data: error.response?.data?.message ?? "Failed to unpublish",
      };
    }
  },

  setCurrentPublication: (publication) => set({ currentPublication: publication }),

  getPublicationById: (id) => get().publications.find((p) => p.id === id),

  getPublishedPlatforms: (id) => get().publishedPlatforms[id] ?? [],

  getFailedPlatforms: (id) => get().failedPlatforms[id] ?? [],

  getRemovedPlatforms: (id) => get().removedPlatforms[id] ?? [],

  getPublishingPlatforms: (id) => get().publishingPlatforms[id] ?? [],

  getScheduledPlatforms: (id) => get().scheduledPlatforms[id] ?? [],

  getDuplicatePlatforms: (id) => get().duplicatePlatforms[id] ?? [], // Getter para plataformas duplicadas

  getRecurringPosts: (publicationId: number, accountId: number) =>
    get().recurringPosts[publicationId]?.[accountId] ?? [],

  getPublishedRecurringPosts: (publicationId: number, accountId: number) =>
    get().publishedRecurringPosts[publicationId]?.[accountId] ?? [],

  getRetryInfo: (publicationId, platformId) => {
    const info = get().retryInfo[publicationId];
    return info?.[platformId] ?? null;
  },

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

  setDuplicatePlatforms: (id, accounts) =>
    set((state) => ({
      duplicatePlatforms: { ...state.duplicatePlatforms, [id]: accounts },
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
      duplicatePlatforms: {}, // Limpiar cache de duplicados
      recurringPosts: {},
      publishedRecurringPosts: {},
      retryInfo: {},
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
      recurringPosts: {},
      publishedRecurringPosts: {},
      retryInfo: {},
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
      const response = await axios.post(route("api.v1.publications.unlock", id));
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        data: error.response?.data ?? { message: "Failed to release lock" },
      };
    }
  },
}));
