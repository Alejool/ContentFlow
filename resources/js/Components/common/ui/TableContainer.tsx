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
      className={`rounded-lg border border-gray-100/70 bg-white/70 text-gray-900 shadow-lg backdrop-blur-lg transition-all duration-300 dark:border-neutral-700/70 dark:bg-neutral-800/70 dark:text-white ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 dark:border-neutral-700/50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            {title && <h2 className="text-lg font-bold sm:text-xl">{title}</h2>}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-2 self-end sm:self-auto">{actions}</div>}
        </div>
      )}
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
