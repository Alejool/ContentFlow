import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatDateTime } from "@/Utils/formatDate";
import { Edit, User, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RejectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication;
  onEdit?: () => void;
}

export default function RejectionDetailsModal({
  isOpen,
  onClose,
  publication,
  onEdit,
}: RejectionDetailsModalProps) {
  const { t } = useTranslation();

  const handleEdit = () => {
    onClose();
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg shadow-2xl bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-6 h-6 text-rose-500" />
              {t("approvals.publicationRejected") || "Publicación Rechazada"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-rose-800 dark:text-rose-300">
                {t("approvals.rejectionMessage") ||
                  "Tu publicación ha sido rechazada. Por favor, revisa los comentarios y realiza los ajustes necesarios."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("common.publication") || "Publicación"}
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {publication.title}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <User className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("approvals.rejectedBy") || "Rechazado por"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {publication.rejector?.name || "Admin"}
                  </p>
                  {publication.rejected_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(publication.rejected_at)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t("approvals.rejectionReason") || "Razón del Rechazo"}
                </label>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {publication.rejection_reason ||
                      t("approvals.noReasonProvided") ||
                      "No se proporcionó una razón."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white"
            >
              {t("common.close")}
            </button>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="px-6 py-2.5 rounded-lg font-bold transition-all bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95"
              >
                <Edit className="w-4 h-4" />
                {t("approvals.editPublication") || "Editar Publicación"}
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
