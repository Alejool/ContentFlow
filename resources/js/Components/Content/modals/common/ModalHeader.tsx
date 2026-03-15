import { LucideIcon, Sparkles, X } from 'lucide-react';
import React from 'react';

interface ModalHeaderProps {
  t: (key: string) => string;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
  rightElement?: React.ReactNode;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  t,
  onClose,
  title,
  subtitle,
  icon: Icon = Sparkles,
  iconColor = 'text-primary-500',
  size = 'lg',
  style,
  rightElement,
}) => {
  const sizeClasses = {
    sm: { title: 'text-base', icon: 'w-4 h-4' },
    md: { title: 'text-lg', icon: 'w-5 h-5' },
    lg: { title: 'text-xl', icon: 'w-5 h-5' },
    xl: { title: 'text-2xl', icon: 'w-6 h-6' },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50/80 px-6 py-4 backdrop-blur-md dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-800/90"
      style={style}
    >
      <div>
        <h2
          className={`${currentSize.title} flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100`}
        >
          <Icon className={`${currentSize.icon} ${iconColor}`} />
          {t(title) || title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {t(subtitle) || subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {rightElement}
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-neutral-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ModalHeader;
