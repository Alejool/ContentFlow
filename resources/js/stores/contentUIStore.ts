import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { create } from "zustand";

type SelectedItem = Campaign | Publication | null;

interface ContentUIState {
  activeTab: "publications" | "campaigns" | "logs" | "calendar" | "approvals";
  selectedItem: SelectedItem;

  // Modal States
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isPublishModalOpen: boolean;
  isViewDetailsModalOpen: boolean;

  // Actions
  setActiveTab: (
    tab: "publications" | "campaigns" | "logs" | "calendar" | "approvals",
  ) => void;
  setSelectedItem: (item: SelectedItem) => void;

  openAddModal: () => void;
  closeAddModal: () => void;

  openEditModal: (item: SelectedItem) => void;
  closeEditModal: () => void;

  openPublishModal: (item: Publication) => void;
  closePublishModal: () => void;

  openViewDetailsModal: (item: SelectedItem) => void;
  closeViewDetailsModal: () => void;
}

export const useContentUIStore = create<ContentUIState>((set) => ({
  activeTab: "publications",
  selectedItem: null,

  isAddModalOpen: false,
  isEditModalOpen: false,
  isPublishModalOpen: false,
  isViewDetailsModalOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedItem: (item) => set({ selectedItem: item }),

  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),

  openEditModal: (item) =>
    set({
      selectedItem: item,
      isEditModalOpen: true,
    }),
  closeEditModal: () =>
    set({
      selectedItem: null,
      isEditModalOpen: false,
    }),

  openPublishModal: (item) =>
    set({
      selectedItem: item,
      isPublishModalOpen: true,
    }),
  closePublishModal: () =>
    set({
      selectedItem: null,
      isPublishModalOpen: false,
    }),

  openViewDetailsModal: (item) =>
    set({
      selectedItem: item,
      isViewDetailsModalOpen: true,
    }),
  closeViewDetailsModal: () =>
    set({
      selectedItem: null,
      isViewDetailsModalOpen: false,
    }),
}));
