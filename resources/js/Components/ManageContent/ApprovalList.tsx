import React, { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Publication } from "@/types/Publication";
import { Check, X, Eye, User, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "react-hot-toast";
import RejectionReasonModal from "@/Components/ManageContent/modals/RejectionReasonModal";
import ApprovalSuccessModal from "@/Components/ManageContent/modals/ApprovalSuccessModal";

interface ApprovalListProps {
    publications: Publication[];
    isLoading: boolean;
    onRefresh: () => void;
    onViewDetail: (publication: Publication) => void;
}

export default function ApprovalList({ publications, isLoading, onRefresh, onViewDetail }: ApprovalListProps) {
    const { t } = useTranslation();
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
    const [approvalData, setApprovalData] = useState<{ approverName: string; approvedAt: string } | null>(null);

    const handleApprove = async (publication: Publication) => {
        try {
            const response = await axios.post(route('publications.approve', publication.id));
            if (response.data.success) {
                toast.success(t('approvals.approvedSuccess'));

                // Show success modal with approver info
                setSelectedPublication(publication);
                setApprovalData({
                    approverName: response.data.data.approver.name,
                    approvedAt: response.data.data.approver.approved_at,
                });
                setApprovalModalOpen(true);

                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error approving");
        }
    };

    const handleRejectClick = (publication: Publication) => {
        setSelectedPublication(publication);
        setRejectionModalOpen(true);
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!selectedPublication) return;

        try {
            const response = await axios.post(route('publications.reject', selectedPublication.id), {
                rejection_reason: reason,
            });

            if (response.data.success) {
                toast.success(t('approvals.rejectedSuccess') || "Publication rejected");
                setRejectionModalOpen(false);
                setSelectedPublication(null);
                onRefresh();
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.response?.data?.errors?.rejection_reason?.[0] || "Error rejecting";
            toast.error(errorMessage);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'pending_review':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
            case 'approved':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700';
            case 'rejected':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-700';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (publications.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700">
                <div className="bg-gray-100 dark:bg-neutral-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="text-gray-400 w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('approvals.noPending')}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{t('approvals.noPendingDesc')}</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {publications.map((pub) => (
                    <div key={pub.id} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(pub.status)}`}>
                                        {t(`manageContent.status.${pub.status}`) || pub.status}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1.5" title={format(new Date(pub.updated_at), 'PPP HH:mm', { locale: es })}>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {format(new Date(pub.updated_at), 'HH:mm')} ({formatDistanceToNow(new Date(pub.updated_at), { addSuffix: true, locale: es })})
                                        </span>
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white truncate">{pub.title}</h4>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <User className="w-4 h-4" />
                                    <span>{pub.user?.name || "User"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:self-center">
                                <button
                                    onClick={() => onViewDetail(pub)}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                                    title={t('common.view')}
                                >
                                    <Eye className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleApprove(pub)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-lg shadow-green-600/20 active:scale-95"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{t('approvals.approve')}</span>
                                </button>
                                <button
                                    onClick={() => handleRejectClick(pub)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                                >
                                    <X className="w-4 h-4" />
                                    <span>{t('approvals.reject') || "Reject"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rejection Reason Modal */}
            {selectedPublication && (
                <RejectionReasonModal
                    isOpen={rejectionModalOpen}
                    onClose={() => {
                        setRejectionModalOpen(false);
                        setSelectedPublication(null);
                    }}
                    onSubmit={handleRejectSubmit}
                    publicationTitle={selectedPublication.title}
                />
            )}

            {/* Approval Success Modal */}
            {selectedPublication && approvalData && (
                <ApprovalSuccessModal
                    isOpen={approvalModalOpen}
                    onClose={() => {
                        setApprovalModalOpen(false);
                        setSelectedPublication(null);
                        setApprovalData(null);
                    }}
                    publicationTitle={selectedPublication.title}
                    approverName={approvalData.approverName}
                    approvedAt={approvalData.approvedAt}
                />
            )}
        </>
    );
}
