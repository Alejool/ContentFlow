import { LucideIcon, Sparkles, X } from "lucide-react";
import React from "react";

interface ModalHeaderProps {
  t: (key: string) => string;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
  style?: React.CSSProperties;
  rightElement?: React.ReactNode;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  t,
  onClose,
  title,
  subtitle,
  icon: Icon = Sparkles,
  iconColor = "text-primary-500",
  size = "lg",
  style,
  rightElement,
}) => {
  const sizeClasses = {
    sm: { title: "text-lg", icon: "w-4 h-4" },
    md: { title: "text-xl", icon: "w-5 h-5" },
    lg: { title: "text-2xl", icon: "w-6 h-6" },
    xl: { title: "text-2xl", icon: "w-6 h-6" },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className="px-8 py-6 border-b border-gray-100 dark:border-neutral-700 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-between sticky top-0 z-10"
      style={style}
    >
      <div>
        <h2
          className={`${currentSize.title} font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2`}
        >
          <Icon className={`${currentSize.icon} ${iconColor}`} />
          {t(title) || title}
        </h2>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t(subtitle) || subtitle}
          </p>
        )}
      </div>
      <div className="flex py-4 items-center gap-4">
        {rightElement}
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ModalHeader;
