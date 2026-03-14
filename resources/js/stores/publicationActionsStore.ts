import { router } from "@inertiajs/react";
import axios from "axios";
import { create } from "zustand";

interface LoadingStates {
  [key: number]: {
    publishing?: boolean;
    editing?: boolean;
    deleting?: boolean;
    duplicating?: boolean;
    submitting?: boolean;
  };
}

interface PublicationActionsStore {
  loadingStates: LoadingStates;
  setItemLoading: (itemId: number, key: keyof LoadingStates[number], value: boolean) => void;
  
  // Acciones de API
  submitForApproval: (itemId: number) => Promise<{ 
    success: boolean; 
    message?: string;
    approvalInfo?: {
      current_level: number;
      level_name: string;
      approvers: string[];
      approver_count: number;
    };
  }>;
  deletePublication: (itemId: number) => Promise<{ success: boolean; message?: string }>;
  deleteUserEvent: (itemId: number) => Promise<{ success: boolean; message?: string }>;
  duplicatePublication: (itemId: number) => Promise<{ success: boolean; message?: string }>;
}

export const usePublicationActionsStore = create<PublicationActionsStore>((set, get) => ({
  loadingStates: {},

  setItemLoading: (itemId, key, value) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [itemId]: {
          ...state.loadingStates[itemId],
          [key]: value,
        },
      },
    }));
  },

  submitForApproval: async (itemId) => {
    const { setItemLoading } = get();
    setItemLoading(itemId, "submitting", true);

    try {
      const response = await axios.post(`/api/v1/content/${itemId}/submit-for-approval`);
      const approvalInfo = response.data?.data?.approval_info;
      const publication = response.data?.data?.content || response.data?.data?.publication;
      
      // Update publication store immediately for instant UI feedback
      if (publication) {
        const publicationStoreModule = await import("@/stores/publicationStore");
        const manageContentUIStoreModule = await import("@/stores/manageContentUIStore");
        
        // CRITICAL: Update the publication with the new status immediately
        publicationStoreModule.usePublicationStore.getState().updatePublication(itemId, {
          status: publication.status,
          current_approval_step_id: publication.current_approval_step_id,
          currentApprovalStep: publication.currentApprovalStep,
          approval_logs: publication.approval_logs,
          approvalLogs: publication.approval_logs,
          submitted_for_approval_at: publication.submitted_for_approval_at,
          // Include all other fields from the response
          ...publication
        });
        
        // Also update selectedItem if this publication is currently open in a modal
        const selectedItem = manageContentUIStoreModule.useManageContentUIStore.getState().selectedItem;
        if (selectedItem?.id === itemId) {
          manageContentUIStoreModule.useManageContentUIStore.getState().updateSelectedItem({
            status: publication.status,
            current_approval_step_id: publication.current_approval_step_id,
            currentApprovalStep: publication.currentApprovalStep,
            approval_logs: publication.approval_logs,
            approvalLogs: publication.approval_logs,
            submitted_for_approval_at: publication.submitted_for_approval_at,
            ...publication
          });
        }
      }
      
      // Reload in background to sync with server (without blocking UI)
      setTimeout(() => {
        router.reload({ only: ["publications"], preserveScroll: true });
      }, 100);
      
      return { 
        success: true,
        approvalInfo: approvalInfo,
      };
    } catch (error: any) {
      console.error("Error submitting for approval:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al enviar a revisión",
      };
    } finally {
      setItemLoading(itemId, "submitting", false);
    }
  },

  deletePublication: async (itemId) => {
    const { setItemLoading } = get();
    setItemLoading(itemId, "deleting", true);

    try {
      // La eliminación se maneja a través del callback onDelete
      // que viene del componente padre
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting publication:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al eliminar",
      };
    } finally {
      setItemLoading(itemId, "deleting", false);
    }
  },

  deleteUserEvent: async (itemId) => {
    const { setItemLoading } = get();
    setItemLoading(itemId, "deleting", true);

    try {
      await axios.delete(`/api/v1/calendar/user-events/${itemId}`);
      router.reload({ only: ["publications"] });
      return { success: true, message: "Evento eliminado" };
    } catch (error: any) {
      console.error("Error deleting user event:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al eliminar evento",
      };
    } finally {
      setItemLoading(itemId, "deleting", false);
    }
  },

  duplicatePublication: async (itemId) => {
    const { setItemLoading } = get();
    setItemLoading(itemId, "duplicating", true);

    try {
      // La duplicación se maneja a través del callback onDuplicate
      // que viene del componente padre
      return { success: true };
    } catch (error: any) {
      console.error("Error duplicating publication:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al duplicar",
      };
    } finally {
      setItemLoading(itemId, "duplicating", false);
    }
  },
}));
