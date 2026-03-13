import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import { useMemo } from "react";

/**
 * Hook centralizado para manejar todos los permisos relacionados con publicaciones
 */
export function usePublicationPermissions(permissions: string[] = []) {
  const { auth } = usePage<any>().props;
  const currentUserId = auth.user?.id;
  const currentWorkspace = auth.current_workspace;

  // Permisos básicos
  const canManageContent = useMemo(
    () => permissions.includes("manage-content") || permissions.includes("publish"),
    [permissions]
  );

  const canPublish = useMemo(
    () => permissions.includes("publish"),
    [permissions]
  );

  const canDelete = useMemo(
    () => permissions.includes("publish"),
    [permissions]
  );

  const canEdit = useMemo(
    () => canManageContent,
    [canManageContent]
  );

  const canDuplicate = useMemo(
    () => canManageContent,
    [canManageContent]
  );

  const canView = useMemo(
    () => true, // Todos pueden ver
    []
  );

  // Información del workspace
  const hasWorkflow = useMemo(
    () => currentWorkspace?.approval_workflow?.is_enabled === true,
    [currentWorkspace]
  );

  const isOwner = useMemo(
    () => currentWorkspace?.user_role_slug === "owner",
    [currentWorkspace]
  );

  // Verificar si puede publicar directamente una publicación específica
  const canPublishDirectly = (item: Publication) => {
    if (!item || !currentUserId) return false;

    // Si es Owner, puede publicar siempre
    if (isOwner) return true;

    // Si tiene permiso "publish", puede publicar siempre
    if (canPublish) return true;

    // Verificar si tiene aprobación activa
    const hasActiveApproval = item.approval_logs?.some(
      (log: any) =>
        log.requested_by === currentUserId &&
        log.action === "approved" &&
        log.reviewed_at !== null
    );

    if (!hasActiveApproval) return false;

    // Verificar estado válido
    const canPublishStates = ["approved", "failed", "publishing", "published", "scheduled"];
    return canPublishStates.includes(item.status || "");
  };

  // Verificar si debe mostrar botón de enviar a revisión
  const shouldShowSendToReview = (item: Publication) => {
    if (!hasWorkflow || isOwner) return false;
    if (canPublish) return false;
    if (canPublishDirectly(item)) return false;
    return ["draft", "rejected"].includes(item.status || "draft");
  };

  // Verificar si debe mostrar botón de publicar
  const shouldShowPublish = (item: Publication) => {
    if (isOwner && ["draft", "rejected", "publishing", "approved", "failed" ,"published", "scheduled", "retrying"].includes(item.status || "draft")) {
      return true;
    }
    if (hasWorkflow && item.status === "approved") {
      return true;
    }
    if (!hasWorkflow && canPublishDirectly(item)) {
      return true;
    }
    return false;
  };

  // Verificar si puede editar una publicación específica
  const canEditItem = (item: Publication, remoteLock?: any) => {
    if (!canEdit) return false;
    if (remoteLock) return false;
    return true;
  };

  // Verificar si puede eliminar una publicación específica
  const canDeleteItem = (item: Publication) => {
    return canDelete;
  };

  return {
    // Permisos básicos
    canManageContent,
    canPublish,
    canDelete,
    canEdit,
    canDuplicate,
    canView,

    // Información del workspace
    hasWorkflow,
    isOwner,
    currentUserId,

    // Verificaciones específicas por item
    canPublishDirectly,
    shouldShowSendToReview,
    shouldShowPublish,
    canEditItem,
    canDeleteItem,
  };
}
