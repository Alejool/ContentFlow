import { Publication } from "@/types/Publication";
import axios from "axios";
import { create } from "zustand";

interface PublicationState {
  publications: Publication[];
  currentPublication: Publication | null;
  publishedPlatforms: Record<number, number[]>; // publicationId -> accountIds[]
  isLoading: boolean;
  error: string | null;

  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };

  // Fetch operations
  fetchPublications: (filters?: any, page?: number) => Promise<void>;
  fetchPublicationById: (id: number) => Promise<Publication | null>;
  fetchPublishedPlatforms: (publicationId: number) => Promise<number[]>;

  // CRUD operations
  addPublication: (publication: Publication) => void;
  updatePublication: (id: number, publication: Partial<Publication>) => void;
  removePublication: (id: number) => void;
  setCurrentPublication: (publication: Publication | null) => void;

  // Cache operations
  getPublicationById: (id: number) => Publication | undefined;
  getPublishedPlatforms: (publicationId: number) => number[];
  setPublishedPlatforms: (publicationId: number, accountIds: number[]) => void;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export const usePublicationStore = create<PublicationState>((set, get) => ({
  publications: [],
  currentPublication: null,
  publishedPlatforms: {},
  isLoading: false,
  error: null,

  pagination: {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  },

  fetchPublications: async (filters = {}, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const params = { ...filters, page };
      const response = await axios.get("/publications", { params });

      // Handle different response structures if necessary (e.g. wrapped in 'data' or root)
      const data = response.data.publications || response.data;
      const publications = data.data || [];

      set({
        publications,
        pagination: {
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          total: data.total || 0,
          per_page: data.per_page || 15,
        },
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Error fetching publications:", error);
      set({
        error: error.message || "Failed to fetch publications",
        isLoading: false,
      });
    }
  },

  fetchPublicationById: async (id: number) => {
    // Check cache first
    const cached = get().publications.find((p) => p.id === id);
    if (cached) {
      set({ currentPublication: cached });
      return cached;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/publications/${id}`);
      const publication = response.data.publication || response.data;

      // Update cache
      set((state) => ({
        publications: [
          ...state.publications.filter((p) => p.id !== id),
          publication,
        ],
        currentPublication: publication,
        isLoading: false,
      }));

      return publication;
    } catch (error: any) {
      console.error("Error fetching publication:", error);
      set({
        error: error.message || "Failed to fetch publication",
        isLoading: false,
      });
      return null;
    }
  },

  fetchPublishedPlatforms: async (publicationId: number) => {
    // Check cache first
    const cached = get().publishedPlatforms[publicationId];
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(
        `/publications/${publicationId}/published-platforms`
      );
      const accountIds = response.data.published_platforms || [];

      // Update cache
      set((state) => ({
        publishedPlatforms: {
          ...state.publishedPlatforms,
          [publicationId]: accountIds,
        },
      }));

      return accountIds;
    } catch (error: any) {
      console.error("Error fetching published platforms:", error);
      return [];
    }
  },

  addPublication: (publication: Publication) => {
    set((state) => ({
      publications: [publication, ...state.publications],
    }));
  },

  updatePublication: (id: number, updatedPublication: Partial<Publication>) => {
    set((state) => ({
      publications: state.publications.map((pub) =>
        pub.id === id ? { ...pub, ...updatedPublication } : pub
      ),
      currentPublication:
        state.currentPublication?.id === id
          ? { ...state.currentPublication, ...updatedPublication }
          : state.currentPublication,
    }));
  },

  removePublication: (id: number) => {
    set((state) => ({
      publications: state.publications.filter((pub) => pub.id !== id),
      currentPublication:
        state.currentPublication?.id === id ? null : state.currentPublication,
      publishedPlatforms: Object.fromEntries(
        Object.entries(state.publishedPlatforms).filter(
          ([key]) => Number(key) !== id
        )
      ),
    }));
  },

  setCurrentPublication: (publication: Publication | null) => {
    set({ currentPublication: publication });
  },

  getPublicationById: (id: number) => {
    return get().publications.find((pub) => pub.id === id);
  },

  getPublishedPlatforms: (publicationId: number) => {
    return get().publishedPlatforms[publicationId] || [];
  },

  setPublishedPlatforms: (publicationId: number, accountIds: number[]) => {
    set((state) => ({
      publishedPlatforms: {
        ...state.publishedPlatforms,
        [publicationId]: accountIds,
      },
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      publications: [],
      currentPublication: null,
      publishedPlatforms: {},
      isLoading: false,
      error: null,
    });
  },
}));
