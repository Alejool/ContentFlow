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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white shadow-2xl dark:border dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-700">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <XCircle className="h-6 w-6 text-rose-500" />
              {t("approvals.publicationRejected") || "Publicación Rechazada"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
              <p className="text-sm text-rose-800 dark:text-rose-300">
                {t("approvals.rejectionMessage") ||
                  "Tu publicación ha sido rechazada. Por favor, revisa los comentarios y realiza los ajustes necesarios."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("common.publication") || "Publicación"}
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {publication.title}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-neutral-900/50">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <User className="h-5 w-5" />
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
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("approvals.rejectionReason") || "Razón del Rechazo"}
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {publication.rejection_reason ||
                      t("approvals.noReasonProvided") ||
                      "No se proporcionó una razón."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 p-6 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
            >
              {t("common.close")}
            </button>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 active:scale-95"
              >
                <Edit className="h-4 w-4" />
                {t("approvals.editPublication") || "Editar Publicación"}
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
