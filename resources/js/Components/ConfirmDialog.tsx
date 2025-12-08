import { useTheme } from "@/Hooks/useTheme";
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
  const { theme } = useTheme();

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
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full max-w-md rounded-lg p-6 shadow-2xl
            ${
              theme === "dark"
                ? "bg-neutral-800 border border-neutral-700"
                : "bg-white"
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}
            >
              <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
            </div>

            <div className="flex-1">
              <DialogTitle
                className={`text-lg font-bold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {title}
              </DialogTitle>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-neutral-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
