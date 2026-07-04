import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import { useApprovalActions } from '@/Hooks/approval/useApprovalActions';
import { AlertCircle, CheckCircle, Clock, Send, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatDateTimeString } from '@/Utils/formatters';

interface ApprovalStatus {
  status: string;
  current_level: number | null;
  next_approver_role: string | null;
  last_action: string | null;
  last_action_at: string | null;
  last_action_by: string | null;
}

interface ContentApprovalStatusProps {
  content: { id: number | string; [key: string]: unknown };
  approvalStatus: ApprovalStatus;
  canApprove: boolean;
  canReject: boolean;
  canSubmit: boolean;
  isMultiLevel: boolean;
  totalLevels?: number;
  onStatusChange?: () => void;
}

export default function ContentApprovalStatus({
  content,
  approvalStatus,
  canApprove,
  canReject,
  canSubmit,
  isMultiLevel,
  totalLevels = 1,
  onStatusChange,
}: ContentApprovalStatusProps) {
  const { t } = useTranslation();
  const { submitForApproval, approveContent, rejectContent } = useApprovalActions();
  const isSubmitting = submitForApproval.isPending || approveContent.isPending || rejectContent.isPending;
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const getStatusBadge = () => {
    const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> =
      {
        draft: {
          color: 'bg-gray-100 text-gray-700 dark:bg-neutral-900/30 dark:text-neutral-400',
          icon: AlertCircle,
          label: t('approval.status.draft'),
        },
        pending_review: {
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: Clock,
          label: t('approval.status.pending_review'),
        },
        approved: {
          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          icon: CheckCircle,
          label: t('approval.status.approved'),
        },
        rejected: {
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          icon: XCircle,
          label: t('approval.status.rejected'),
        },
        published: {
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          icon: CheckCircle,
          label: t('approval.status.published'),
        },
      };

    const config = statusConfig[approvalStatus.status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${config.color}`}
      >
        <Icon className="h-4 w-4" />
        {config.label}
      </div>
    );
  };

  const getProgressIndicator = () => {
    if (!isMultiLevel || approvalStatus.status !== 'pending_review') {
      return null;
    }

    const currentLevel = approvalStatus.current_level || 0;
    const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

    return (
      <div className="flex items-center gap-2">
        {levels.map((level, index) => (
          <div key={level} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                level < currentLevel
                  ? 'bg-green-500 text-white'
                  : level === currentLevel
                    ? 'animate-pulse bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-neutral-400'
              }`}
            >
              {level < currentLevel ? <CheckCircle className="h-4 w-4" /> : level}
            </div>
            {index < levels.length - 1 && (
              <div
                className={`h-1 w-12 ${
                  level < currentLevel ? 'bg-green-500' : 'bg-gray-200 dark:bg-neutral-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleSubmitForApproval = async () => {
    try {
      const response = await submitForApproval.mutateAsync(content.id);
      const publication = (response as { data?: { content?: unknown; publication?: unknown } })?.data?.content
        || (response as { data?: { publication?: unknown } })?.data?.publication;
      if (publication) {
        const publicationStoreModule = await import('@/stores/Publications/publicationStore');
        const manageContentUIStoreModule = await import('@/stores/Content/manageContentUIStore');
        const pub = publication as Record<string, unknown>;
        publicationStoreModule.usePublicationStore.getState().updatePublication(content.id, pub);
        const selectedItem = manageContentUIStoreModule.useManageContentUIStore.getState().selectedItem;
        if (selectedItem?.id === content.id) {
          manageContentUIStoreModule.useManageContentUIStore.getState().updateSelectedItem(pub);
        }
      }
      toast.success(t('approval.success.submitted'));
      onStatusChange?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || t('approval.errors.submit_failed'));
    }
  };

  const handleApprove = async () => {
    try {
      await approveContent.mutateAsync({ id: content.id, comment: comment || undefined });
      toast.success(t('approval.success.approved'));
      setShowApproveModal(false);
      setComment('');
      onStatusChange?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || t('approval.errors.approve_failed'));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t('approval.errors.rejection_reason_required'));
      return;
    }

    try {
      await rejectContent.mutateAsync({ id: content.id, reason: rejectionReason });
      toast.success(t('approval.success.rejected'));
      setShowRejectModal(false);
      setRejectionReason('');
      onStatusChange?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || t('approval.errors.reject_failed'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Badge and Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-theme-bg-secondary">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="mb-2 font-bold text-gray-900 dark:text-white">
              {t('approval.current_status')}
            </h4>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isMultiLevel ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                {isMultiLevel ? (t('approvals.multiLevelFlow') || 'Flujo Multinivel') : (t('approvals.directFlow') || 'Flujo Directo')}
              </span>
            </div>
          </div>
        </div>

        {/* Sender details */}
        {approvalStatus.status !== 'draft' && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-neutral-800/50">
            <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {t('approvals.last_submission') || 'Último envío por'}: <span className="font-semibold text-gray-700 dark:text-neutral-300">{approvalStatus.last_action_by || t('common.system')}</span>
              </p>
              {approvalStatus.last_action_at && (
                <p className="text-2xs text-gray-400">
                  {formatDateTimeString(approvalStatus.last_action_at)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Next Approver Info */}
        {approvalStatus.status === 'pending_review' && approvalStatus.next_approver_role && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              {isMultiLevel
                ? t('approval.pending_review_by_role', {
                    role: approvalStatus.next_approver_role,
                  })
                : t('approval.pending_review_by_any_admin')}
            </p>
          </div>
        )}

        {/* Progress Indicator for Multi-Level */}
        {isMultiLevel && approvalStatus.status === 'pending_review' && (
          <div className="mt-4">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-neutral-300">
              {t('approval.progress')}
            </p>
            {getProgressIndicator()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-theme-bg-secondary">
        <div className="flex flex-wrap gap-3">
          {/* Submit for Approval */}
          {canSubmit && approvalStatus.status === 'draft' && (
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={handleSubmitForApproval}
              disabled={isSubmitting}
              icon={Send}
            >
              {t('approval.submit_for_approval')}
            </Button>
          )}

          {/* Approve Button */}
          {canApprove && approvalStatus.status === 'pending_review' && (
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={() => setShowApproveModal(true)}
              disabled={isSubmitting}
              icon={ThumbsUp}
            >
              {t('approval.approve')}
            </Button>
          )}

          {/* Reject Button */}
          {canReject && approvalStatus.status === 'pending_review' && (
            <Button
              variant="danger"
              buttonStyle="outline"
              onClick={() => setShowRejectModal(true)}
              disabled={isSubmitting}
              icon={ThumbsDown}
            >
              {t('approval.reject')}
            </Button>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-theme-bg-secondary">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {t('approval.approve_content')}
            </h3>

            <Input
              id="approve-comment"
              label={t('approval.comment_optional')}
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              placeholder={t('approval.add_comment')}
              multiline
              rows={3}
            />

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                buttonStyle="outline"
                onClick={() => {
                  setShowApproveModal(false);
                  setComment('');
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                buttonStyle="solid"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1"
                icon={ThumbsUp}
              >
                {t('approval.approve')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-theme-bg-secondary">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {t('approval.reject_content')}
            </h3>

            <Input
              id="reject-reason"
              label={t('approval.rejection_reason')}
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRejectionReason(e.target.value)
              }
              placeholder={t('approval.explain_rejection')}
              required
            />

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                buttonStyle="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                buttonStyle="solid"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="flex-1"
                icon={ThumbsDown}
              >
                {t('approval.reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
