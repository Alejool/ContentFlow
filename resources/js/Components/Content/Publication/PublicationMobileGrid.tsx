import Button from '@/Components/common/Modern/Button';
import SimpleContentTypeBadge from '@/Components/Content/common/SimpleContentTypeBadge';
import PublicationThumbnail from '@/Components/Content/Publication/PublicationThumbnail';
import SocialAccountsDisplay from '@/Components/Content/Publication/SocialAccountsDisplay';
import { Publication } from '@/types/Publication';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Clock, Copy, Edit, Eye, Folder, Image, Rocket, Send, Trash2, Video } from 'lucide-react';
import { memo, useState } from 'react';
import toast from 'react-hot-toast';

interface PublicationMobileGridProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: { id: number; platform: string; [key: string]: unknown }[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
  permissions?: string[];
}

interface PageProps {
  auth: {
    user?: { id: number };
    current_workspace?: {
      approval_workflow?: { is_enabled?: boolean };
      user_role_slug?: string;
    };
  };
}

const PublicationMobileGrid = memo(function PublicationMobileGrid({
  items,
  t,
  connectedAccounts,
  getStatusColor,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
  onViewDetails,
  onDuplicate,
  permissions,
}: PublicationMobileGridProps) {
    const { auth } = usePage<PageProps>().props;
    const currentWorkspace = auth.current_workspace;

    const [isSubmittingForApproval, setIsSubmittingForApproval] = useState<Record<number, boolean>>(
      {},
    );

    // Verificar permisos usando la misma lógica que ContentCard
    const canManageContent = permissions?.includes('publish');

    // Verificar si hay workflow habilitado
    const hasWorkflow = currentWorkspace?.approval_workflow?.is_enabled === true;

    // Verificar si el usuario es Owner (puede saltarse el workflow)
    const isOwner = currentWorkspace?.user_role_slug === 'owner';

    // Función para enviar a revisión
    const handleSubmitForApproval = async (item: Publication, e: React.MouseEvent) => {
      e.stopPropagation();

      try {
        setIsSubmittingForApproval((prev) => ({ ...prev, [item.id]: true }));

        const response = await axios.post(`/api/v1/content/${item.id}/submit-for-approval`);

        // Update stores with fresh data
        const publication = response.data?.data?.content || response.data?.data?.publication;
        if (publication) {
          const publicationStoreModule = await import('@/stores/publicationStore');
          const manageContentUIStoreModule = await import('@/stores/manageContentUIStore');

          // CRITICAL: Update immediately with new status
          publicationStoreModule.usePublicationStore.getState().updatePublication(item.id, {
            status: publication.status,
            current_approval_step_id: publication.current_approval_step_id,
            currentApprovalStep: publication.currentApprovalStep,
            approval_logs: publication.approval_logs,
            approvalLogs: publication.approval_logs,
            submitted_for_approval_at: publication.submitted_for_approval_at,
            ...publication,
          });

          // Also update selectedItem if this publication is currently open in a modal
          const selectedItem =
            manageContentUIStoreModule.useManageContentUIStore.getState().selectedItem;
          if (selectedItem?.id === item.id) {
            manageContentUIStoreModule.useManageContentUIStore.getState().updateSelectedItem({
              status: publication.status,
              current_approval_step_id: publication.current_approval_step_id,
              currentApprovalStep: publication.currentApprovalStep,
              approval_logs: publication.approval_logs,
              approvalLogs: publication.approval_logs,
              submitted_for_approval_at: publication.submitted_for_approval_at,
              ...publication,
            });
          }
        }

        toast.success('Enviado a revisión exitosamente');

        // Recargar la página para actualizar el estado
        window.location.reload();
      } catch (error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        console.error('Error submitting for approval:', error);
        toast.error(axiosError.response?.data?.message || 'Error al enviar a revisión');
      } finally {
        setIsSubmittingForApproval((prev) => ({ ...prev, [item.id]: false }));
      }
    };

    const countMediaFiles = (pub: Publication) => {
      if (!pub.media_files || !Array.isArray(pub.media_files) || pub.media_files.length === 0) {
        return { images: 0, videos: 0, total: 0 };
      }
      let images = 0;
      let videos = 0;
      pub.media_files.forEach((f) => {
        if (!f || !f.file_type) return;
        if (f.file_type.includes('image')) images++;
        else if (f.file_type.includes('video')) videos++;
      });
      return { images, videos, total: pub.media_files.length };
    };

    return (
      <div className="grid grid-cols-1 gap-5 px-1 pb-10 md:grid-cols-2">
        {items.map((item) => {
          const mediaCount = countMediaFiles(item);
          const isSubmitting = isSubmittingForApproval[item.id] || false;

          return (
            <div
              key={item.id}
              className="group relative flex min-h-[16rem] flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              {/* Primary Visual/Info Area */}
              <div className="flex-1 p-5">
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50 shadow-inner transition-transform duration-300 group-hover:scale-105 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <PublicationThumbnail publication={item} t={t} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      {/* Content Type Badge */}
                      <SimpleContentTypeBadge
                        contentType={item.content_type}
                        mediaFiles={item.media_files}
                        size="sm"
                      />

                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${getStatusColor(item.status)}`}
                      >
                        {item.status || 'Draft'}
                      </span>
                      {mediaCount.total > 0 && (
                        <div className="flex items-center gap-1.5 opacity-60">
                          {mediaCount.images > 0 && <Image className="h-3 w-3" />}
                          {mediaCount.videos > 0 && <Video className="h-3 w-3" />}
                        </div>
                      )}
                    </div>
                    <h3
                      className="truncate text-lg font-bold leading-snug text-gray-900 dark:text-white"
                      title={item.title || t('publications.table.untitled')}
                    >
                      {item.title || t('publications.table.untitled')}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                      {item.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                {/* Platform Metadata */}
                <div className="mb-4 flex flex-wrap gap-2 border-y border-gray-50 py-3 dark:border-neutral-800/50">
                  <SocialAccountsDisplay
                    publication={item}
                    connectedAccounts={connectedAccounts}
                    compact={true}
                  />
                  {item.campaigns && item.campaigns.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-indigo-100/50 bg-indigo-50/50 px-2 py-1 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                      <Folder className="h-3 w-3 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {item.campaigns.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-auto flex gap-3 border-t border-gray-50 bg-gray-50/50 px-5 py-4 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-800/20">
                {!canManageContent ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.(item);
                    }}
                    variant="ghost"
                    buttonStyle="solid"
                    size="sm"
                    fullWidth
                    icon={Eye}
                  >
                    Ver Detalles
                  </Button>
                ) : (
                  <>
                    {/* Si es Owner, puede publicar directamente sin workflow */}
                    {isOwner &&
                    ['draft', 'rejected', 'approved'].includes(item.status || 'draft') ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPublish(item);
                        }}
                        variant="success"
                        buttonStyle="gradient"
                        size="sm"
                        className="flex-[2]"
                        icon={Rocket}
                      >
                        {t('publications.button.publish') || 'Publicar'}
                      </Button>
                    ) : hasWorkflow &&
                      !isOwner &&
                      ['draft', 'rejected'].includes(item.status || 'draft') ? (
                      /* Si hay workflow y NO es Owner, mostrar "Enviar a Revisión" */
                      <Button
                        onClick={(e) => handleSubmitForApproval(item, e)}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        loadingText={t('publications.button.submitting') || 'Enviando...'}
                        variant="primary"
                        buttonStyle="gradient"
                        size="sm"
                        className="flex-[2]"
                        icon={Send}
                      >
                        {t('publications.button.submitForReview') || 'Enviar a Revisión'}
                      </Button>
                    ) : hasWorkflow && item.status === 'pending_review' ? (
                      /* Si está en revisión, mostrar botón disabled */
                      <Button
                        disabled
                        variant="warning"
                        buttonStyle="solid"
                        size="sm"
                        className="flex-[2]"
                        icon={Clock}
                      >
                        {t('publications.status.pending_review') || 'En Revisión'}
                      </Button>
                    ) : hasWorkflow && item.status === 'approved' ? (
                      /* Si está aprobado, mostrar botón de publicar */
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPublish(item);
                        }}
                        variant="success"
                        buttonStyle="gradient"
                        size="sm"
                        className="flex-[2]"
                        icon={Rocket}
                      >
                        {t('publications.button.publish') || 'Publicar'}
                      </Button>
                    ) : (
                      /* Sin workflow, botón normal de publicar */
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPublish(item);
                        }}
                        variant="success"
                        buttonStyle="gradient"
                        size="sm"
                        className="flex-[2]"
                        icon={Rocket}
                      >
                        {t('publications.button.publish') || 'Publicar'}
                      </Button>
                    )}

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRequest ? onEditRequest(item) : onEdit(item);
                      }}
                      variant="ghost"
                      buttonStyle="outline"
                      size="sm"
                      className="flex-1"
                      icon={Edit}
                    >
                      Editar
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate?.(item.id);
                      }}
                      variant="secondary"
                      buttonStyle="icon"
                      size="sm"
                      icon={Copy}
                    >
                      Duplicar
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      variant="danger"
                      buttonStyle="icon"
                      size="sm"
                      icon={Trash2}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
});

export default PublicationMobileGrid;
