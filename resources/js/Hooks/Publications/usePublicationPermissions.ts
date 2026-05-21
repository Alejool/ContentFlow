import { useAbility } from '@/Contexts/Auth/AbilityContext';
import type { Publication } from '@/types/Publications/Publication';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

/**
 * Hook centralizado para manejar todos los permisos relacionados con publicaciones
 * Integrado con CASL para permisos declarativos
 */
export function usePublicationPermissions(permissions: string[] = []) {
  const { auth } = usePage<any>().props;
  const ability = useAbility();
  const currentUserId = auth.user?.id;
  const currentWorkspace = auth.current_workspace;

  const canManageContent = useMemo(() => {
    if (!currentUserId) {
      return ability.can('create', 'Publication');
    }

    return (
      ability.can('update', 'Publication') ||
      ability.can('create', 'Publication') ||
      ability.can('update', 'Publication', { user_id: currentUserId })
    );
  }, [ability, currentUserId]);

  const canPublish = useMemo(() => ability.can('publish', 'Publication'), [ability]);

  const canDelete = useMemo(() => ability.can('delete', 'Publication'), [ability]);

  const canEdit = useMemo(() => canManageContent, [canManageContent]);

  const canDuplicate = useMemo(() => canManageContent, [canManageContent]);

  const canView = useMemo(() => ability.can('read', 'Publication'), [ability]);

  const canApprove = useMemo(() => ability.can('approve', 'ApprovalRequest'), [ability]);

  const canReject = useMemo(() => ability.can('reject', 'ApprovalRequest'), [ability]);

  const canSubmitForApproval = useMemo(
    () => ability.can('submit_for_approval', 'Publication'),
    [ability],
  );

  // Información del workspace
  const hasWorkflow = useMemo(
    () => currentWorkspace?.approval_workflow?.is_enabled === true,
    [currentWorkspace],
  );

  // Verificar si el usuario es el aprobador del último nivel del workflow
  const isLastLevelApprover = useMemo(() => {
    if (!hasWorkflow || !currentWorkspace?.approval_workflow?.levels) {
      return false;
    }

    const levels = currentWorkspace.approval_workflow.levels;
    if (!levels || levels.length === 0) {
      return false;
    }

    // Obtener el último nivel (el de mayor level_number)
    const lastLevel = levels.reduce(
      (max, level) => (level.level_number > max.level_number ? level : max),
      levels[0],
    );

    // Verificar si el rol del usuario coincide con el rol del último nivel
    const userRoleSlug = currentWorkspace?.user_role_slug;
    const lastLevelRoleSlug = lastLevel?.role?.slug;

    return userRoleSlug === lastLevelRoleSlug;
  }, [hasWorkflow, currentWorkspace]);

  const isOwner = useMemo(
    () =>
      currentWorkspace?.user_role_slug === 'owner' ||
      currentWorkspace?.user_role_slug === 'admin-owner',
    [currentWorkspace],
  );

  const isAdmin = useMemo(() => currentWorkspace?.user_role_slug === 'admin', [currentWorkspace]);

  const isAdminOrOwner = useMemo(() => isOwner || isAdmin, [isOwner, isAdmin]);

  // Verificar si puede publicar directamente una publicación específica
  const canPublishDirectly = (item: Publication) => {
    if (!item || !currentUserId) return false;

    // SOLO el Owner puede publicar directamente sin importar el workflow
    if (isOwner && item.status !== 'pending_review') return true;

    // Si hay workflow activo:
    // - NADIE puede publicar directamente desde draft/rejected (deben enviar a revisión)
    // - Solo el aprobador del último nivel puede publicar contenido aprobado
    if (hasWorkflow) {
      // Debe ser el aprobador del último nivel
      if (!isLastLevelApprover) {
        return false;
      }

      // Solo puede publicar si el contenido ya está aprobado o es retry
      return (
        item.status === 'approved' ||
        item.status === 'failed' ||
        item.status === 'published' ||
        item.status === 'scheduled'
      );
    }

    // CRÍTICO: Sin workflow, SOLO Admin y Owner pueden publicar directamente
    // Otros roles (incluso con permiso "publish") deben enviar a revisión
    if (isAdminOrOwner) {
      return ['draft', 'rejected', 'failed', 'published', 'scheduled'].includes(item.status || '');
    }

    return false;
  };

  // Verificar si debe mostrar botón de enviar a revisión
  const shouldShowSendToReview = (item: Publication) => {
    if (!item) return false;

    // Owner can publish directly and does not need the review flow
    if (isOwner) return false;

    // If the user cannot submit for approval, do not show the button
    if (!canSubmitForApproval) return false;

    // Do not display when the publication is already in review or publishing
    if (['pending_review', 'publishing', 'retrying'].includes(item.status || '')) {
      return false;
    }

    // If the user can publish directly, they should not see a review button
    if (canPublishDirectly(item)) return false;

    return ['draft', 'rejected', 'failed'].includes(item.status || 'draft');
  };

  // Detectar si el workflow es multinivel
  const isMultiLevelWorkflow = useMemo(() => {
    const levels = currentWorkspace?.approval_workflow?.levels;
    return Array.isArray(levels) && levels.length > 1;
  }, [currentWorkspace]);

  // Verificar si debe mostrar botón de publicar
  const shouldShowPublish = (item: Publication) => {
    // Nunca mostrar si está en revisión
    if (item.status === 'pending_review') return false;

    const submitterId = item.approval_request?.submitted_by;
    const isSubmitter = submitterId === currentUserId;

    // Retry / republicar — mismas reglas pero para estados de reintento
    const isRetryStatus = ['failed', 'published', 'scheduled'].includes(item.status || '');

    // Owner: siempre puede publicar
    if (isOwner) return true;

    if (item.status === 'approved') {
      if (isMultiLevelWorkflow) {
        // Multinivel: solo Owner (ya cubierto) y quien lo envió
        return isSubmitter;
      }
      // Sin flujo o nivel único: Owner + Admin + quien lo envió
      return isAdmin || isSubmitter;
    }

    // Para retry: mismas reglas según tipo de workflow
    if (isRetryStatus) {
      if (isMultiLevelWorkflow) return isOwner || isSubmitter;
      return isOwner || isAdmin || isSubmitter;
    }

    // Draft/rejected sin workflow: Admin puede publicar directamente
    if (!hasWorkflow && isAdmin) {
      return ['draft', 'rejected'].includes(item.status || '');
    }

    return false;
  };

  // Verificar si puede editar una publicación específica
  const canEditItem = (item: Publication, remoteLock?: any) => {
    if (!canEdit) return false;
    if (remoteLock) return false;

    // Si está en revisión, no puede editar
    if (item.status === 'pending_review') return false;

    return true;
  };

  // Verificar si puede eliminar una publicación específica
  const canDeleteItem = (item: Publication) => {
    return canDelete;
  };

  // Verificar si puede aprobar una publicación específica
  const canApproveItem = (item: Publication) => {
    if (!canApprove) return false;
    if (item.status !== 'pending_review') return false;

    // Verificación detallada se hace en el backend
    return true;
  };

  return {
    // Permisos básicos
    canManageContent,
    canPublish,
    canDelete,
    canEdit,
    canDuplicate,
    canView,
    canApprove,
    canReject,
    canSubmitForApproval,

    // Información del workspace
    hasWorkflow,
    isOwner,
    isAdmin,
    isAdminOrOwner,
    isLastLevelApprover,
    isMultiLevelWorkflow,
    currentUserId,

    // Verificaciones específicas por item
    canPublishDirectly,
    shouldShowSendToReview,
    shouldShowPublish,
    canEditItem,
    canDeleteItem,
    canApproveItem,

    // Instancia de CASL ability para checks personalizados
    ability,
  };
}
