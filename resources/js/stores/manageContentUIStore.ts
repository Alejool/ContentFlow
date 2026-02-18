import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { create } from "zustand";

type SelectedItem = Campaign | Publication | null;

interface ManageContentUIState {
  activeTab: "publications" | "campaigns" | "logs" | "calendar" | "approvals";
  tabOrder: string[];
  selectedItem: SelectedItem;

  isAddModalOpen: boolean;
  addType: "publication" | "campaign" | null;
  isEditModalOpen: boolean;
  isPublishModalOpen: boolean;
  isViewDetailsModalOpen: boolean;

  setActiveTab: (
    tab: "publications" | "campaigns" | "logs" | "calendar" | "approvals",
  ) => void;
  setTabOrder: (order: string[]) => void;
  setSelectedItem: (item: SelectedItem) => void;

  openAddModal: (type?: "publication" | "campaign") => void;
  closeAddModal: () => void;

  openEditModal: (item: SelectedItem) => void;
  closeEditModal: () => void;

  openPublishModal: (item: Publication) => void;
  closePublishModal: () => void;

  openViewDetailsModal: (item: SelectedItem) => void;
  closeViewDetailsModal: () => void;
}

export const useManageContentUIStore = create<ManageContentUIState>((set) => {
  // Try to load saved order from localStorage
  const savedOrder =
    typeof window !== "undefined"
      ? localStorage.getItem("manage_content_tab_order")
      : null;
  const initialOrder = savedOrder
    ? JSON.parse(savedOrder)
    : ["publications", "campaigns", "calendar", "logs", "approvals"];

  // Try to load saved active tab from localStorage
  const savedActiveTab =
    typeof window !== "undefined"
      ? localStorage.getItem("manage_content_active_tab")
      : null;
  const initialActiveTab = (savedActiveTab as ManageContentUIState["activeTab"]) || "publications";

  return {
    activeTab: initialActiveTab,
    tabOrder: initialOrder,
    selectedItem: null,

    isAddModalOpen: false,
    addType: null,
    isEditModalOpen: false,
    isPublishModalOpen: false,
    isViewDetailsModalOpen: false,

    setActiveTab: (tab) => {
      set({ activeTab: tab });
      if (typeof window !== "undefined") {
        localStorage.setItem("manage_content_active_tab", tab);
      }
    },
    setTabOrder: (order) => {
      set({ tabOrder: order });
      if (typeof window !== "undefined") {
        localStorage.setItem("manage_content_tab_order", JSON.stringify(order));
      }
    },
    setSelectedItem: (item) => set({ selectedItem: item }),

    openAddModal: (type) =>
      set({ isAddModalOpen: true, addType: type || null }),
    closeAddModal: () => set({ isAddModalOpen: false, addType: null }),

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
  };
});
