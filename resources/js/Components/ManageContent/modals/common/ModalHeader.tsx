import React from "react";
import { Sparkles, X } from "lucide-react";

interface ModalHeaderProps {
  theme: "dark" | "light";
  t: (key: string) => string;
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ theme, t, onClose }) => {
  const modalHeaderBg =
    theme === "dark"
      ? "bg-gradient-to-r from-neutral-900 to-neutral-800"
      : "bg-gradient-to-r from-gray-50 to-white";
  const modalHeaderBorder =
    theme === "dark" ? "border-neutral-700" : "border-gray-100";
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const textTertiary = theme === "dark" ? "text-gray-500" : "text-gray-400";

  return (
    <div
      className={`px-8 py-6 border-b ${modalHeaderBorder} ${modalHeaderBg} flex items-center justify-between sticky top-0 z-10`}
    >
      <div>
        <h2
          className={`text-2xl font-bold ${textPrimary} flex items-center gap-2`}
        >
          <Sparkles className="w-6 h-6 text-primary-500" />
          {t("publications.modal.edit.title") || "Edit Publication"}
        </h2>
        <p className={`${textSecondary} mt-1`}>
          {t("publications.modal.add.subtitle") ||
            "Update your content details"}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`p-2 hover:${
          theme === "dark" ? "bg-neutral-700" : "bg-gray-100"
        } rounded-full transition-colors ${textTertiary}`}
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ModalHeader;
