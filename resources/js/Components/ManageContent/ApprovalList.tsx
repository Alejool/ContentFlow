import React from "react";
import { Publication } from "@/types/Publication";
import { Check, X, Eye, User, Clock, ExternalLink } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "react-hot-toast";

interface ApprovalListProps {
    publications: Publication[];
    isLoading: boolean;
    onRefresh: () => void;
    onViewDetail: (publication: Publication) => void;
}

export default function ApprovalList({ publications, isLoading, onRefresh, onViewDetail }: ApprovalListProps) {
    const { t } = useTranslation();

    const handleApprove = async (id: number) => {
        try {
            const response = await axios.post(route('publications.approve', id));
            if (response.data.success) {
                toast.success(t('approvals.approvedSuccess'));
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error approving");
        }
    };

    const handleReject = async (id: number) => {
        try {
            const response = await axios.post(route('publications.reject', id));
            if (response.data.success) {
                toast.success(t('approvals.rejectedSuccess') || "Publication rejected");
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error rejecting");
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
        <div className="space-y-4">
            {publications.map((pub) => (
                <div key={pub.id} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700">
                                    {t('manageContent.status.pending_review')}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(pub.created_at).toLocaleDateString()}
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
                            <Link
                                href={route('publications.show', pub.id)}
                                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                title={t('common.viewDirectly') || "Ver pantalla completa"}
                            >
                                <ExternalLink className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => handleApprove(pub.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-lg shadow-green-600/20 active:scale-95"
                            >
                                <Check className="w-4 h-4" />
                                <span>{t('approvals.approve')}</span>
                            </button>
                            <button
                                onClick={() => handleReject(pub.id)}
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
    );
}
