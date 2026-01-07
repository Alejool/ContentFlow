import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface RejectionReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    publicationTitle: string;
}

export default function RejectionReasonModal({
    isOpen,
    onClose,
    onSubmit,
    publicationTitle,
}: RejectionReasonModalProps) {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (reason.trim().length < 10) {
            setError(t("approvals.rejectionReasonTooShort") || "La razón debe tener al menos 10 caracteres");
            return;
        }
        if (reason.trim().length > 500) {
            setError(t("approvals.rejectionReasonTooLong") || "La razón no puede exceder 500 caracteres");
            return;
        }
        onSubmit(reason.trim());
        setReason("");
        setError("");
    };

    const handleClose = () => {
        setReason("");
        setError("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                aria-hidden="true"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-xl shadow-2xl bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700">
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-rose-500" />
                            {t("approvals.rejectPublication") || "Rechazar Publicación"}
                        </DialogTitle>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t("approvals.rejectionReasonDescription") || "Proporciona una razón detallada para el rechazo de"}{" "}
                            <span className="font-semibold text-gray-900 dark:text-white">"{publicationTitle}"</span>
                        </p>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("approvals.rejectionReason") || "Razón del Rechazo"}
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    setError("");
                                }}
                                placeholder={t("approvals.rejectionReasonPlaceholder") || "Ej. El contenido no cumple con las políticas de la empresa..."}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                                rows={5}
                                maxLength={500}
                            />
                            <div className="flex justify-between items-center text-xs">
                                <span className={`${error ? "text-rose-500" : "text-gray-500 dark:text-gray-400"}`}>
                                    {error || `${reason.length}/500 caracteres`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-neutral-700">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={reason.trim().length < 10}
                            className="px-6 py-2.5 rounded-lg font-bold transition-all bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <AlertCircle className="w-4 h-4" />
                            {t("approvals.reject") || "Rechazar"}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
