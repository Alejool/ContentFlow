import Button from "@/Components/common/Modern/Button";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl shadow-2xl bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700/50 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700/50">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              {t("approvals.approvalSuccess") || "¡Publicación Aprobada!"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed font-medium">
                {t("approvals.approvalSuccessMessage") ||
                  "La publicación ha sido aprobada exitosamente y está lista para ser publicada."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("common.publication") || "Publicación"}
                </label>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {publicationTitle}
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-700/30">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/50">
                    <User className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {t("approvals.approvedBy") || "Aprobado por"}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {approverName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {format(new Date(approvedAt), "PPP 'a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-100 dark:border-neutral-700/50 bg-gray-50/30 dark:bg-neutral-900/10">
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
