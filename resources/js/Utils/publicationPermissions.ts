import { Publication } from "@/types/Publication";

/**
 * Verifica si un usuario puede publicar directamente una publicación
 * basándose en permisos y aprobaciones activas
 */
export function canUserPublishDirectly(
  publication: Publication | null | undefined,
  currentUserId: number | undefined,
  permissions: string[]
): boolean {
  if (!publication || !currentUserId) return false;

  // 1. Si tiene permiso "publish", puede publicar siempre
  const hasPublishPermission = permissions.includes("publish");
  if (hasPublishPermission) return true;

  // 2. Verificar si el usuario actual tiene una aprobación activa
  const hasActiveApproval = publication.approval_logs?.some(
    (log: any) =>
      log.requested_by === currentUserId &&
      log.action === "approved" &&
      log.reviewed_at !== null
  );

  if (!hasActiveApproval) return false;

  // 3. Verificar que la publicación esté en un estado que permita publicar
  // (no debe estar en draft o rejected)
  const canPublishStates = [
    "approved",
    "failed",
    "publishing",
    "published",
    "scheduled",
  ];
  const isInValidState = canPublishStates.includes(publication.status || "");

  return hasActiveApproval && isInValidState;
}

/**
 * Verifica si un usuario debe ver el botón de solicitar aprobación
 */
export function shouldShowRequestApproval(
  publication: Publication | null | undefined,
  currentUserId: number | undefined,
  permissions: string[]
): boolean {
  if (!publication || !currentUserId) return false;

  // No mostrar si tiene permiso de publicar
  if (permissions.includes("publish")) return false;

  // No mostrar si puede publicar directamente
  if (canUserPublishDirectly(publication, currentUserId, permissions))
    return false;

  // Mostrar si no tiene permiso de publicar y no puede publicar directamente
  // y tiene permiso de manage-content
  return permissions.includes("manage-content");
}
