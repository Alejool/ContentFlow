import { Publication } from "@/types/Publication";
import axios from "axios";
import { create } from "zustand";

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

  clearError: () => void;
  reset: () => void;
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
    try {
      const response = await axios.get("/publications", {
        params: { ...filters, page },
      });

      const data = response.data.publications;

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
      const response = await axios.get(`/publications/${id}`);
      const publication = response.data.publication;

      set((state) => ({
        publications: state.publications.map((p) =>
          p.id === id ? publication : p
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
        `/publications/${publicationId}/published-platforms`
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
    set((state) => ({
      publications: state.publications.map((p) =>
        p.id === id ? { ...p, ...updated } : p
      ),
      currentPublication:
        state.currentPublication?.id === id
          ? { ...state.currentPublication, ...updated }
          : state.currentPublication,
    })),

  removePublication: (id) =>
    set((state) => ({
      publications: state.publications.filter((p) => p.id !== id),
      currentPublication:
        state.currentPublication?.id === id ? null : state.currentPublication,
    })),

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
}));
