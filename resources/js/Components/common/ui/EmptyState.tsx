interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
  imageSize?: "sm" | "md" | "lg";
}

export default function EmptyState({
  title,
  description,
  className = "",
  imageSize = "md",
}: EmptyStateProps) {
  const sizeMap = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-64 h-64",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-800 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700/50 shadow-sm ${className}`}
    >
      <div className={`${sizeMap[imageSize]} mb-6 opacity-80 dark:opacity-60`}>
        <img
          src="/assets/empty-state.svg"
          alt="No results"
          className="w-full h-full object-contain"
        />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
