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
      
      console.log('submitForApproval response:', { publication, approvalInfo });
      
      // Update publication store immediately for instant UI feedback
      if (publication) {
        const { usePublicationStore } = await import("@/stores/publicationStore");
        const { useManageContentUIStore } = await import("@/stores/manageContentUIStore");
        
        // CRITICAL: Update the publication with the new status immediately
        // Ensure we're updating with the complete publication object
        const updateData = {
          ...publication,
          // Normalize field names (backend might use snake_case, frontend uses camelCase)
          status: publication.status,
          current_approval_step_id: publication.current_approval_step_id,
          current_approval_level: publication.current_approval_level,
          currentApprovalStep: publication.currentApprovalStep || publication.current_approval_step,
          approval_logs: publication.approval_logs || publication.approvalLogs,
          approvalLogs: publication.approval_logs || publication.approvalLogs,
          submitted_for_approval_at: publication.submitted_for_approval_at,
        };
        
        console.log('Updating publication in store:', {
          itemId,
          oldStatus: usePublicationStore.getState().publications.find(p => p.id === itemId)?.status,
          newStatus: updateData.status,
          updateData
        });
        
        usePublicationStore.getState().updatePublication(itemId, updateData);
        
        // Verify the update was applied
        const updatedPub = usePublicationStore.getState().publications.find(p => p.id === itemId);
        console.log('Publication after update:', {
          id: updatedPub?.id,
          status: updatedPub?.status,
          current_approval_step_id: updatedPub?.current_approval_step_id
        });
        
        // Also update selectedItem if this publication is currently open in a modal
        const selectedItem = useManageContentUIStore.getState().selectedItem;
        if (selectedItem?.id === itemId) {
          useManageContentUIStore.getState().updateSelectedItem(updateData);
          console.log('Selected item also updated');
        }
      } else {
        console.warn('No publication data in response');
      }
      
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
