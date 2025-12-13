import React from "react";
import { Upload } from "lucide-react";

interface ModalFooterProps {
  theme: "dark" | "light";
  t: (key: string) => string;
  isSubmitting: boolean;
  onClose: () => void;
  borderColor: string;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  theme,
  t,
  isSubmitting,
  onClose,
  borderColor,
}) => {
  return (
    <div className={`pt-6 border-t ${borderColor} flex justify-end gap-3`}>
      <button
        type="button"
        onClick={onClose}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          theme === "dark"
            ? "hover:bg-neutral-700 text-gray-300"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        {t("publications.modal.edit.button.cancel")}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-6 py-2 rounded-lg font-medium text-white shadow-lg transition-all flex items-center gap-2 ${
          isSubmitting
            ? "opacity-50 cursor-not-allowed"
            : "hover:shadow-primary-500/25 active:scale-95"
        } bg-gradient-to-r from-primary-600 to-primary-700`}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {t("publications.modal.edit.button.save")}
          </>
        )}
      </button>
    </div>
  );
};

export default ModalFooter;
