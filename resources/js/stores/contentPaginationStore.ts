import { create } from 'zustand';

/**
 * Global pagination state for the content management lists.
 *
 * Centralising page here (instead of React useState inside a hook)
 * allows any mutation — update, create, duplicate — to call
 * `resetToFirstPage()` and immediately surface the most-recently-
 * updated item at the top of the list, regardless of which page
 * the user was previously viewing.
 */
interface ContentPaginationState {
  page: number;
  itemsPerPage: number;
  setPage: (page: number) => void;
  setItemsPerPage: (perPage: number) => void;
  /** Reset to page 1 — call this after any create / update / duplicate. */
  resetToFirstPage: () => void;
}

export const useContentPaginationStore = create<ContentPaginationState>((set) => ({
  page: 1,
  itemsPerPage: 12,

  setPage: (page) => set({ page }),
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage, page: 1 }),
  resetToFirstPage: () => set({ page: 1 }),
}));
