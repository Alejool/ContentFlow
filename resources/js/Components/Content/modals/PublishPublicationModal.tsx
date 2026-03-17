import Button from '@/Components/common/Modern/Button';
import YouTubeThumbnailUploader from '@/Components/common/ui/YouTubeThumbnailUploader';
import PlatformCard from '@/Components/Content/modals/publish/PlatformCard';
import VideoValidationAlert from '@/Components/Content/modals/publish/VideoValidationAlert';
import RejectionReasonModal from '@/Components/Content/modals/RejectionReasonModal';
import { CONTENT_TYPE_CONFIG } from '@/Constants/contentTypes';
import { getPlatformConfig } from '@/Constants/socialPlatforms';
import { usePublishPublication } from '@/Hooks/publication/usePublishPublication';
import { useConfirm } from '@/Hooks/useConfirm';
import { usePublicationCapabilities } from '@/Hooks/usePublicationCapabilities';
import { usePublicationStore } from '@/stores/publicationStore';
import { Publication } from '@/types/Publication';
import { formatDateTimeStyled } from '@/Utils/dateHelpers';
import { formatDateTime } from '@/Utils/formatDate';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, ChevronDown, Clock, Share2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const recurringPublished = getPublishedRecurringPosts(publication.id, accountId);

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
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
      <div className="mb-2 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {t('publications.modal.publish.recurringPosts') || 'Publicaciones Recurrentes'}
        </span>
      </div>

      <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent max-h-[200px] space-y-1.5 overflow-y-auto pr-1">
        {uniqueScheduled.map((post: any) => (
          <div
            key={post.id}
            className="flex items-center justify-between rounded border border-blue-200 bg-white p-2 text-xs dark:border-blue-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {formatDateTimeStyled(post.scheduled_at, 'short', 'short')}
              </span>
            </div>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {t('publications.status.scheduled') || 'Programado'}
            </span>
          </div>
        ))}

        {uniquePublished.map((post: any) => (
          <div
            key={post.id}
            className="flex items-center justify-between rounded border border-green-200 bg-white p-2 text-xs dark:border-green-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {formatDateTimeStyled(post.published_at, 'short', 'short')}
              </span>
            </div>
            {post.post_url ? (
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-green-600 hover:underline dark:text-green-400"
              >
                {t('publications.modal.publish.viewPost') || 'Ver'}
                <Share2 className="h-3 w-3" />
              </a>
            ) : (
              <span className="font-medium text-green-600 dark:text-green-400">
                {t('publications.status.published') || 'Publicado'}
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

  const [activePlatformSettings, setActivePlatformSettings] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>({});
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [isYouTubeThumbnailExpanded, setIsYouTubeThumbnailExpanded] = useState(true);

  // Fetch platform capabilities for this publication
  const {
    capabilities,
    loading: capabilitiesLoading,
    error: capabilitiesError,
    getAccountCapability,
    canPublishToAccount,
    getAccountErrors,
    getAccountWarnings,
    getUpgradeMessage,
  } = usePublicationCapabilities(publication?.id || null);

  const {
    connectedAccounts,
    isLoadingAccounts,
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
  const hasPublishPermission = permissions.includes('publish');
  const canManageContent = permissions.includes('manage-content');

  // Verificar si el usuario actual tiene una aprobación activa
  const currentUserId = auth.user?.id;
  const hasActiveApproval = publication?.approval_logs?.some(
    (log: any) =>
      log.requested_by === currentUserId && log.action === 'approved' && log.reviewed_at !== null,
  );

  // Una publicación puede publicarse directamente si:
  // 1. El usuario tiene permiso "publish", O
  // 2. El usuario actual tiene una aprobación activa en approval_logs, O
  // 3. El estado actual es "approved", "failed", "publishing", "published", "scheduled" Y tiene aprobación
  const wasEverApproved = !!publication?.approved_at;
  const isInApprovedState = ['approved', 'failed', 'publishing', 'published', 'scheduled'].includes(
    publication?.status || '',
  );
  const canPublishDirectly =
    hasPublishPermission || (hasActiveApproval && (wasEverApproved || isInApprovedState));
  const isPendingReview = publication?.status === 'pending_review';

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

  const handleCloseModal = async () => {
    if (!publication) {
      onClose();
      return;
    }

    // Si hay plataformas publicando o reintentando, preguntar si quiere cancelar
    const hasPublishingPlatforms =
      publishingPlatforms.length > 0 &&
      (publication.status === 'publishing' || publication.status === 'retrying');

    if (hasPublishingPlatforms) {
      const confirmed = await confirm({
        title: t('publications.modal.cancelAllConfirm.title') || '¿Cancelar TODAS las plataformas?',
        message:
          t('publications.modal.cancelAllConfirm.message', {
            count: publishingPlatforms.length,
          }) ||
          `¿Estás seguro de que deseas cancelar la publicación en TODAS las plataformas (${publishingPlatforms.length})? Se detendrán todos los reintentos. Las plataformas que ya se publicaron no se verán afectadas.`,
        confirmText: t('publications.modal.cancelAllConfirm.confirm') || 'Sí, cancelar todas',
        cancelText: t('publications.modal.cancelAllConfirm.cancel') || 'No',
        type: 'danger',
      });

      if (confirmed) {
        await handleCancelPublication(publication.id);
        if (onSuccess) onSuccess();
        onClose(publication.id);
      }
    } else {
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
  // IMPORTANT: Don't update while actively publishing to prevent data flickering
  useEffect(() => {
    if (!isOpen || !publication || !auth.user?.id || !window.Echo) {
      return;
    }

    const channel = window.Echo.private(`users.${auth.user.id}`);

    const handleStatusUpdate = (event: any) => {
      if (event.publicationId === publication.id) {
        // Only refresh if not currently publishing to prevent modal re-render issues
        if (!publishing) {
          // Refresh published platforms and publication data
          fetchPublishedPlatforms(publication.id);
          fetchPublicationById(publication.id);
        }
      }
    };

    channel.listen('.PublicationStatusUpdated', handleStatusUpdate);

    return () => {
      channel.stopListening('.PublicationStatusUpdated', handleStatusUpdate);
    };
  }, [isOpen, publication?.id, auth.user?.id, publishing]);

  // Early return after all hooks
  if (!publication) return null;

  // Function to translate content type to human readable format
  const getContentTypeLabel = (contentType: string) => {
    const labels: Record<string, string> = {
      post: 'Publicación',
      reel: 'Reel',
      story: 'Historia',
      poll: 'Encuesta',
      carousel: 'Carrusel',
    };
    return labels[contentType] || contentType;
  };

  // Function to get supported content types for each platform
  const getSupportedContentTypes = (platform: string): string[] => {
    const supportedTypes: string[] = [];

    // Find which content types support this platform using shared config
    for (const [contentType, config] of Object.entries(CONTENT_TYPE_CONFIG)) {
      if ((config.platforms as readonly string[]).includes(platform.toLowerCase())) {
        supportedTypes.push(contentType);
      }
    }

    return supportedTypes;
  };

  // Filter connected accounts based on content type compatibility
  // IMPORTANT: This only checks if the platform SUPPORTS the content type
  // NOT if the content meets the platform's limits (duration, file size, etc.)
  const getCompatibleAccounts = () => {
    const contentType = publication.content_type;
    if (!contentType) return connectedAccounts;

    return connectedAccounts.filter((account) => {
      const supportedTypes = getSupportedContentTypes(account.platform);
      return supportedTypes.includes(contentType);
    });
  };

  const compatibleAccounts = getCompatibleAccounts();

  // incompatibleAccounts = platforms that DON'T support this content type at all
  // Example: carousel on Twitter, carousel on LinkedIn
  const incompatibleAccounts = connectedAccounts.filter(
    (account) => !compatibleAccounts.includes(account),
  );

  const handleUnpublishWithConfirm = async (accountId: number, platform: string) => {
    if (!publication) return;

    // Siempre pedir confirmación al despublicar
    const confirmed = await confirm({
      title:
        t('publications.modal.publish.unpublish.title', { platform }) ||
        '¿Despublicar de ' + platform + '?',
      message:
        t('publications.modal.publish.unpublish.message', { platform }) ||
        '¿Estás seguro de que deseas despublicar este contenido de ' +
          platform +
          '? Esta acción no se puede deshacer.',
      confirmText: t('publications.modal.publish.unpublish.confirm') || 'Sí, despublicar',
      cancelText: t('publications.modal.publish.unpublish.cancel') || 'Cancelar',
      type: 'warning',
    });

    if (!confirmed) return;

    setUnpublishing(accountId);
    try {
      const success = await handleUnpublish(publication.id, accountId, platform);
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
    () => publication.media_files?.filter((m) => m.file_type === 'video') || [],
    [publication.media_files],
  );

  // Memoizar los datos de cada video con estabilización profunda del thumbnail
  const videoData = useMemo(() => {
    return videoFiles.map((video) => {
      const videoId = video.id;
      const existingThumbnail = existingThumbnails[videoId];
      const videoPreviewUrl = video.file_path?.startsWith('http')
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
      <Dialog open={isOpen} onClose={() => onClose(publication.id)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 shadow-2xl dark:border-neutral-800/50 dark:from-neutral-900 dark:to-neutral-950">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-gray-50 via-white to-gray-50/80 p-6 pb-4 shadow-sm backdrop-blur-md dark:border-neutral-800/50 dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-800/90 dark:shadow-neutral-950/20">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg p-1.5">
                    <Share2 className="h-5 w-5 text-primary-500" />
                  </div>
                  {t('publications.modal.publish.title')}
                </div>
              </DialogTitle>
              <button
                onClick={() => onClose(publication.id)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6 pt-4">
              {isPendingReview && (
                <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <div className="mb-4 flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                        {t('publications.modal.publish.pendingReviewBanner.title') ||
                          'Publicación en Revisión'}
                      </h4>
                      <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                        {t('publications.modal.publish.pendingReviewBanner.message') ||
                          'Esta publicación está esperando aprobación antes de poder ser publicada.'}
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
                                    className="h-5 w-5 rounded-full"
                                  />
                                ) : (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-200 text-[10px] font-bold dark:bg-yellow-800">
                                    {latestLog.requester?.name?.charAt(0) || '?'}
                                  </div>
                                )}
                                <span className="font-medium">
                                  {latestLog.requester?.name || 'Usuario'}
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
                    <div className="mt-4 flex gap-2 border-t border-yellow-200 pt-4 dark:border-yellow-800">
                      <Button
                        onClick={handleApproveRequest}
                        variant="success"
                        buttonStyle="solid"
                        icon={CheckCircle}
                        className="flex-1"
                        rounded="lg"
                      >
                        {t('publications.button.approve') || 'Aprobar'}
                      </Button>
                      <Button
                        onClick={handleRejectRequest}
                        variant="danger"
                        buttonStyle="solid"
                        icon={XCircle}
                        className="flex-1"
                        rounded="lg"
                      >
                        {t('publications.button.reject') || 'Rechazar'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {publication.status === 'rejected' && !hasPublishPermission && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
                  <XCircle className="mt-0.5 h-5 w-5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                      {t('publications.modal.publish.rejectedBanner.title')}
                    </h4>
                    <div className="mt-1 space-y-2 text-xs text-rose-700 dark:text-rose-300">
                      <p>
                        {t('publications.modal.publish.rejectedBanner.message', {
                          name: publication.rejector?.name || 'Admin',
                        })}
                      </p>

                      {publication.rejected_at && (
                        <div className="flex items-center gap-1.5 opacity-80">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDateTime(publication.rejected_at)}</span>
                        </div>
                      )}

                      {publication.rejection_reason && (
                        <div className="rounded border border-rose-200/50 bg-white/50 p-3 italic dark:border-rose-900/30 dark:bg-black/20">
                          "{publication.rejection_reason}"
                        </div>
                      )}

                      <p className="pt-1 font-medium">
                        {t('publications.modal.publish.rejectedBanner.footer')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
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
                  const publishedAccounts = Object.entries(publication.platform_status_summary)
                    .filter(
                      ([_, status]: [string, any]) =>
                        status.status === 'published' ||
                        status.status === 'success' ||
                        status.status === 'orphaned',
                    )
                    .map(([accountId, _]) => parseInt(accountId));

                  if (publishedAccounts.length === 0) return null;

                  return (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">
                            {t('publications.modal.publish.alreadyPublishedBanner.title') ||
                              'Publicación Activa'}
                          </h4>
                          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                            {t('publications.modal.publish.alreadyPublishedBanner.message') ||
                              'Esta publicación ya está publicada en las siguientes cuentas:'}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {publishedAccounts.map((accountId) => {
                              const statusInfo = publication.platform_status_summary?.[accountId];
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
                                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                  >
                                    <img
                                      src={getPlatformIcon(connectedAcc.platform)}
                                      alt={connectedAcc.platform}
                                      className="h-3.5 w-3.5"
                                    />
                                    <span className="capitalize">{connectedAcc.platform}</span>
                                    <span className="opacity-75">@{connectedAcc.account_name}</span>
                                  </span>
                                );
                              } else {
                                // Cuenta desconectada - fondo ámbar con etiqueta
                                return (
                                  <span
                                    key={accountId}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  >
                                    <img
                                      src={getPlatformIcon(statusInfo.platform)}
                                      alt={statusInfo.platform}
                                      className="h-3.5 w-3.5"
                                    />
                                    <span className="capitalize">{statusInfo.platform}</span>
                                    <span className="opacity-75">@{statusInfo.account_name}</span>
                                    <span className="ml-1 rounded bg-amber-200 px-1 py-0.5 text-[9px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                                      {t('common.disconnected') || 'Desconectada'}
                                    </span>
                                  </span>
                                );
                              }
                            })}
                          </div>

                          <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                            {t('publications.modal.publish.alreadyPublishedBanner.hint') ||
                              'Puedes publicar en cuentas adicionales seleccionándolas a continuación.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Banner de cuentas incompatibles */}
              {incompatibleAccounts.length > 0 && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                        {t('publications.modal.publish.incompatibleAccountsBanner.title') ||
                          'Cuentas No Compatibles'}
                      </h4>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {`Las siguientes cuentas no son compatibles con el tipo de contenido "${getContentTypeLabel(publication.content_type || 'post')}":`}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {incompatibleAccounts.map((account) => (
                          <span
                            key={account.id}
                            className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          >
                            <img
                              src={getPlatformIcon(account.platform)}
                              alt={account.platform}
                              className="h-3.5 w-3.5"
                            />
                            <span className="capitalize">{account.platform}</span>
                            <span className="opacity-75">@{account.account_name}</span>
                          </span>
                        ))}
                      </div>

                      <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {t('publications.modal.publish.incompatibleAccountsBanner.hint') ||
                          'Estas cuentas no aparecerán en las opciones de publicación.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Validation Alert - Shows when content EXCEEDS platform limits */}
              {/* This is different from incompatibleAccounts which shows when platform doesn't support the content type */}
              {(() => {
                const videoFile = publication?.media_files?.find((m) => m.file_type === 'video');
                if (!videoFile) return null;

                const videoDuration = videoFile.metadata?.duration;
                const fileSizeMb = videoFile.size ? videoFile.size / (1024 * 1024) : 0;

                if (!videoDuration || !fileSizeMb) return null;

                // Only validate for compatible accounts (accounts that support this content type)
                const compatibleSelectedAccounts = selectedPlatforms.filter((id) =>
                  compatibleAccounts.some((acc) => acc.id === id),
                );

                if (compatibleSelectedAccounts.length === 0) return null;

                return (
                  <VideoValidationAlert
                    selectedAccountIds={compatibleSelectedAccounts}
                    videoDuration={videoDuration}
                    fileSizeMb={fileSizeMb}
                    onValidationComplete={(
                      valid: boolean,
                      results: import('@/Hooks/usePlatformCapabilities').VideoValidationResult[],
                    ) => {
                      // Results show which accounts can't publish due to limits
                      console.log('Video validation:', valid, results);
                    }}
                  />
                );
              })()}

              <div className="mb-6">
                {isLoadingAccounts ? (
                  <div className="rounded-lg bg-gray-50 py-12 text-center dark:bg-neutral-900/50">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {t('publications.modal.publish.loadingAccounts') || 'Cargando cuentas...'}
                    </p>
                  </div>
                ) : compatibleAccounts.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 py-8 text-center dark:bg-neutral-900/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {connectedAccounts.length === 0 ? (
                        <>
                          {t('publications.modal.publish.noConnectedAccounts')}
                          <br />
                          {t('publications.modal.publish.connectAccounts')}
                        </>
                      ) : (
                        <>
                          {t('publications.modal.publish.noCompatibleAccounts') ||
                            'No hay cuentas compatibles con este tipo de contenido'}
                          <br />
                          {t('publications.modal.publish.changeContentType') ||
                            'Cambia el tipo de contenido o conecta cuentas compatibles'}
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {compatibleAccounts.map((account) => {
                      const isSelected = selectedPlatforms.includes(account.id);
                      const isPublished = publishedPlatforms.includes(account.id);
                      const isFailed = failedPlatforms.includes(account.id);
                      const isRemovedPlatform = removedPlatforms.includes(account.id);
                      const isDuplicate = duplicatePlatforms.includes(account.id);
                      const isPublishing = publishingPlatforms.includes(account.id);
                      const isScheduled = scheduledPlatforms.includes(account.id);
                      const isUnpublishing = unpublishing === account.id;
                      const platformRetryInfo = retryInfo[account.id];

                      // Get capabilities for this account
                      const accountCapability = getAccountCapability(account.id);
                      const canPublish = canPublishToAccount(account.id);
                      const errors = getAccountErrors(account.id);
                      const warnings = getAccountWarnings(account.id);
                      const upgradeMessage = getUpgradeMessage(account.id);

                      return (
                        <PlatformCard
                          key={account.id}
                          account={account}
                          publication={publication}
                          isSelected={isSelected}
                          isPublished={isPublished}
                          isFailed={isFailed}
                          isRemovedPlatform={isRemovedPlatform}
                          isDuplicate={isDuplicate}
                          isPublishing={isPublishing}
                          isScheduled={isScheduled}
                          isUnpublishing={isUnpublishing}
                          platformRetryInfo={platformRetryInfo}
                          onToggle={() => togglePlatform(account.id)}
                          onCancelPlatform={handleCancelPlatform}
                          onUnpublish={handleUnpublishWithConfirm}
                          confirm={confirm}
                          t={t}
                          RecurringPostsSection={RecurringPostsSection}
                          getRecurringPosts={getRecurringPosts}
                          getPublishedRecurringPosts={getPublishedRecurringPosts}
                          // Capabilities props
                          canPublish={canPublish}
                          capabilityErrors={errors}
                          capabilityWarnings={warnings}
                          upgradeMessage={upgradeMessage}
                          capabilityMetadata={accountCapability?.metadata}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {isYoutubeSelected() && videoFiles.length > 0 && (
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setIsYouTubeThumbnailExpanded(!isYouTubeThumbnailExpanded)}
                    className="mb-3 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-gray-300 dark:hover:bg-neutral-700 dark:hover:text-primary-400"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={getPlatformConfig('youtube').logo}
                        className="h-5 w-5"
                        alt="YouTube"
                      />
                      <span className="font-semibold">
                        {t('publications.modal.publish.youtubeThumbnails') || 'YouTube Thumbnails'}
                      </span>
                      {isLoadingThumbnails && (
                        <span className="ml-2 text-xs text-gray-500">
                          {t('publications.modal.publish.loading') || 'Cargando...'}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isYouTubeThumbnailExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isYouTubeThumbnailExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      {isLoadingThumbnails ? (
                        <div className="py-4 text-center">
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
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
              )}
            </div>

            <div className="sticky bottom-0 z-20 flex gap-3 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 via-white to-gray-50/80 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/50 dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-800/90 dark:shadow-neutral-950/20">
              <Button
                type="button"
                onClick={handleCloseModal}
                disabled={unpublishing !== null}
                variant="secondary"
                buttonStyle="solid"
                size="lg"
                className="flex-1"
                rounded="lg"
              >
                {publishingPlatforms.length > 0 &&
                (publication.status === 'publishing' || publication.status === 'retrying')
                  ? t('publications.modal.publish.button.cancelAll', {
                      count: publishingPlatforms.length,
                    }) || `Cancelar Todas (${publishingPlatforms.length})`
                  : t('publications.modal.publish.button.cancel') || 'Cerrar'}
              </Button>
              {canPublishDirectly ? (
                <Button
                  type="button"
                  onClick={handlePublishWithNotifications}
                  disabled={selectedPlatforms.length === 0 || publishing}
                  variant="primary"
                  buttonStyle="gradient"
                  size="lg"
                  className="flex-[2]"
                  rounded="lg"
                  loading={publishing}
                  loadingText={t('publications.modal.publish.publishing') || 'Publicando...'}
                  icon={Share2}
                  iconPosition="left"
                >
                  {t('publications.modal.publish.button.publish') || 'Publicar'}{' '}
                  {selectedPlatforms.length > 0 && `(${selectedPlatforms.length})`}
                </Button>
              ) : canManageContent ? (
                <Button
                  type="button"
                  onClick={handleRequestApproval}
                  disabled={publishing || isPendingReview}
                  variant="primary"
                  buttonStyle="gradient"
                  size="lg"
                  className="flex-[2]"
                  rounded="lg"
                  icon={isPendingReview ? Clock : CheckCircle}
                  iconPosition="left"
                >
                  {isPendingReview
                    ? t('publications.modal.publish.button.pendingReview') ||
                      'Pendiente de Revisión'
                    : t('publications.modal.publish.button.requestApproval') ||
                      'Solicitar Aprobación'}
                </Button>
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
