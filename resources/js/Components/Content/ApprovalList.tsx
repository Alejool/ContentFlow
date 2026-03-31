import ApprovalSuccessModal from '@/Components/Content/modals/ApprovalSuccessModal';
import RejectionReasonModal from '@/Components/Content/modals/RejectionReasonModal';
import AlertCard from '@/Components/common/Modern/AlertCard';
import Button from '@/Components/common/Modern/Button';
import AdvancedPagination from '@/Components/common/ui/AdvancedPagination';
import EmptyState from '@/Components/common/ui/EmptyState';
import { VirtualList } from '@/Components/common/ui/VirtualList';
import { formatDateTimeString } from '@/Utils/dateHelpers';
import { getDateFnsLocale } from '@/Utils/dateLocales';
import { useManageContentUIStore } from '@/stores/manageContentUIStore';
import { usePublicationStore } from '@/stores/publicationStore';
import { ApprovalRequest } from '@/types/ApprovalTypes';
import { Publication } from '@/types/Publication';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Locale, formatDistanceToNow } from 'date-fns';
import { Check, Clock, Eye, FileText, Layers, User, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ApprovalListProps {
  requests: ApprovalRequest[] | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  onViewDetail: (publication: Publication) => void;
}

interface ApprovalRequestItemProps {
  request: ApprovalRequest;
  onViewDetail: (publication: Publication) => void;
  onApprove: (request: ApprovalRequest) => void;
  onReject: (request: ApprovalRequest) => void;
  getStatusColor: (status?: string) => string;
  t: any;
  locale: Locale;
}

function ApprovalRequestItem({
  request,
  onViewDetail,
  onApprove,
  onReject,
  getStatusColor,
  t,
  locale,
}: ApprovalRequestItemProps) {
  const publication = request.publication;
  if (!publication) return null;

  // Get media preview
  const firstMedia = publication.media_files?.[0];
  const mediaPreview = firstMedia?.thumbnail?.file_path || firstMedia?.file_path;

  return (
    <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-primary-400 hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-600">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm ${getStatusColor(request.status)}`}
          >
            {t(`approvals.status.${request.status}`) || request.status}
          </span>
          {request.currentStep && (
            <span className="flex items-center gap-1.5 rounded-full border border-primary-300 bg-primary-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-700 shadow-sm dark:border-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              <Layers className="h-3.5 w-3.5" />
              {request.currentStep.level_name}
              {request.workflow?.levels &&
                ` (${request.currentStep.level_number}/${request.workflow.levels.length})`}
            </span>
          )}
          <span
            className="ml-auto flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-400"
            title={formatDateTimeString(request.submitted_at, {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">
              {formatDistanceToNow(new Date(request.submitted_at), {
                addSuffix: true,
                locale,
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Media Preview */}
          {mediaPreview && (
            <div className="flex-shrink-0">
              <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-md transition-shadow group-hover:shadow-lg dark:from-neutral-900 dark:to-neutral-800 lg:w-40">
                <img
                  src={mediaPreview}
                  alt={publication.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          )}

          {/* Content Details */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Title */}
            <div>
              <h3 className="mb-2 line-clamp-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                {publication.title}
              </h3>
              {publication.description && (
                <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {publication.description}
                </p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Submitter */}
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-neutral-900/50">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                  <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t('approvals.historyTable.submittedBy')}
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {request.submitter?.name || 'User'}
                  </p>
                </div>
              </div>

              {/* Content Type */}
              {publication.content_type && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-neutral-900/50">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t('common.type') || 'Tipo'}
                    </p>
                    <p className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                      {publication.content_type}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Progress */}
            {request.workflow?.levels && request.currentStep && (
              <div className="border-t border-gray-200 pt-3 dark:border-neutral-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('approvals.progress') || 'Progreso de Aprobación'}
                  </span>
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {request.currentStep.level_number} / {request.workflow.levels.length}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                    style={{
                      width: `${(request.currentStep.level_number / request.workflow.levels.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-900/50">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            buttonStyle="outline"
            onClick={() => onViewDetail(publication)}
            className="flex-1 border-gray-300 hover:bg-gray-100 dark:border-neutral-600 dark:hover:bg-neutral-800 sm:flex-none"
            icon={Eye}
            rounded="lg"
          >
            {t('common.viewDetails') || 'Ver Detalles'}
          </Button>

          <div className="flex flex-1 gap-3">
            <Button
              variant="success"
              buttonStyle="gradient"
              onClick={() => onApprove(request)}
              className="flex-1 text-white shadow-md hover:shadow-lg"
              icon={Check}
              rounded="lg"
            >
              {t('approvals.approve') || 'Aprobar'}
            </Button>

            <Button
              variant="danger"
              buttonStyle="gradient"
              onClick={() => onReject(request)}
              className="flex-1 text-white shadow-md hover:shadow-lg"
              icon={X}
              rounded="lg"
            >
              {t('approvals.reject') || 'Rechazar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalList({
  requests,
  isLoading,
  onRefresh,
  onViewDetail,
}: ApprovalListProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [approvalData, setApprovalData] = useState<{
    approverName: string;
    approvedAt: string;
  } | null>(null);

  // Get store methods
  const updatePublication = usePublicationStore((s) => s.updatePublication);
  const updateSelectedItem = useManageContentUIStore((s) => s.updateSelectedItem);
  const selectedItem = useManageContentUIStore((s) => s.selectedItem);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // Check if user has admin permission
  const { auth } = usePage<any>().props;
  const hasAdminPermission = auth.current_workspace?.permissions?.includes('approve') || false;

  const handleApprove = async (request: ApprovalRequest) => {
    try {
      const response = await axios.post(route('api.v1.approvals.approve', request.id), {
        comment: null, // Opcional: agregar modal para comentario
      });

      if (response.data.success) {
        const updatedRequest = response.data.request;

        if (updatedRequest.status === 'approved') {
          // Aprobación final
          toast.success(t('approvals.approvedSuccess'));
          setSelectedRequest(updatedRequest);
          setApprovalData({
            approverName: updatedRequest.completedBy?.name || auth.user.name,
            approvedAt: updatedRequest.completed_at,
          });
          setApprovalModalOpen(true);
        } else {
          // Aprobación parcial - avanzó al siguiente nivel
          toast.success(
            t('approvals.levelApproved', {
              level: updatedRequest.currentStep?.level_name || 'Siguiente nivel',
            }),
          );

          // Actualizar publicación en el store
          if (updatedRequest.publication) {
            updatePublication(updatedRequest.publication_id, updatedRequest.publication);
          }

          // Actualizar item seleccionado si está abierto
          if (selectedItem?.id === updatedRequest.publication_id) {
            updateSelectedItem(updatedRequest.publication);
          }
        }

        // Refrescar lista
        onRefresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('approvals.errors.approveFailed'));
    }
  };

  const handleRejectClick = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!selectedRequest) return;

    try {
      const response = await axios.post(route('api.v1.approvals.reject', selectedRequest.id), {
        reason: reason,
      });

      if (response.data.success) {
        toast.success(t('approvals.rejectedSuccess') || 'Request rejected');
        setRejectionModalOpen(false);
        setSelectedRequest(null);

        // Refrescar lista
        onRefresh();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.reason?.[0] ||
        t('approvals.errors.rejectFailed');
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            {/* Header skeleton */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-800">
              <div className="flex items-center gap-2">
                <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="h-7 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="ml-auto h-7 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row">
                {/* Media skeleton */}
                <div className="flex-shrink-0">
                  <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-700 lg:w-40" />
                </div>

                {/* Details skeleton */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-700" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-neutral-700" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-900/50" />
                    <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-900/50" />
                  </div>
                  <div className="space-y-2 pt-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-neutral-700" />
                    <div className="h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions skeleton */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-900/50">
              <div className="flex gap-3">
                <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-neutral-700" />
                <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200 dark:bg-neutral-700" />
                <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200 dark:bg-neutral-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const safeRequests = requests ?? [];

  if (!safeRequests.length && !isLoading) {
    return (
      <EmptyState title={t('approvals.noPending')} description={t('approvals.noPendingDesc')} />
    );
  }

  // Calculate pagination
  const totalItems = safeRequests.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const displayedRequests = safeRequests.slice(startIndex, startIndex + perPage);

  const renderItem = (request: ApprovalRequest) => (
    <ApprovalRequestItem
      request={request}
      onViewDetail={onViewDetail}
      onApprove={handleApprove}
      onReject={handleRejectClick}
      getStatusColor={getStatusColor}
      t={t}
      locale={locale}
    />
  );

  return (
    <>
      {!hasAdminPermission && (
        <AlertCard
          type="info"
          title={t('approvals.workflowAssignment.title') || 'Aprobaciones asignadas'}
          message={
            t('approvals.workflowAssignment.description') ||
            'Estás viendo solo las solicitudes que requieren tu aprobación según tu rol o asignación en el flujo de trabajo.'
          }
          className="mb-4"
        />
      )}

      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <VirtualList
            items={displayedRequests}
            estimatedItemSize={120}
            overscan={3}
            renderItem={renderItem}
            emptyState={
              <EmptyState
                title={t('approvals.noPending')}
                description={t('approvals.noPendingDesc')}
              />
            }
          />
        </div>

        <div className="mt-4 bg-white pt-4 dark:border-neutral-700 dark:bg-neutral-900">
          <AdvancedPagination
            currentPage={currentPage}
            lastPage={totalPages}
            total={totalItems}
            perPage={perPage || 12}
            onPageChange={setCurrentPage}
            onPerPageChange={(val) => {
              setPerPage(val);
              setCurrentPage(1);
            }}
            t={t}
          />
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {selectedRequest && (
        <RejectionReasonModal
          isOpen={rejectionModalOpen}
          onClose={() => {
            setRejectionModalOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleRejectSubmit}
          publicationTitle={selectedRequest.publication?.title || ''}
        />
      )}

      {/* Approval Success Modal */}
      {selectedRequest && approvalData && (
        <ApprovalSuccessModal
          isOpen={approvalModalOpen}
          onClose={() => {
            setApprovalModalOpen(false);
            setSelectedRequest(null);
            setApprovalData(null);
          }}
          publicationTitle={selectedRequest.publication?.title || ''}
          approverName={approvalData.approverName}
          approvedAt={approvalData.approvedAt}
        />
      )}
    </>
  );
}
