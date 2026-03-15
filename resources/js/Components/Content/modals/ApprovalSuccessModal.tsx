import Button from "@/Components/common/Modern/Button";
import { formatDateTime } from "@/Utils/formatDate";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckCircle, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl dark:border dark:border-neutral-700/50 dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-700/50">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <CheckCircle className="h-6 w-6 text-green-500" />
              {t("approvals.approvalSuccess") || "¡Publicación Aprobada!"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-neutral-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <p className="text-sm font-medium leading-relaxed text-green-800 dark:text-green-300">
                {t("approvals.approvalSuccessMessage") ||
                  "La publicación ha sido aprobada exitosamente y está lista para ser publicada."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t("common.publication") || "Publicación"}
                </label>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {publicationTitle}
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-neutral-700/30 dark:bg-neutral-900/50">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-200/50 bg-green-100 text-green-600 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-400">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {t("approvals.approvedBy") || "Aprobado por"}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{approverName}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(approvedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 bg-gray-50/30 p-6 dark:border-neutral-700/50 dark:bg-neutral-900/10">
            <Button
              variant="success"
              buttonStyle="gradient"
              onClick={onClose}
              className="px-8"
              icon={CheckCircle}
              rounded="lg"
            >
              {t("common.done") || "Entendido"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
