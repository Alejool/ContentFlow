import Button from '@/Components/common/Modern/Button';
import YouTubeThumbnailUploader from '@/Components/common/ui/YouTubeThumbnailUploader';
import RejectionReasonModal from '@/Components/Content/modals/RejectionReasonModal';
import { CONTENT_TYPE_CONFIG } from '@/Constants/contentTypes';
import { getPlatformConfig } from '@/Constants/socialPlatforms';
import { usePublishPublication } from '@/Hooks/publication/usePublishPublication';
import { useConfirm } from '@/Hooks/useConfirm';
import { usePublicationStore } from '@/stores/publicationStore';
import { Publication } from '@/types/Publication';
import { formatDateTimeStyled } from '@/Utils/dateHelpers';
import { formatDateTime } from '@/Utils/formatDate';
import { validateVideoDuration } from '@/Utils/validationUtils';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Loader2, Share2, X, XCircle } from 'lucide-react';
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

    channel.listen('.PublicationStatusUpdated', handleStatusUpdate);

    return () => {
      channel.stopListening('.PublicationStatusUpdated', handleStatusUpdate);
    };
  }, [isOpen, publication?.id, auth.user?.id]);

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

              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm font-medium text-primary-500 hover:text-primary-600"
                    >
                      {t('publications.modal.publish.selectAll')}
                    </button>
                    <span className="text-gray-400 dark:text-gray-600">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-sm font-medium text-primary-500 hover:text-primary-600"
                    >
                      {t('publications.modal.publish.deselectAll')}
                    </button>
                  </div>
                </div>

                {compatibleAccounts.length === 0 ? (
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
                      const iconSrc = getPlatformIcon(account.platform);
                      const isSelected = selectedPlatforms.includes(account.id);
                      const isPublished = publishedPlatforms.includes(account.id);
                      const isFailed = failedPlatforms.includes(account.id);
                      const isRemovedPlatform = removedPlatforms.includes(account.id);
                      const isDuplicate = duplicatePlatforms.includes(account.id); // Estado de duplicado
                      // Mostrar "publishing" si la publicación está en estado "publishing" o "retrying" Y está en la lista
                      const isPublishing =
                        publishingPlatforms.includes(account.id) &&
                        (publication?.status === 'publishing' ||
                          publication?.status === 'retrying');
                      const isScheduled = scheduledPlatforms.includes(account.id);
                      const isUnpublishing = unpublishing === account.id;

                      // Get retry information for this platform
                      const platformRetryInfo = retryInfo[account.id];
                      const isRetrying = platformRetryInfo?.is_retrying || false;
                      const retryStatus = platformRetryInfo?.retry_status || null;
                      const isDuplicateAttempt = platformRetryInfo?.is_duplicate || false;
                      const originalAttemptAt = platformRetryInfo?.original_attempt_at;

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
                            className={`relative flex h-[110px] w-full flex-col gap-3 rounded-lg p-4 transition-all ${
                              !isPublished &&
                              !isScheduled &&
                              !isPublishing &&
                              !isRetrying &&
                              !isDuplicate &&
                              !isDuplicateAttempt
                                ? 'cursor-pointer'
                                : 'cursor-default'
                            } ${
                              isDuplicate || isDuplicateAttempt
                                ? 'border border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : isPublishing || isRetrying
                                  ? 'border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                  : isPublished
                                    ? 'border border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : isScheduled
                                      ? 'border border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                      : isFailed
                                        ? 'border border-red-500 bg-red-50 dark:bg-red-900/20'
                                        : isRemovedPlatform
                                          ? 'border border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                          : isSelected
                                            ? 'border border-primary-600 bg-primary-50 ring-2 ring-primary-400/50 dark:bg-primary-900/30 dark:ring-primary-500/50'
                                            : 'border border-gray-300 bg-white hover:border-primary-400 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900/30 dark:hover:border-primary-600'
                            }`}
                          >
                            {/* Publishing Overlay */}
                            {(isPublishing || isRetrying) && !isFailed && (
                              <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm duration-300 dark:bg-neutral-900/95">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="relative flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full border border-yellow-200 dark:border-yellow-900" />
                                    <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border border-yellow-500 border-t-transparent" />
                                  </div>

                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-sm font-bold capitalize tracking-wide text-yellow-800 dark:text-yellow-300">
                                      {account.platform}
                                    </span>
                                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                      {isRetrying && retryStatus
                                        ? `${t('publications.status.retrying') || 'Reintentando'} ${retryStatus}`
                                        : publication?.status === 'retrying'
                                          ? t('publications.status.retrying') || 'Reintentando'
                                          : t('publications.modal.publish.publishing')}
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
                                        t('publications.modal.cancel_platform.title', {
                                          platform: account.platform,
                                        }) || `¿Cancelar ${account.platform}?`,
                                      message:
                                        t('publications.modal.cancel_platform.message', {
                                          platform: account.platform,
                                        }) ||
                                        `¿Estás seguro de que deseas cancelar la publicación en ${account.platform}? Se detendrán todos los reintentos para esta plataforma.`,
                                      confirmText:
                                        t('publications.modal.cancel_platform.confirm') ||
                                        'Sí, cancelar',
                                      cancelText:
                                        t('publications.modal.cancel_platform.cancel') || 'No',
                                      type: 'warning',
                                    });

                                    if (confirmed) {
                                      await handleCancelPlatform(publication.id, account.id);
                                    }
                                  }}
                                  className="mt-3 rounded-md border border-yellow-300 bg-white px-3 py-1.5 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-50 hover:text-yellow-900 dark:border-yellow-700 dark:bg-neutral-800 dark:text-yellow-400 dark:hover:bg-neutral-700 dark:hover:text-yellow-200"
                                >
                                  {t('common.cancel') || 'Cancelar'}
                                </button>
                              </div>
                            )}

                            {/* Failed Overlay */}
                            {isFailed && !isPublished && !isScheduled && (
                              <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-red-50/95 backdrop-blur-sm duration-300 dark:bg-red-900/30">
                                <div className="flex flex-col items-center gap-2">
                                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-sm font-bold capitalize tracking-wide text-red-800 dark:text-red-300">
                                      {account.platform}
                                    </span>
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                      {t('publications.modal.publish.failed') || 'Falló'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Unpublishing Overlay */}
                            {isUnpublishing && (
                              <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm duration-300 dark:bg-neutral-900/95">
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="h-10 w-10 animate-spin text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                    {t('publications.modal.publish.unpublishing') ||
                                      'Despublicando...'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Duplicate Attempt Overlay */}
                            {(isDuplicate || isDuplicateAttempt) &&
                              !isPublished &&
                              !isScheduled && (
                                <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-orange-50/95 backdrop-blur-sm duration-300 dark:bg-orange-900/30">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="relative flex-shrink-0">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
                                        <svg
                                          className="h-6 w-6 text-orange-600 dark:text-orange-400"
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
                                      <span className="text-sm font-bold capitalize tracking-wide text-orange-800 dark:text-orange-300">
                                        {account.platform}
                                      </span>
                                      <span className="text-center text-xs font-medium text-orange-600 dark:text-orange-400">
                                        {t('publications.modal.publish.duplicate') ||
                                          'Intento duplicado'}
                                      </span>
                                      {originalAttemptAt && (
                                        <span className="mt-1 text-center text-xs text-orange-500 dark:text-orange-500">
                                          {t('publications.modal.publish.original_attempt') ||
                                            'Intento original:'}{' '}
                                          {new Date(originalAttemptAt).toLocaleString()}
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
                                const postLog = publication.social_post_logs?.find(
                                  (log: any) =>
                                    log.social_account_id === account.id &&
                                    log.status === 'published',
                                );
                                const postUrl = postLog?.post_url;

                                return (
                                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg bg-green-50/80 backdrop-blur-[2px] dark:bg-green-900/30">
                                    <div className="flex flex-col items-center gap-2">
                                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-sm font-bold capitalize tracking-wide text-green-800 dark:text-green-300">
                                          {account.platform}
                                        </span>
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                          {t('publications.modal.publish.published')}
                                        </span>
                                      </div>

                                      {/* Enlace a la publicación si existe */}
                                      {postUrl && (
                                        <a
                                          href={postUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="pointer-events-auto mt-2 flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                        >
                                          <svg
                                            className="h-3.5 w-3.5"
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
                                          {t('publications.modal.publish.viewPost') ||
                                            'Ver publicación'}
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
                                const mediaFiles = publication.media_files || [];
                                const video = mediaFiles.find(
                                  (m: any) =>
                                    m.file_type === 'video' || m.mime_type?.startsWith('video/'),
                                );
                                if (!video) return null;

                                const duration = video.metadata?.duration || 0;
                                const validation = validateVideoDuration(
                                  account.platform,
                                  duration,
                                );

                                if (validation.maxDuration === Infinity || validation.isValid)
                                  return null;

                                return (
                                  <div className="absolute left-2 top-2 z-10 flex animate-pulse items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 shadow-sm dark:border-red-800/30 dark:bg-red-900/30 dark:text-red-400">
                                    <XCircle className="h-3 w-3" />
                                    <span className="leading-none">
                                      MAX {validation.formattedMax}
                                    </span>
                                  </div>
                                );
                              })()}

                            {/* Platform Logo and Info */}
                            <div className="z-10 flex items-center gap-3">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg p-1">
                                <img
                                  src={iconSrc}
                                  alt={account.platform}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="truncate text-base font-bold capitalize text-gray-900 dark:text-white">
                                  {account.platform}
                                </div>
                                <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                                  @{account.account_name}
                                </div>
                              </div>
                            </div>

                            {/* Connected By Info */}
                            {account.user?.name &&
                              !isPublishing &&
                              !isUnpublishing &&
                              !isPublished && (
                                <div className="z-10 truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {t('manageContent.socialMedia.status.connectedBy') ||
                                    'Conectado por'}
                                  : {account.user.name}
                                </div>
                              )}
                          </div>

                          {/* Scheduled Badge - Outside the card */}
                          {isScheduled && !isPublishing && !isUnpublishing && (
                            <div className="absolute -top-3 right-2 z-40">
                              <div className="flex flex-col items-end gap-1">
                                <span className="flex items-center gap-1.5 rounded-full border border-white bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg dark:border-neutral-800">
                                  <Clock className="h-3.5 w-3.5" />
                                  {t('publications.status.scheduled')?.toUpperCase() ||
                                    'PROGRAMADO'}
                                </span>
                                {(() => {
                                  const schedPost = publication.scheduled_posts?.find(
                                    (sp) => sp.social_account_id === account.id,
                                  );
                                  return schedPost?.scheduled_at ? (
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-600 shadow-sm dark:bg-neutral-800 dark:text-gray-400">
                                      {formatDateTimeStyled(
                                        schedPost.scheduled_at,
                                        'short',
                                        'short',
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
                                <span className="flex items-center gap-1.5 rounded-full border border-white bg-gradient-to-r from-gray-600 to-gray-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg dark:border-neutral-800">
                                  <XCircle className="h-3.5 w-3.5" />
                                  {t('publications.modal.publish.removed')?.toUpperCase() ||
                                    'REMOVIDO'}
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
                              <div className="absolute left-2 top-2 z-10">
                                <span className="flex items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/40 dark:text-red-400">
                                  <XCircle className="h-3 w-3" />
                                  {t('publications.modal.publish.failed') || 'Falló'}
                                </span>
                              </div>
                            )}

                          {/* Unpublish Button */}
                          {isPublished && !isUnpublishing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnpublishWithConfirm(account.id, account.platform);
                              }}
                              disabled={isUnpublishing}
                              className="absolute right-3 top-3 z-30 rounded-full bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600 disabled:opacity-50"
                              title="Despublicar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                          {publication && getRecurringPosts && getPublishedRecurringPosts && (
                            <RecurringPostsSection
                              publication={publication}
                              accountId={account.id}
                              getRecurringPosts={getRecurringPosts}
                              getPublishedRecurringPosts={getPublishedRecurringPosts}
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
                  <div className="mb-4 flex items-center gap-2">
                    <img
                      src={getPlatformConfig('youtube').logo}
                      className="h-5 w-5"
                      alt="YouTube"
                    />
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {t('publications.modal.publish.youtubeThumbnails')}
                      {isLoadingThumbnails && (
                        <span className="ml-2 text-xs text-gray-500">
                          {t('publications.modal.publish.loading')}
                        </span>
                      )}
                    </h4>
                  </div>

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

            <div className="sticky bottom-0 z-20 flex gap-3 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 via-white to-gray-50/80 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/50 dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-800/90 dark:shadow-neutral-950/20">
              <button
                type="button"
                onClick={async () => {
                  // Si hay plataformas publicando o reintentando, preguntar si quiere cancelar
                  const hasPublishingPlatforms =
                    publishingPlatforms.length > 0 &&
                    (publication.status === 'publishing' || publication.status === 'retrying');

                  if (hasPublishingPlatforms) {
                    const confirmed = await confirm({
                      title:
                        t('publications.modal.cancelAllConfirm.title') ||
                        '¿Cancelar TODAS las plataformas?',
                      message:
                        t('publications.modal.cancelAllConfirm.message', {
                          count: publishingPlatforms.length,
                        }) ||
                        `¿Estás seguro de que deseas cancelar la publicación en TODAS las plataformas (${publishingPlatforms.length})? Se detendrán todos los reintentos. Las plataformas que ya se publicaron no se verán afectadas.`,
                      confirmText:
                        t('publications.modal.cancelAllConfirm.confirm') || 'Sí, cancelar todas',
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
                }}
                disabled={unpublishing !== null}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
              >
                {publishingPlatforms.length > 0 &&
                (publication.status === 'publishing' || publication.status === 'retrying')
                  ? t('publications.modal.publish.button.cancelAll', {
                      count: publishingPlatforms.length,
                    }) || `Cancelar Todas (${publishingPlatforms.length})`
                  : t('publications.modal.publish.button.cancel') || 'Cerrar'}
              </button>
              {canPublishDirectly ? (
                <button
                  type="button"
                  onClick={handlePublishWithNotifications}
                  disabled={selectedPlatforms.length === 0 || publishing}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 font-medium text-white transition-all hover:from-primary-600 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      {t('publications.modal.publish.publishing')}
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      {t('publications.modal.publish.button.publish')}{' '}
                      {selectedPlatforms.length > 0 && `(${selectedPlatforms.length})`}
                    </>
                  )}
                </button>
              ) : canManageContent ? (
                <button
                  type="button"
                  onClick={handleRequestApproval}
                  disabled={publishing || isPendingReview}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 font-medium text-white transition-all hover:from-primary-600 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPendingReview ? (
                    <>
                      <Clock className="h-4 w-4" />
                      {t('publications.modal.publish.button.pendingReview')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t('publications.modal.publish.button.requestApproval')}
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
