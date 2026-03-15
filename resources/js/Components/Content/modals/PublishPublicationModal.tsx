import Button from "@/Components/common/Modern/Button";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import RejectionReasonModal from "@/Components/Content/modals/RejectionReasonModal";
import { CONTENT_TYPE_CONFIG } from "@/Constants/contentTypes";
import { getPlatformConfig } from "@/Constants/socialPlatforms";
import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { useConfirm } from "@/Hooks/useConfirm";
import { usePublicationStore } from "@/stores/publicationStore";
import { Publication } from "@/types/Publication";
import { formatDateTimeStyled } from "@/Utils/dateHelpers";
import { formatDateTime } from "@/Utils/formatDate";
import { validateVideoDuration } from "@/Utils/validationUtils";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePage } from "@inertiajs/react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Share2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Helper component for recurring posts section
const RecurringPostsSection = ({
  publication,
  accountId,
  getRecurringPosts,
  getPublishedRecurringPosts,
  t,
}: {
  publication: Publication;
  accountId: number;
  getRecurringPosts: (pubId: number, accId: number) => any[];
  getPublishedRecurringPosts: (pubId: number, accId: number) => any[];
  t: any;
}) => {
  const recurringScheduled = getRecurringPosts(publication.id, accountId);
  const recurringPublished = getPublishedRecurringPosts(
    publication.id,
    accountId,
  );

  // Eliminar duplicados basados en el ID
  const uniqueScheduled = Array.from(
    new Map(recurringScheduled.map((post: any) => [post.id, post])).values(),
  );
  const uniquePublished = Array.from(
    new Map(recurringPublished.map((post: any) => [post.id, post])).values(),
  );

  const hasRecurring = uniqueScheduled.length > 0 || uniquePublished.length > 0;

  if (!hasRecurring) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-gray-200 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {t("publications.modal.publish.recurringPosts") ||
            "Publicaciones Recurrentes"}
        </span>
      </div>

      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent">
        {uniqueScheduled.map((post: any) => (
          <div
            key={post.id}
            className="flex items-center justify-between text-xs p-2 bg-white dark:bg-neutral-900 rounded border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {formatDateTimeStyled(post.scheduled_at, "short", "short")}
              </span>
            </div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {t("publications.status.scheduled") || "Programado"}
            </span>
          </div>
        ))}

        {uniquePublished.map((post: any) => (
          <div
            key={post.id}
            className="flex items-center justify-between text-xs p-2 bg-white dark:bg-neutral-900 rounded border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {formatDateTimeStyled(post.published_at, "short", "short")}
              </span>
            </div>
            {post.post_url ? (
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:underline font-medium flex items-center gap-1"
              >
                {t("publications.modal.publish.viewPost") || "Ver"}
                <Share2 className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                {t("publications.status.published") || "Publicado"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface PublishPublicationModalProps {
  isOpen: boolean;
  onClose: (id?: number) => void;
  publication: Publication | null;
  onSuccess?: () => void;
}

export default function PublishPublicationModal({
  isOpen,
  onClose,
  publication,
  onSuccess,
}: PublishPublicationModalProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const { t, i18n } = useTranslation();

  const [activePlatformSettings, setActivePlatformSettings] = useState<
    string | null
  >(null);
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>(
    {},
  );
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);

  const {
    connectedAccounts,
    selectedPlatforms,
    publishedPlatforms,
    failedPlatforms,
    removedPlatforms,
    duplicatePlatforms, // Agregar estado de duplicados
    publishingPlatforms,
    scheduledPlatforms,
    publishing,
    unpublishing,
    existingThumbnails,
    isLoadingThumbnails,
    retryInfo,
    getRecurringPosts,
    getPublishedRecurringPosts,
    fetchPublishedPlatforms,
    loadExistingThumbnails,
    handleUnpublish,
    togglePlatform,
    selectAll,
    deselectAll,
    isYoutubeSelected,
    handlePublish,
    handleCancelPublication,
    handleCancelPlatform,
    handleThumbnailChange,
    handleThumbnailDelete,
    handleRequestReview,
    handleApprove,
    handleReject,
    setUnpublishing,
    resetState,
  } = usePublishPublication();

  const { auth } = usePage<any>().props;
  const currentWorkspace = auth.current_workspace;
  const permissions = currentWorkspace?.permissions || [];
  const hasPublishPermission = permissions.includes("publish");
  const canManageContent = permissions.includes("manage-content");

  // Verificar si el usuario actual tiene una aprobación activa
  const currentUserId = auth.user?.id;
  const hasActiveApproval = publication?.approval_logs?.some(
    (log: any) =>
      log.requested_by === currentUserId &&
      log.action === "approved" &&
      log.reviewed_at !== null,
  );

  // Una publicación puede publicarse directamente si:
  // 1. El usuario tiene permiso "publish", O
  // 2. El usuario actual tiene una aprobación activa en approval_logs, O
  // 3. El estado actual es "approved", "failed", "publishing", "published", "scheduled" Y tiene aprobación
  const wasEverApproved = !!publication?.approved_at;
  const isInApprovedState = [
    "approved",
    "failed",
    "publishing",
    "published",
    "scheduled",
  ].includes(publication?.status || "");
  const canPublishDirectly =
    hasPublishPermission ||
    (hasActiveApproval && (wasEverApproved || isInApprovedState));
  const isPendingReview = publication?.status === "pending_review";

  const handleRequestApproval = async () => {
    if (!publication) return;
    const success = await handleRequestReview(publication.id, platformSettings);
    if (success) {
      if (onSuccess) onSuccess();
      onClose(publication.id);
    }
  };

  const handleApproveRequest = async () => {
    if (!publication) return;
    const data = await handleApprove(publication.id);
    if (data && data.success) {
      if (onSuccess) onSuccess();
      // If we are an owner/admin, we might want to stay to publish.
      // However, since 'publication' is a prop, we won't see the change until
      // the parent re-renders. We should probably close to avoid confusion
      // OR the parent must refresh immediately.
      // Many users prefer it closing so they see the updated list.
      // But the user said "no me deja subir", maybe they want to see the Publish button NOW.
      // I will close it to force a clean refresh of the parent state.
      onClose(publication.id);
    }
  };

  const handleRejectRequest = async () => {
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!publication) return;
    const success = await handleReject(publication.id, reason);
    if (success) {
      setRejectionModalOpen(false);
      if (onSuccess) onSuccess();
      onClose(publication.id);
    }
  };

  const { fetchPublicationById } = usePublicationStore();

  useEffect(() => {
    if (isOpen && publication) {
      fetchPublishedPlatforms(publication.id);
      fetchPublicationById(publication.id).then((fresh) => {
        if (fresh) loadExistingThumbnails(fresh);
      });
      loadExistingThumbnails(publication);
      if (publication.platform_settings) {
        setPlatformSettings(publication.platform_settings);
      } else {
        setPlatformSettings({});
      }
    }

    if (!isOpen) {
      resetState();
    }
  }, [isOpen, publication?.id]);

  // Listen for real-time publication status updates
  useEffect(() => {
    if (!isOpen || !publication || !auth.user?.id || !window.Echo) {
      return;
    }

    const channel = window.Echo.private(`users.${auth.user.id}`);

    const handleStatusUpdate = (event: any) => {
      if (event.publicationId === publication.id) {
        // Refresh published platforms and publication data
        fetchPublishedPlatforms(publication.id);
        fetchPublicationById(publication.id);
      }
    };

    channel.listen(".PublicationStatusUpdated", handleStatusUpdate);

    return () => {
      channel.stopListening(".PublicationStatusUpdated", handleStatusUpdate);
    };
  }, [isOpen, publication?.id, auth.user?.id]);

  // Early return after all hooks
  if (!publication) return null;

  // Function to translate content type to human readable format
  const getContentTypeLabel = (contentType: string) => {
    const labels: Record<string, string> = {
      post: "Publicación",
      reel: "Reel",
      story: "Historia",
      poll: "Encuesta",
      carousel: "Carrusel",
    };
    return labels[contentType] || contentType;
  };

  // Function to get supported content types for each platform
  const getSupportedContentTypes = (platform: string): string[] => {
    const supportedTypes: string[] = [];

    // Find which content types support this platform using shared config
    for (const [contentType, config] of Object.entries(CONTENT_TYPE_CONFIG)) {
      if (
        (config.platforms as readonly string[]).includes(platform.toLowerCase())
      ) {
        supportedTypes.push(contentType);
      }
    }

    return supportedTypes;
  };

  // Filter connected accounts based on content type compatibility
  const getCompatibleAccounts = () => {
    if (!publication.content_type) return connectedAccounts;

    return connectedAccounts.filter((account) => {
      const supportedTypes = getSupportedContentTypes(account.platform);
      return supportedTypes.includes(publication.content_type);
    });
  };

  const compatibleAccounts = getCompatibleAccounts();
  const incompatibleAccounts = connectedAccounts.filter(
    (account) => !compatibleAccounts.includes(account),
  );

  const handleUnpublishWithConfirm = async (
    accountId: number,
    platform: string,
  ) => {
    if (!publication) return;

    // Siempre pedir confirmación al despublicar
    const confirmed = await confirm({
      title:
        t("publications.modal.publish.unpublish.title", { platform }) ||
        "¿Despublicar de " + platform + "?",
      message:
        t("publications.modal.publish.unpublish.message", { platform }) ||
        "¿Estás seguro de que deseas despublicar este contenido de " +
          platform +
          "? Esta acción no se puede deshacer.",
      confirmText:
        t("publications.modal.publish.unpublish.confirm") || "Sí, despublicar",
      cancelText:
        t("publications.modal.publish.unpublish.cancel") || "Cancelar",
      type: "warning",
    });

    if (!confirmed) return;

    setUnpublishing(accountId);
    try {
      const success = await handleUnpublish(
        publication.id,
        accountId,
        platform,
      );
      if (success) {
        if (onSuccess) onSuccess();
      }
    } finally {
      setUnpublishing(null);
    }
  };

  const handlePublishWithNotifications = async () => {
    if (!publication) return;

    const success = await handlePublish(publication, platformSettings);
    if (success) {
      if (onSuccess) onSuccess();
      // Don't close modal immediately - let user see the progress
      // Modal will stay open showing publishing status
    }
  };

  const getPlatformIcon = (platform: string) => {
    return getPlatformConfig(platform).logo;
  };

  const getPlatformGradient = (platform: string) => {
    return getPlatformConfig(platform).gradient;
  };

  const videoFiles = useMemo(
    () => publication.media_files?.filter((m) => m.file_type === "video") || [],
    [publication.media_files],
  );

  // Memoizar los datos de cada video con estabilización profunda del thumbnail
  const videoData = useMemo(() => {
    return videoFiles.map((video) => {
      const videoId = video.id;
      const existingThumbnail = existingThumbnails[videoId];
      const videoPreviewUrl = video.file_path?.startsWith("http")
        ? video.file_path
        : `/storage/${video.file_path}`;

      return {
        videoId,
        videoFileName: video.file_name,
        videoPreviewUrl,
        // Crear un nuevo objeto solo si el contenido cambió
        existingThumbnail: existingThumbnail
          ? { url: existingThumbnail.url, id: existingThumbnail.id }
          : null,
      };
    });
  }, [videoFiles, JSON.stringify(existingThumbnails)]); // Usar JSON.stringify para comparación profunda

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => onClose(publication.id)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200/50 dark:border-neutral-800/50">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200/50 dark:border-neutral-800/50 sticky top-0 z-20 bg-gradient-to-r from-gray-50 via-white to-gray-50/80 dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-800/90 backdrop-blur-md shadow-sm dark:shadow-neutral-950/20">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg">
                    <Share2 className="w-5 h-5 text-primary-500" />
                  </div>
                  {t("publications.modal.publish.title")}
                </div>
              </DialogTitle>
              <button
                onClick={() => onClose(publication.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4">
              {isPendingReview && (
                <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3 mb-4">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                        {t(
                          "publications.modal.publish.pendingReviewBanner.title",
                        ) || "Publicación en Revisión"}
                      </h4>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        {t(
                          "publications.modal.publish.pendingReviewBanner.message",
                        ) ||
                          "Esta publicación está esperando aprobación antes de poder ser publicada."}
                      </p>

                      {/* Información del solicitante */}
                      {publication.approval_logs &&
                        publication.approval_logs.length > 0 &&
                        (() => {
                          const latestLog = publication.approval_logs[0]; // Ya viene ordenado por requested_at desc
                          return latestLog && !latestLog.reviewed_at ? (
                            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                              <div className="flex items-center gap-2">
                                {latestLog.requester?.photo_url ? (
                                  <img
                                    src={latestLog.requester.photo_url}
                                    alt={latestLog.requester.name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-[10px] font-bold">
                                    {latestLog.requester?.name?.charAt(0) ||
                                      "?"}
                                  </div>
                                )}
                                <span className="font-medium">
                                  {latestLog.requester?.name || "Usuario"}
                                </span>
                              </div>
                              <span className="opacity-75">•</span>
                              <span className="opacity-90">
                                {formatDateTime(latestLog.requested_at)}
                              </span>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  </div>

                  {/* Botones de aprobar/rechazar (solo si tiene permisos) */}
                  {hasPublishPermission && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
                      <Button
                        onClick={handleApproveRequest}
                        variant="success"
                        buttonStyle="solid"
                        icon={CheckCircle}
                        className="flex-1"
                        rounded="lg"
                      >
                        {t("publications.button.approve") || "Aprobar"}
                      </Button>
                      <Button
                        onClick={handleRejectRequest}
                        variant="danger"
                        buttonStyle="solid"
                        icon={XCircle}
                        className="flex-1"
                        rounded="lg"
                      >
                        {t("publications.button.reject") || "Rechazar"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {publication.status === "rejected" && !hasPublishPermission && (
                <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                      {t("publications.modal.publish.rejectedBanner.title")}
                    </h4>
                    <div className="mt-1 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                      <p>
                        {t(
                          "publications.modal.publish.rejectedBanner.message",
                          {
                            name: publication.rejector?.name || "Admin",
                          },
                        )}
                      </p>

                      {publication.rejected_at && (
                        <div className="flex items-center gap-1.5 opacity-80">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDateTime(publication.rejected_at)}</span>
                        </div>
                      )}

                      {publication.rejection_reason && (
                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded border border-rose-200/50 dark:border-rose-900/30 italic">
                          "{publication.rejection_reason}"
                        </div>
                      )}

                      <p className="font-medium pt-1">
                        {t("publications.modal.publish.rejectedBanner.footer")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">
                  {publication.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {publication.description}
                </p>
              </div>

              {/* Banner informativo si ya está publicada en algunas cuentas */}
              {publication.platform_status_summary &&
                Object.keys(publication.platform_status_summary).length > 0 &&
                (() => {
                  // Filtrar cuentas con status que indican que está publicada
                  // 'published' = publicada exitosamente
                  // 'success' = publicada exitosamente (legacy)
                  // 'orphaned' = publicada pero la cuenta fue desconectada
                  const publishedAccounts = Object.entries(
                    publication.platform_status_summary,
                  )
                    .filter(
                      ([_, status]: [string, any]) =>
                        status.status === "published" ||
                        status.status === "success" ||
                        status.status === "orphaned",
                    )
                    .map(([accountId, _]) => parseInt(accountId));

                  if (publishedAccounts.length === 0) return null;

                  return (
                    <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">
                            {t(
                              "publications.modal.publish.alreadyPublishedBanner.title",
                            ) || "Publicación Activa"}
                          </h4>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {t(
                              "publications.modal.publish.alreadyPublishedBanner.message",
                            ) ||
                              "Esta publicación ya está publicada en las siguientes cuentas:"}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {publishedAccounts.map((accountId) => {
                              const statusInfo =
                                publication.platform_status_summary?.[
                                  accountId
                                ];
                              if (!statusInfo) return null;

                              // Verificar si la cuenta está conectada actualmente
                              const isConnected = connectedAccounts.some(
                                (acc) => acc.id === accountId,
                              );
                              const connectedAcc = connectedAccounts.find(
                                (acc) => acc.id === accountId,
                              );

                              if (isConnected && connectedAcc) {
                                // Cuenta conectada - fondo azul
                                return (
                                  <span
                                    key={accountId}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-xs font-medium text-blue-800 dark:text-blue-300"
                                  >
                                    <img
                                      src={getPlatformIcon(
                                        connectedAcc.platform,
                                      )}
                                      alt={connectedAcc.platform}
                                      className="w-3.5 h-3.5"
                                    />
                                    <span className="capitalize">
                                      {connectedAcc.platform}
                                    </span>
                                    <span className="opacity-75">
                                      @{connectedAcc.account_name}
                                    </span>
                                  </span>
                                );
                              } else {
                                // Cuenta desconectada - fondo ámbar con etiqueta
                                return (
                                  <span
                                    key={accountId}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-xs font-medium text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                                  >
                                    <img
                                      src={getPlatformIcon(statusInfo.platform)}
                                      alt={statusInfo.platform}
                                      className="w-3.5 h-3.5"
                                    />
                                    <span className="capitalize">
                                      {statusInfo.platform}
                                    </span>
                                    <span className="opacity-75">
                                      @{statusInfo.account_name}
                                    </span>
                                    <span className="ml-1 px-1 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[9px] font-bold">
                                      {t("common.disconnected") ||
                                        "Desconectada"}
                                    </span>
                                  </span>
                                );
                              }
                            })}
                          </div>

                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                            {t(
                              "publications.modal.publish.alreadyPublishedBanner.hint",
                            ) ||
                              "Puedes publicar en cuentas adicionales seleccionándolas a continuación."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Banner de cuentas incompatibles */}
              {incompatibleAccounts.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                        {t(
                          "publications.modal.publish.incompatibleAccountsBanner.title",
                        ) || "Cuentas No Compatibles"}
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {`Las siguientes cuentas no son compatibles con el tipo de contenido "${getContentTypeLabel(publication.content_type || "post")}":`}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {incompatibleAccounts.map((account) => (
                          <span
                            key={account.id}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-xs font-medium text-amber-800 dark:text-amber-300"
                          >
                            <img
                              src={getPlatformIcon(account.platform)}
                              alt={account.platform}
                              className="w-3.5 h-3.5"
                            />
                            <span className="capitalize">
                              {account.platform}
                            </span>
                            <span className="opacity-75">
                              @{account.account_name}
                            </span>
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                        {t(
                          "publications.modal.publish.incompatibleAccountsBanner.hint",
                        ) ||
                          "Estas cuentas no aparecerán en las opciones de publicación."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                    >
                      {t("publications.modal.publish.selectAll")}
                    </button>
                    <span className="text-gray-400 dark:text-gray-600">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                    >
                      {t("publications.modal.publish.deselectAll")}
                    </button>
                  </div>
                </div>

                {compatibleAccounts.length === 0 ? (
                  <div className="text-center py-8 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {connectedAccounts.length === 0 ? (
                        <>
                          {t("publications.modal.publish.noConnectedAccounts")}
                          <br />
                          {t("publications.modal.publish.connectAccounts")}
                        </>
                      ) : (
                        <>
                          {t(
                            "publications.modal.publish.noCompatibleAccounts",
                          ) ||
                            "No hay cuentas compatibles con este tipo de contenido"}
                          <br />
                          {t("publications.modal.publish.changeContentType") ||
                            "Cambia el tipo de contenido o conecta cuentas compatibles"}
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {compatibleAccounts.map((account) => {
                      const iconSrc = getPlatformIcon(account.platform);
                      const isSelected = selectedPlatforms.includes(account.id);
                      const isPublished = publishedPlatforms.includes(
                        account.id,
                      );
                      const isFailed = failedPlatforms.includes(account.id);
                      const isRemovedPlatform = removedPlatforms.includes(
                        account.id,
                      );
                      const isDuplicate = duplicatePlatforms.includes(
                        account.id,
                      ); // Estado de duplicado
                      // Mostrar "publishing" si la publicación está en estado "publishing" o "retrying" Y está en la lista
                      const isPublishing =
                        publishingPlatforms.includes(account.id) &&
                        (publication?.status === "publishing" ||
                          publication?.status === "retrying");
                      const isScheduled = scheduledPlatforms.includes(
                        account.id,
                      );
                      const isUnpublishing = unpublishing === account.id;

                      // Get retry information for this platform
                      const platformRetryInfo = retryInfo[account.id];
                      const isRetrying =
                        platformRetryInfo?.is_retrying || false;
                      const retryStatus =
                        platformRetryInfo?.retry_status || null;
                      const isDuplicateAttempt =
                        platformRetryInfo?.is_duplicate || false;
                      const originalAttemptAt =
                        platformRetryInfo?.original_attempt_at;

                      return (
                        <div key={account.id} className="relative w-full">
                          <div
                            onClick={() => {
                              // Solo permitir toggle si no está publicado, programado, reintentando, duplicado, o activamente publicando
                              if (
                                !isPublished &&
                                !isScheduled &&
                                !isPublishing &&
                                !isRetrying &&
                                !isDuplicate &&
                                !isDuplicateAttempt
                              ) {
                                togglePlatform(account.id);
                              }
                            }}
                            className={`w-full h-[110px] flex flex-col gap-3 p-4 rounded-lg transition-all relative ${
                              !isPublished &&
                              !isScheduled &&
                              !isPublishing &&
                              !isRetrying &&
                              !isDuplicate &&
                              !isDuplicateAttempt
                                ? "cursor-pointer"
                                : "cursor-default"
                            } ${
                              isDuplicate || isDuplicateAttempt
                                ? "border border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                : isPublishing || isRetrying
                                  ? "border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                                  : isPublished
                                    ? "border border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : isScheduled
                                      ? "border border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                      : isFailed
                                        ? "border border-red-500 bg-red-50 dark:bg-red-900/20"
                                        : isRemovedPlatform
                                          ? "border border-gray-500 bg-gray-50 dark:bg-gray-900/20"
                                          : isSelected
                                            ? "border border-primary-600 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-400/50 dark:ring-primary-500/50"
                                            : "border bg-white dark:bg-neutral-900/30 border-gray-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md"
                            }`}
                          >
                            {/* Publishing Overlay */}
                            {(isPublishing || isRetrying) && !isFailed && (
                              <div className="absolute inset-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-300">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 border border-yellow-200 dark:border-yellow-900 rounded-full" />
                                    <div className="absolute inset-0 w-10 h-10 border border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                  </div>

                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-sm font-bold text-yellow-800 dark:text-yellow-300  tracking-wide capitalize">
                                      {account.platform}
                                    </span>
                                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                      {isRetrying && retryStatus
                                        ? `${t("publications.status.retrying") || "Reintentando"} ${retryStatus}`
                                        : publication?.status === "retrying"
                                          ? t("publications.status.retrying") ||
                                            "Reintentando"
                                          : t(
                                              "publications.modal.publish.publishing",
                                            )}
                                    </span>
                                  </div>
                                </div>

                                {/* Cancel button for individual platform */}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!publication) return;

                                    const confirmed = await confirm({
                                      title:
                                        t(
                                          "publications.modal.cancel_platform.title",
                                          { platform: account.platform },
                                        ) || `¿Cancelar ${account.platform}?`,
                                      message:
                                        t(
                                          "publications.modal.cancel_platform.message",
                                          { platform: account.platform },
                                        ) ||
                                        `¿Estás seguro de que deseas cancelar la publicación en ${account.platform}? Se detendrán todos los reintentos para esta plataforma.`,
                                      confirmText:
                                        t(
                                          "publications.modal.cancel_platform.confirm",
                                        ) || "Sí, cancelar",
                                      cancelText:
                                        t(
                                          "publications.modal.cancel_platform.cancel",
                                        ) || "No",
                                      type: "warning",
                                    });

                                    if (confirmed) {
                                      await handleCancelPlatform(
                                        publication.id,
                                        account.id,
                                      );
                                    }
                                  }}
                                  className="mt-3 px-3 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 bg-white dark:bg-neutral-800 hover:bg-yellow-50 dark:hover:bg-neutral-700 border border-yellow-300 dark:border-yellow-700 rounded-md transition-colors"
                                >
                                  {t("common.cancel") || "Cancelar"}
                                </button>
                              </div>
                            )}

                            {/* Failed Overlay */}
                            {isFailed && !isPublished && !isScheduled && (
                              <div className="absolute inset-0 z-30 bg-red-50/95 dark:bg-red-900/30 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-300">
                                <div className="flex flex-col items-center gap-2">
                                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-sm font-bold text-red-800 dark:text-red-300  tracking-wide capitalize">
                                      {account.platform}
                                    </span>
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                      {t("publications.modal.publish.failed") ||
                                        "Falló"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Unpublishing Overlay */}
                            {isUnpublishing && (
                              <div className="absolute inset-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-300">
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                    {t(
                                      "publications.modal.publish.unpublishing",
                                    ) || "Despublicando..."}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Duplicate Attempt Overlay */}
                            {(isDuplicate || isDuplicateAttempt) &&
                              !isPublished &&
                              !isScheduled && (
                                <div className="absolute inset-0 z-30 bg-orange-50/95 dark:bg-orange-900/30 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-300">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="relative flex-shrink-0">
                                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                                        <svg
                                          className="w-6 h-6 text-orange-600 dark:text-orange-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="text-sm font-bold text-orange-800 dark:text-orange-300 tracking-wide capitalize">
                                        {account.platform}
                                      </span>
                                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400 text-center">
                                        {t(
                                          "publications.modal.publish.duplicate",
                                        ) || "Intento duplicado"}
                                      </span>
                                      {originalAttemptAt && (
                                        <span className="text-xs text-orange-500 dark:text-orange-500 text-center mt-1">
                                          {t(
                                            "publications.modal.publish.original_attempt",
                                          ) || "Intento original:"}{" "}
                                          {new Date(
                                            originalAttemptAt,
                                          ).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Published Overlay */}
                            {isPublished &&
                              !isUnpublishing &&
                              (() => {
                                // Buscar el log de esta cuenta para obtener el post_url
                                const postLog =
                                  publication.social_post_logs?.find(
                                    (log: any) =>
                                      log.social_account_id === account.id &&
                                      log.status === "published",
                                  );
                                const postUrl = postLog?.post_url;

                                return (
                                  <div className="absolute inset-0 z-20 bg-green-50/80 dark:bg-green-900/30 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg">
                                    <div className="flex flex-col items-center gap-2">
                                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-sm font-bold text-green-800 dark:text-green-300  tracking-wide capitalize">
                                          {account.platform}
                                        </span>
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                          {t(
                                            "publications.modal.publish.published",
                                          )}
                                        </span>
                                      </div>

                                      {/* Enlace a la publicación si existe */}
                                      {postUrl && (
                                        <a
                                          href={postUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-md transition-colors pointer-events-auto flex items-center gap-1.5 shadow-sm"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                          </svg>
                                          {t(
                                            "publications.modal.publish.viewPost",
                                          ) || "Ver publicación"}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                            {/* Video Duration Warning */}
                            {!isPublishing &&
                              !isUnpublishing &&
                              !isPublished &&
                              (() => {
                                const mediaFiles =
                                  publication.media_files || [];
                                const video = mediaFiles.find(
                                  (m: any) =>
                                    m.file_type === "video" ||
                                    m.mime_type?.startsWith("video/"),
                                );
                                if (!video) return null;

                                const duration = video.metadata?.duration || 0;
                                const validation = validateVideoDuration(
                                  account.platform,
                                  duration,
                                );

                                if (
                                  validation.maxDuration === Infinity ||
                                  validation.isValid
                                )
                                  return null;

                                return (
                                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border shadow-sm bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30 animate-pulse">
                                    <XCircle className="w-3 h-3" />
                                    <span className="leading-none">
                                      MAX {validation.formattedMax}
                                    </span>
                                  </div>
                                );
                              })()}

                            {/* Platform Logo and Info */}
                            <div className="flex items-center gap-3 z-10">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0  p-1">
                                <img
                                  src={iconSrc}
                                  alt={account.platform}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-bold capitalize text-base text-gray-900 dark:text-white truncate">
                                  {account.platform}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  @{account.account_name}
                                </div>
                              </div>
                            </div>

                            {/* Connected By Info */}
                            {account.user?.name &&
                              !isPublishing &&
                              !isUnpublishing &&
                              !isPublished && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate z-10">
                                  {t(
                                    "manageContent.socialMedia.status.connectedBy",
                                  ) || "Conectado por"}
                                  : {account.user.name}
                                </div>
                              )}
                          </div>

                          {/* Scheduled Badge - Outside the card */}
                          {isScheduled && !isPublishing && !isUnpublishing && (
                            <div className="absolute -top-3 right-2 z-40">
                              <div className="flex flex-col items-end gap-1">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 rounded-full shadow-lg border border-white dark:border-neutral-800">
                                  <Clock className="w-3.5 h-3.5" />
                                  {t(
                                    "publications.status.scheduled",
                                  )?.toUpperCase() || "PROGRAMADO"}
                                </span>
                                {(() => {
                                  const schedPost =
                                    publication.scheduled_posts?.find(
                                      (sp) =>
                                        sp.social_account_id === account.id,
                                    );
                                  return schedPost?.scheduled_at ? (
                                    <span className="text-[10px] text-gray-600 dark:text-gray-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-full shadow-sm">
                                      {formatDateTimeStyled(
                                        schedPost.scheduled_at,
                                        "short",
                                        "short",
                                      )}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Removed Badge - Outside the card */}
                          {isRemovedPlatform &&
                            !isPublishing &&
                            !isUnpublishing &&
                            !isPublished && (
                              <div className="absolute -top-3 right-2 z-40">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 px-3 py-1.5 rounded-full shadow-lg border border-white dark:border-neutral-800">
                                  <XCircle className="w-3.5 h-3.5" />
                                  {t(
                                    "publications.modal.publish.removed",
                                  )?.toUpperCase() || "REMOVIDO"}
                                </span>
                              </div>
                            )}

                          {/* Failed Badge - Discrete corner badge */}
                          {isFailed &&
                            !isScheduled &&
                            !isPublished &&
                            !isPublishing &&
                            !isUnpublishing &&
                            !isRetrying && (
                              <div className="absolute top-2 left-2 z-10">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-md shadow-sm border border-red-300 dark:border-red-800">
                                  <XCircle className="w-3 h-3" />
                                  {t("publications.modal.publish.failed") ||
                                    "Falló"}
                                </span>
                              </div>
                            )}

                          {/* Unpublish Button */}
                          {isPublished && !isUnpublishing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnpublishWithConfirm(
                                  account.id,
                                  account.platform,
                                );
                              }}
                              disabled={isUnpublishing}
                              className="absolute top-3 right-3 z-30 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50 shadow-lg"
                              title="Despublicar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {publication &&
                            getRecurringPosts &&
                            getPublishedRecurringPosts && (
                              <RecurringPostsSection
                                publication={publication}
                                accountId={account.id}
                                getRecurringPosts={getRecurringPosts}
                                getPublishedRecurringPosts={
                                  getPublishedRecurringPosts
                                }
                                t={t}
                              />
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {isYoutubeSelected() && videoFiles.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <img
                      src={getPlatformConfig("youtube").logo}
                      className="w-5 h-5"
                      alt="YouTube"
                    />
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {t("publications.modal.publish.youtubeThumbnails")}
                      {isLoadingThumbnails && (
                        <span className="ml-2 text-xs text-gray-500">
                          {t("publications.modal.publish.loading")}
                        </span>
                      )}
                    </h4>
                  </div>

                  {isLoadingThumbnails ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {videoData.map((data) => (
                        <YouTubeThumbnailUploader
                          key={data.videoId}
                          videoId={data.videoId}
                          videoFileName={data.videoFileName}
                          videoPreviewUrl={data.videoPreviewUrl}
                          existingThumbnail={data.existingThumbnail}
                          onThumbnailChange={handleThumbnailChange}
                          onThumbnailDelete={handleThumbnailDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-200/50 dark:border-neutral-800/50 sticky bottom-0 z-20 bg-gradient-to-r from-gray-50 via-white to-gray-50/80 dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-800/90 backdrop-blur-md shadow-sm dark:shadow-neutral-950/20">
              <button
                type="button"
                onClick={async () => {
                  // Si hay plataformas publicando o reintentando, preguntar si quiere cancelar
                  const hasPublishingPlatforms =
                    publishingPlatforms.length > 0 &&
                    (publication.status === "publishing" ||
                      publication.status === "retrying");

                  if (hasPublishingPlatforms) {
                    const confirmed = await confirm({
                      title:
                        t("publications.modal.cancelAllConfirm.title") ||
                        "¿Cancelar TODAS las plataformas?",
                      message:
                        t("publications.modal.cancelAllConfirm.message", {
                          count: publishingPlatforms.length,
                        }) ||
                        `¿Estás seguro de que deseas cancelar la publicación en TODAS las plataformas (${publishingPlatforms.length})? Se detendrán todos los reintentos. Las plataformas que ya se publicaron no se verán afectadas.`,
                      confirmText:
                        t("publications.modal.cancelAllConfirm.confirm") ||
                        "Sí, cancelar todas",
                      cancelText:
                        t("publications.modal.cancelAllConfirm.cancel") || "No",
                      type: "danger",
                    });

                    if (confirmed) {
                      await handleCancelPublication(publication.id);
                      if (onSuccess) onSuccess();
                      onClose(publication.id);
                    }
                  } else {
                    onClose(publication.id);
                  }
                }}
                disabled={unpublishing !== null}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishingPlatforms.length > 0 &&
                (publication.status === "publishing" ||
                  publication.status === "retrying")
                  ? t("publications.modal.publish.button.cancelAll", {
                      count: publishingPlatforms.length,
                    }) || `Cancelar Todas (${publishingPlatforms.length})`
                  : t("publications.modal.publish.button.cancel") || "Cerrar"}
              </button>
              {canPublishDirectly ? (
                <button
                  type="button"
                  onClick={handlePublishWithNotifications}
                  disabled={selectedPlatforms.length === 0 || publishing}
                  className="flex-[2] px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {publishing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t("publications.modal.publish.publishing")}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      {t("publications.modal.publish.button.publish")}{" "}
                      {selectedPlatforms.length > 0 &&
                        `(${selectedPlatforms.length})`}
                    </>
                  )}
                </button>
              ) : canManageContent ? (
                <button
                  type="button"
                  onClick={handleRequestApproval}
                  disabled={publishing || isPendingReview}
                  className="flex-[2] px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPendingReview ? (
                    <>
                      <Clock className="w-4 h-4" />
                      {t("publications.modal.publish.button.pendingReview")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {t("publications.modal.publish.button.requestApproval")}
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {publication && (
              <RejectionReasonModal
                isOpen={rejectionModalOpen}
                onClose={() => setRejectionModalOpen(false)}
                onSubmit={handleRejectSubmit}
                publicationTitle={publication.title}
              />
            )}
          </DialogPanel>
        </div>
      </Dialog>
      <ConfirmDialog />
    </>
  );
}
