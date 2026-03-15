import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-primary-100 dark:bg-primary-900/30",
          iconColor: "text-primary-600 dark:text-primary-400",
          confirmBtn: "bg-primary-600 hover:bg-primary-700 text-white",
        };
      case "warning":
        return {
          iconBg: "bg-primary-100 dark:bg-primary-900/30",
          iconColor: "text-primary-600 dark:text-primary-400",
          confirmBtn: "bg-primary-600 hover:bg-primary-700 text-white",
        };
      case "info":
        return {
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg border border-transparent bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 flex-shrink-0 rounded-full ${styles.iconBg} flex items-center justify-center`}
            >
              <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
            </div>

            <div className="flex-1">
              <DialogTitle className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
