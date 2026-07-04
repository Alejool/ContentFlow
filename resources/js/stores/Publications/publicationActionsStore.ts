import { approvalService } from '@/Services/Approval/approvalService';
import type { Publication } from '@/types/Publications/Publication';
import { userEventService } from '@/Services/Calendar/userEventService';
import { useManageContentUIStore } from '@/stores/Content/manageContentUIStore';
import { usePublicationStore } from '@/stores/Publications/publicationStore';
import { router } from '@inertiajs/react';
import { create } from 'zustand';

function apiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as { response?: { data?: { message?: string } } };
  return axiosError.response?.data?.message || fallback;
}

interface ApprovalRequestPayload {
  currentStep?: { level_number?: number | string; level_name?: string };
  [key: string]: unknown;
}

interface PublicationPayload {
  status?: string;
  current_approval_step_id?: number | null;
  current_approval_level?: number | null;
  submitted_for_approval_at?: string | null;
  [key: string]: unknown;
}

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
    setItemLoading(itemId, 'submitting', true);

    try {
      // Nuevo endpoint del sistema simplificado
      const data = (await approvalService.submitPublication(itemId)) as {
        data?: { request?: ApprovalRequestPayload; publication?: PublicationPayload };
        request?: ApprovalRequestPayload;
        publication?: PublicationPayload;
      };

      // Backend can return either { data: { request, publication } } or { request, publication }
      const approvalRequest = data?.data?.request ?? data?.request;
      const publication = data?.data?.publication ?? data?.publication;

      // Actualizar el store de publicaciones con el nuevo estado
      if (publication) {
        const updateData = {
          ...publication,
          // Incluir el approval_request activo para el frontend
          approval_request: approvalRequest,
        } as unknown as Partial<Publication>;

        // Actualizar la publicación en el store con el nuevo estado
        usePublicationStore.getState().updatePublication(itemId, updateData);

        // Actualizar selectedItem si está abierto
        const selectedItem = useManageContentUIStore.getState().selectedItem;
        if (selectedItem?.id === itemId) {
          useManageContentUIStore.getState().updateSelectedItem(updateData);
        }

        // CRITICAL: Emit event to trigger list refresh
        // The backend has already invalidated the cache, so the next API call
        // will return fresh data without this publication (now in pending_review status)
        window.dispatchEvent(
          new CustomEvent('publication-submitted-for-approval', {
            detail: { publicationId: itemId, publication: updateData },
          }),
        );
      }

      const approvalInfo = approvalRequest
        ? {
            current_level: Number(approvalRequest.currentStep?.level_number ?? 1),
            level_name: String(approvalRequest.currentStep?.level_name ?? ''),
            approvers: [] as string[],
            approver_count: 0,
          }
        : undefined;

      return approvalInfo ? { success: true, approvalInfo } : { success: true };
    } catch (error) {
      return {
        success: false,
        message: apiErrorMessage(error, 'Error al enviar a revisión'),
      };
    } finally {
      setItemLoading(itemId, 'submitting', false);
    }
  },

  deletePublication: async (itemId) => {
    const { setItemLoading } = get();
    setItemLoading(itemId, 'deleting', true);

    try {
      // La eliminación se maneja a través del callback onDelete
      // que viene del componente padre
      return { success: true };
    } catch (error) {
      console.error('Error deleting publication:', error);
      return {
        success: false,
        message: apiErrorMessage(error, 'Error al eliminar'),
      };
    } finally {
      setItemLoading(itemId, 'deleting', false);
    }
  },

  deleteUserEvent: async (itemId) => {
    const { setItemLoading } = get();
    setItemLoading(itemId, 'deleting', true);

    try {
      await userEventService.delete(itemId);
      router.reload({ only: ['publications'] });
      return { success: true, message: 'Evento eliminado' };
    } catch (error) {
      console.error('Error deleting user event:', error);
      return {
        success: false,
        message: apiErrorMessage(error, 'Error al eliminar evento'),
      };
    } finally {
      setItemLoading(itemId, 'deleting', false);
    }
  },

  duplicatePublication: async (itemId) => {
    const { setItemLoading } = get();
    setItemLoading(itemId, 'duplicating', true);

    try {
      // La duplicación se maneja a través del callback onDuplicate
      // que viene del componente padre
      return { success: true };
    } catch (error) {
      console.error('Error duplicating publication:', error);
      return {
        success: false,
        message: apiErrorMessage(error, 'Error al duplicar'),
      };
    } finally {
      setItemLoading(itemId, 'duplicating', false);
    }
  },
}));
