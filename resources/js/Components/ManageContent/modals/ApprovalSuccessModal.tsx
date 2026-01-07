import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, CheckCircle, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ApprovalSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    publicationTitle: string;
    approverName: string;
    approvedAt: string;
}

export default function ApprovalSuccessModal({
    isOpen,
    onClose,
    publicationTitle,
    approverName,
    approvedAt,
}: ApprovalSuccessModalProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                aria-hidden="true"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-xl shadow-2xl bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700">
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            {t("approvals.approvalSuccess") || "¡Publicación Aprobada!"}
                        </DialogTitle>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-green-800 dark:text-green-300">
                                {t("approvals.approvalSuccessMessage") || "La publicación ha sido aprobada exitosamente y está lista para ser publicada."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t("common.publication") || "Publicación"}
                                </label>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {publicationTitle}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t("approvals.approvedBy") || "Aprobado por"}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {approverName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {format(new Date(approvedAt), "PPP 'a las' HH:mm", { locale: es })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-neutral-700">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg font-bold transition-all bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {t("common.done") || "Entendido"}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
