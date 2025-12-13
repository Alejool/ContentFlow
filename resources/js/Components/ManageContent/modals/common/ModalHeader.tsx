import React from "react";
import { Sparkles, X, LucideIcon } from "lucide-react";

interface ModalHeaderProps {
  theme: "dark" | "light";
  t: (key: string) => string;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  theme,
  t,
  onClose,
  title,
  subtitle,
  icon: Icon = Sparkles,
  iconColor = "text-primary-500",
  size = "lg",
}) => {
  const modalHeaderBg =
    theme === "dark"
      ? "bg-gradient-to-r from-neutral-900 to-neutral-800"
      : "bg-gradient-to-r from-gray-50 to-white";
  const modalHeaderBorder =
    theme === "dark" ? "border-neutral-700" : "border-gray-100";
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const textTertiary = theme === "dark" ? "text-gray-500" : "text-gray-400";

  const sizeClasses = {
    sm: { title: "text-lg", icon: "w-4 h-4" },
    md: { title: "text-xl", icon: "w-5 h-5" },
    lg: { title: "text-2xl", icon: "w-6 h-6" },
    xl: { title: "text-2xl", icon: "w-6 h-6" },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={`px-8 py-6 border-b ${modalHeaderBorder} ${modalHeaderBg} flex items-center justify-between sticky top-0 z-10`}
    >
      <div>
        <h2
          className={`${currentSize.title} font-bold ${textPrimary} flex items-center gap-2`}
        >
          <Icon className={`${currentSize.icon} ${iconColor}`} />
          {t(title) || title}
        </h2>
        {subtitle && (
          <p className={`${textSecondary} mt-1`}>{t(subtitle) || subtitle}</p>
        )}
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
