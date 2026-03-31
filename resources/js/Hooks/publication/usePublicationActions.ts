import { usePublicationActionsStore } from '@/stores/publicationActionsStore';
import type { Publication } from '@/types/Publication';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { usePublicationPermissions } from './usePublicationPermissions';

interface UsePublicationActionsProps {
  onEdit?: (item: Publication) => void;
  onDelete?: (id: number) => void;
  onPublish?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
  onEditRequest?: (item: Publication) => void;
  permissions?: string[];
}

/**
 * Hook para manejar las acciones de publicaciones
 * Conecta los permisos con el store y los callbacks del componente padre
 */
export function usePublicationActions({
  onEdit,
  onDelete,
  onPublish,
  onViewDetails,
  onDuplicate,
  onEditRequest,
  permissions = [],
}: UsePublicationActionsProps) {
  const { t } = useTranslation();

  // Obtener permisos
  const permissionsHook = usePublicationPermissions(permissions);

  // Obtener estado y acciones del store
  const { loadingStates, submitForApproval, deleteUserEvent } = usePublicationActionsStore();

  // Acción: Enviar a revisión
  const handleSubmitForApproval = useCallback(
    async (item: Publication) => {
      if (!item.id) return;

      const result = await submitForApproval(item.id);

      if (result.success) {
        const approvalInfo = result.approvalInfo;

        if (approvalInfo) {
          const approversList =
            approvalInfo.approvers.length > 0
              ? approvalInfo.approvers.join(', ')
              : t('approvals.unknownApprover');

          const message = t('approvals.sentToReview', {
            level:
              approvalInfo.level_name || `${t('approvals.level')} ${approvalInfo.current_level}`,
            approvers: approversList,
            defaultValue: `Enviado a revisión - ${approvalInfo.level_name || `Nivel ${approvalInfo.current_level}`}. Revisores: ${approversList}`,
          });

          toast.success(message);
        } else {
          toast.success(
            t('approvals.sentToReviewGeneric', {
              defaultValue: 'Enviado a revisión exitosamente',
            }),
          );
        }
      } else {
        toast.error(result.message || t('approvals.errors.submit_failed'));
      }
    },
    [submitForApproval, t],
  );

  // Acción: Publicar
  const handlePublish = useCallback(
    async (item: Publication) => {
      if (!onPublish || !item.id) return;
      await onPublish(item);
    },
    [onPublish],
  );

  // Acción: Editar
  const handleEdit = useCallback(
    (item: Publication, remoteLock?: any) => {
      if (!onEdit || !item.id) return;

      if (remoteLock) {
        const lockedByName = remoteLock.user_name || remoteLock.user?.name || t('common.unknown');
        toast.error(`${t('publications.table.lockedBy')} ${lockedByName}`);
        return;
      }

      if (onEditRequest) {
        onEditRequest(item);
      } else {
        onEdit(item);
      }
    },
    [onEdit, onEditRequest, t],
  );

  // Acción: Eliminar
  const handleDelete = useCallback(
    async (item: Publication, isUserEvent = false) => {
      if (!onDelete || !item.id) return;

      if (isUserEvent) {
        if (
          confirm(
            t('calendar.userEvents.modal.messages.confirmDelete') ||
              '¿Estás seguro de que deseas eliminar este evento?',
          )
        ) {
          const result = await deleteUserEvent(item.id);

          if (result.success) {
            toast.success(result.message || t('calendar.userEvents.modal.messages.successDelete'));
          } else {
            toast.error(result.message || t('common.deleteError'));
          }
        }
      } else {
        onDelete(item.id);
      }
    },
    [onDelete, deleteUserEvent, t],
  );

  // Acción: Duplicar
  const handleDuplicate = useCallback(
    (itemId: number) => {
      if (!onDuplicate) return;
      onDuplicate(itemId);
    },
    [onDuplicate],
  );

  // Acción: Ver detalles
  const handleViewDetails = useCallback(
    (item: Publication) => {
      if (onViewDetails) {
        onViewDetails(item);
      }
    },
    [onViewDetails],
  );

  return {
    // Estados del store
    loadingStates,

    // Permisos (del hook de permisos)
    ...permissionsHook,

    // Acciones
    handleSubmitForApproval,
    handlePublish,
    handleEdit,
    handleDelete,
    handleDuplicate,
    handleViewDetails,
  };
}
