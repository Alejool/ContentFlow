import React from "react";

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TableContainer({
  children,
  className = "",
  title,
  subtitle,
  actions,
}: TableContainerProps) {
  return (
    <div
      className={`rounded-xl shadow-lg border transition-all duration-300 backdrop-blur-lg bg-white/70 border-gray-100/70 text-gray-900 dark:bg-neutral-800/70 dark:border-neutral-700/70 dark:text-white ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-neutral-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            {title && <h2 className="text-lg sm:text-xl font-bold">{title}</h2>}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex gap-2 self-end sm:self-auto">{actions}</div>
          )}
        </div>
      )}
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
